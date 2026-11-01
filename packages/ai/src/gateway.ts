import { AiAction, AiInvocation, AiStreamChunk } from '@pairly/contracts';
import { buildAiPrompt } from './prompts.js';
import { estimateTokens } from './tokens.js';

export type AiProviderType = 'anthropic' | 'openai' | 'mock';

export interface AiGatewayConfig {
  defaultProvider?: AiProviderType;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  anthropicModel?: string;
  openaiModel?: string;
  timeoutMs?: number;
}

export interface AiGatewayInvocationOptions {
  apiKey?: string;
  provider?: AiProviderType;
  model?: string;
}

export interface AiGatewayResult {
  requestId: string;
  action: AiAction;
  model: string;
  provider: AiProviderType;
  explanation: string;
  suggestedCode?: string;
  wasTruncated: boolean;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export class AiGateway {
  private config: Required<AiGatewayConfig>;

  constructor(config: AiGatewayConfig = {}) {
    this.config = {
      defaultProvider:
        config.defaultProvider ||
        (process.env.AI_DEFAULT_PROVIDER as AiProviderType) ||
        (process.env.ANTHROPIC_API_KEY
          ? 'anthropic'
          : process.env.OPENAI_API_KEY
            ? 'openai'
            : 'mock'),
      anthropicApiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY || '',
      anthropicModel:
        config.anthropicModel || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      openaiModel: config.openaiModel || process.env.OPENAI_MODEL || 'gpt-4o',
      timeoutMs: config.timeoutMs || 30_000,
    };
  }

  /**
   * Determine active provider based on request, BYOK options, or environment configuration.
   */
  public resolveProvider(
    requestedModel?: string,
    options?: AiGatewayInvocationOptions,
  ): { provider: AiProviderType; modelName: string; apiKey?: string } {
    const overrideKey = options?.apiKey;
    const overrideProvider = options?.provider;
    const model = options?.model || requestedModel;

    // 1. Explicit provider override
    if (overrideProvider) {
      if (overrideProvider === 'anthropic') {
        return {
          provider: 'anthropic',
          modelName: model || this.config.anthropicModel,
          apiKey: overrideKey || this.config.anthropicApiKey,
        };
      }
      if (overrideProvider === 'openai') {
        return {
          provider: 'openai',
          modelName: model || this.config.openaiModel,
          apiKey: overrideKey || this.config.openaiApiKey,
        };
      }
      return { provider: 'mock', modelName: 'mock-pairly-engine' };
    }

    // 2. Resolve by model name
    if (model) {
      const lower = model.toLowerCase();
      if (lower.includes('claude') || lower.includes('sonnet')) {
        const key = overrideKey || this.config.anthropicApiKey;
        return {
          provider: key ? 'anthropic' : 'mock',
          modelName: model,
          apiKey: key,
        };
      }
      if (lower.includes('gpt') || lower.startsWith('o1') || lower.startsWith('o3')) {
        const key = overrideKey || this.config.openaiApiKey;
        return {
          provider: key ? 'openai' : 'mock',
          modelName: model,
          apiKey: key,
        };
      }
      if (lower === 'mock') {
        return { provider: 'mock', modelName: 'mock-pairly-engine' };
      }
    }

    // 3. Resolve by default provider config
    if (this.config.defaultProvider === 'anthropic') {
      const key = overrideKey || this.config.anthropicApiKey;
      if (key) {
        return {
          provider: 'anthropic',
          modelName: this.config.anthropicModel,
          apiKey: key,
        };
      }
    }
    if (this.config.defaultProvider === 'openai') {
      const key = overrideKey || this.config.openaiApiKey;
      if (key) {
        return {
          provider: 'openai',
          modelName: this.config.openaiModel,
          apiKey: key,
        };
      }
    }

    return { provider: 'mock', modelName: 'mock-pairly-engine' };
  }

  /**
   * Execute an AI invocation request with live provider or fallback.
   */
  public async invoke(
    invocation: AiInvocation,
    options?: AiGatewayInvocationOptions,
  ): Promise<AiGatewayResult> {
    const requestId = `ai-req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const { provider, modelName, apiKey } = this.resolveProvider(invocation.model, options);
    const { system, userMessage, wasTruncated } = buildAiPrompt(
      invocation.action,
      invocation.context,
      invocation.prompt,
    );

    const promptTokens = estimateTokens(system) + estimateTokens(userMessage);

    if (provider === 'anthropic' && apiKey) {
      try {
        return await this.callAnthropic(
          requestId,
          invocation,
          system,
          userMessage,
          promptTokens,
          wasTruncated,
          apiKey,
          modelName,
        );
      } catch (err) {
        console.warn('Anthropic live invocation failed, falling back to mock completion:', err);
      }
    }

    if (provider === 'openai' && apiKey) {
      try {
        return await this.callOpenAi(
          requestId,
          invocation,
          system,
          userMessage,
          promptTokens,
          wasTruncated,
          apiKey,
          modelName,
        );
      } catch (err) {
        console.warn('OpenAI live invocation failed, falling back to mock completion:', err);
      }
    }

    // Provider is mock or live provider failed safely
    const mockResult = this.generateMockCompletion(invocation);
    const completionTokens =
      estimateTokens(mockResult.explanation) + estimateTokens(mockResult.suggestedCode || '');

    return {
      requestId,
      action: invocation.action,
      model: modelName,
      provider: 'mock',
      explanation: mockResult.explanation,
      suggestedCode: mockResult.suggestedCode,
      wasTruncated,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
    };
  }

  /**
   * Stream response chunks in real-time via SSE or simulated token stream (FR-AI-06).
   */
  public async *stream(
    invocation: AiInvocation,
    options?: AiGatewayInvocationOptions,
  ): AsyncIterable<AiStreamChunk> {
    const { provider, modelName, apiKey } = this.resolveProvider(invocation.model, options);
    const requestId = `ai-req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const { system, userMessage } = buildAiPrompt(
      invocation.action,
      invocation.context,
      invocation.prompt,
    );

    // 1. Attempt live streaming for Anthropic
    if (provider === 'anthropic' && apiKey) {
      try {
        yield* this.streamAnthropic(requestId, system, userMessage, apiKey, modelName);
        return;
      } catch (err) {
        console.warn('Anthropic live stream failed, falling back:', err);
      }
    }

    // 2. Attempt live streaming for OpenAI
    if (provider === 'openai' && apiKey) {
      try {
        yield* this.streamOpenAi(requestId, system, userMessage, apiKey, modelName);
        return;
      } catch (err) {
        console.warn('OpenAI live stream failed, falling back:', err);
      }
    }

    // 3. Fallback: Simulated word-by-word streaming from mock completion
    const result = await this.invoke(invocation, options);
    const fullText = result.suggestedCode
      ? `${result.explanation}\n\n\`\`\`${invocation.context.activeFile.language}\n${result.suggestedCode}\n\`\`\``
      : result.explanation;

    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      yield {
        requestId: result.requestId,
        chunk: word,
        isDone: i === words.length - 1,
      };
    }
  }

  /**
   * Live streaming generator for Anthropic Claude.
   */
  private async *streamAnthropic(
    requestId: string,
    system: string,
    userMessage: string,
    apiKey: string,
    model: string,
  ): AsyncIterable<AiStreamChunk> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          stream: true,
          system,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Anthropic streaming error: ${resp.status} ${resp.statusText}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const rawJson = trimmed.slice(6).trim();
            try {
              const data = JSON.parse(rawJson);
              if (data.type === 'content_block_delta' && data.delta?.text) {
                yield {
                  requestId,
                  chunk: data.delta.text,
                  isDone: false,
                };
              }
              if (data.type === 'message_stop') {
                yield {
                  requestId,
                  chunk: '',
                  isDone: true,
                };
                return;
              }
            } catch {
              // Ignore partial frame
            }
          }
        }
      }

      yield {
        requestId,
        chunk: '',
        isDone: true,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Live streaming generator for OpenAI GPT-4o.
   */
  private async *streamOpenAi(
    requestId: string,
    system: string,
    userMessage: string,
    apiKey: string,
    model: string,
  ): AsyncIterable<AiStreamChunk> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`OpenAI streaming error: ${resp.status} ${resp.statusText}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const rawData = trimmed.slice(6).trim();
            if (rawData === '[DONE]') {
              yield {
                requestId,
                chunk: '',
                isDone: true,
              };
              return;
            }
            try {
              const parsed = JSON.parse(rawData);
              const textChunk = parsed.choices?.[0]?.delta?.content;
              if (textChunk) {
                yield {
                  requestId,
                  chunk: textChunk,
                  isDone: false,
                };
              }
            } catch {
              // Ignore partial frame
            }
          }
        }
      }

      yield {
        requestId,
        chunk: '',
        isDone: true,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async callAnthropic(
    requestId: string,
    invocation: AiInvocation,
    system: string,
    userMessage: string,
    promptTokens: number,
    wasTruncated: boolean,
    apiKey: string,
    model: string,
  ): Promise<AiGatewayResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        throw new Error(`Anthropic API error: ${resp.status} ${resp.statusText}`);
      }

      const data = (await resp.json()) as {
        content: Array<{ type: string; text: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      const rawContent = data.content?.[0]?.text || '';
      const parsed = this.parseCodeFromOutput(rawContent, invocation.action);

      return {
        requestId,
        action: invocation.action,
        model,
        provider: 'anthropic',
        explanation: parsed.explanation,
        suggestedCode: parsed.suggestedCode,
        wasTruncated,
        tokensUsed: {
          prompt: data.usage?.input_tokens || promptTokens,
          completion: data.usage?.output_tokens || estimateTokens(rawContent),
          total:
            (data.usage?.input_tokens || promptTokens) +
            (data.usage?.output_tokens || estimateTokens(rawContent)),
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async callOpenAi(
    requestId: string,
    invocation: AiInvocation,
    system: string,
    userMessage: string,
    promptTokens: number,
    wasTruncated: boolean,
    apiKey: string,
    model: string,
  ): Promise<AiGatewayResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        throw new Error(`OpenAI API error: ${resp.status} ${resp.statusText}`);
      }

      const data = (await resp.json()) as {
        choices: Array<{ message?: { content?: string } }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      };

      const rawContent = data.choices?.[0]?.message?.content || '';
      const parsed = this.parseCodeFromOutput(rawContent, invocation.action);

      return {
        requestId,
        action: invocation.action,
        model,
        provider: 'openai',
        explanation: parsed.explanation,
        suggestedCode: parsed.suggestedCode,
        wasTruncated,
        tokensUsed: {
          prompt: data.usage?.prompt_tokens || promptTokens,
          completion: data.usage?.completion_tokens || estimateTokens(rawContent),
          total: data.usage?.total_tokens || promptTokens + estimateTokens(rawContent),
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseCodeFromOutput(
    raw: string,
    action: AiAction,
  ): { explanation: string; suggestedCode?: string } {
    const codeBlockRegex = /```[\w-]*\n([\s\S]*?)```/;
    const match = raw.match(codeBlockRegex);

    if (match && match[1]) {
      const suggestedCode = match[1].trim();
      const explanation = raw.replace(codeBlockRegex, '').trim();
      return { explanation: explanation || 'Suggested changes:', suggestedCode };
    }

    if (action === 'EXPLAIN') {
      return { explanation: raw.trim() };
    }

    return { explanation: raw.trim() };
  }

  private generateMockCompletion(invocation: AiInvocation): {
    explanation: string;
    suggestedCode?: string;
  } {
    const { action, context, prompt } = invocation;
    const filename = context.activeFile.path;

    switch (action) {
      case 'EXPLAIN':
        return {
          explanation: `### Code Analysis for \`${filename}\`\n\nThe code defines module behavior and exports. It ensures reliable execution within the collaborative Pairly environment.\n\n${prompt ? `*Context addressed: ${prompt}*` : ''}`,
        };

      case 'REFACTOR':
        return {
          explanation:
            'Extracted repeated logic into reusable utility functions and improved type safety.',
          suggestedCode: `// Refactored version of ${filename}\n${context.activeFile.content}\n// Optimized for performance & clarity\n`,
        };

      case 'EXPLAIN_AND_FIX':
      case 'FIND_BUGS':
        return {
          explanation:
            'Resolved syntax/type diagnostic by ensuring proper parameter typing and bounds check.',
          suggestedCode: `${context.activeFile.content.replace('// error', '// fixed')}`,
        };

      case 'DOCUMENT':
        return {
          explanation: `Generated documentation comments and JSDoc annotations for \`${filename}\`.`,
          suggestedCode: `/**\n * @file ${filename}\n * @description Production component module\n */\n${context.activeFile.content}`,
        };

      case 'GENERATE_TESTS':
        return {
          explanation: `Generated unit test suite for \`${filename}\` using Vitest / Jest patterns.`,
          suggestedCode: `import { describe, it, expect } from 'vitest';\n\ndescribe('${filename} test suite', () => {\n  it('executes expected baseline assertions', () => {\n    expect(true).toBe(true);\n  });\n});\n`,
        };

      case 'GENERATE_CODE':
      default:
        return {
          explanation: `Generated implementation addressing instruction: "${prompt || 'Create component'}"`,
          suggestedCode: `// Generated code for ${filename}\nexport function execute() {\n  return { status: "success", timestamp: Date.now() };\n}\n`,
        };
    }
  }
}

export const defaultAiGateway = new AiGateway();
