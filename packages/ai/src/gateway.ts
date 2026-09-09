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
        (process.env.ANTHROPIC_API_KEY ? 'anthropic' : process.env.OPENAI_API_KEY ? 'openai' : 'mock'),
      anthropicApiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY || '',
      anthropicModel: config.anthropicModel || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      openaiModel: config.openaiModel || process.env.OPENAI_MODEL || 'gpt-4o',
      timeoutMs: config.timeoutMs || 30_000,
    };
  }

  /**
   * Determine active provider based on request or environment configuration.
   */
  public resolveProvider(requestedModel?: string): { provider: AiProviderType; modelName: string } {
    if (requestedModel) {
      if (requestedModel.toLowerCase().includes('claude') || requestedModel.toLowerCase().includes('sonnet')) {
        return {
          provider: this.config.anthropicApiKey ? 'anthropic' : 'mock',
          modelName: requestedModel,
        };
      }
      if (requestedModel.toLowerCase().includes('gpt')) {
        return {
          provider: this.config.openaiApiKey ? 'openai' : 'mock',
          modelName: requestedModel,
        };
      }
      if (requestedModel.toLowerCase() === 'mock') {
        return { provider: 'mock', modelName: 'mock-pairly-engine' };
      }
    }

    if (this.config.defaultProvider === 'anthropic' && this.config.anthropicApiKey) {
      return { provider: 'anthropic', modelName: this.config.anthropicModel };
    }
    if (this.config.defaultProvider === 'openai' && this.config.openaiApiKey) {
      return { provider: 'openai', modelName: this.config.openaiModel };
    }
    return { provider: 'mock', modelName: 'mock-pairly-engine' };
  }

  /**
   * Execute an AI invocation request.
   */
  public async invoke(invocation: AiInvocation): Promise<AiGatewayResult> {
    const requestId = `ai-req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const { provider, modelName } = this.resolveProvider(invocation.model);
    const { system, userMessage, wasTruncated } = buildAiPrompt(
      invocation.action,
      invocation.context,
      invocation.prompt,
    );

    const promptTokens = estimateTokens(system) + estimateTokens(userMessage);

    if (provider === 'mock') {
      const mockResult = this.generateMockCompletion(invocation);
      const completionTokens = estimateTokens(mockResult.explanation) + estimateTokens(mockResult.suggestedCode || '');
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

    if (provider === 'anthropic') {
      return this.callAnthropic(requestId, invocation, system, userMessage, promptTokens, wasTruncated);
    }

    return this.callOpenAi(requestId, invocation, system, userMessage, promptTokens, wasTruncated);
  }

  /**
   * Stream response chunks (FR-AI-06).
   */
  public async *stream(invocation: AiInvocation): AsyncIterable<AiStreamChunk> {
    const result = await this.invoke(invocation);
    const fullText = result.suggestedCode
      ? `${result.explanation}\n\n\`\`\`${invocation.context.activeFile.language}\n${result.suggestedCode}\n\`\`\``
      : result.explanation;

    // Simulate word-by-word streaming
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

  private async callAnthropic(
    requestId: string,
    invocation: AiInvocation,
    system: string,
    userMessage: string,
    promptTokens: number,
    wasTruncated: boolean,
  ): Promise<AiGatewayResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.anthropicModel,
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
        model: this.config.anthropicModel,
        provider: 'anthropic',
        explanation: parsed.explanation,
        suggestedCode: parsed.suggestedCode,
        wasTruncated,
        tokensUsed: {
          prompt: data.usage?.input_tokens || promptTokens,
          completion: data.usage?.output_tokens || estimateTokens(rawContent),
          total: (data.usage?.input_tokens || promptTokens) + (data.usage?.output_tokens || estimateTokens(rawContent)),
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
  ): Promise<AiGatewayResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.config.openaiModel,
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
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const rawContent = data.choices?.[0]?.message?.content || '';
      const parsed = this.parseCodeFromOutput(rawContent, invocation.action);

      return {
        requestId,
        action: invocation.action,
        model: this.config.openaiModel,
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
    output: string,
    action: AiAction,
  ): { explanation: string; suggestedCode?: string } {
    const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/;
    const match = output.match(codeBlockRegex);

    if (match && match[1] && action !== 'EXPLAIN') {
      const suggestedCode = match[1].trim();
      const explanation = output.replace(codeBlockRegex, '').trim() || 'AI proposed code modification.';
      return { explanation, suggestedCode };
    }

    return { explanation: output };
  }

  /**
   * Deterministic mock engine taking cues from codex/code-editor implementations.
   */
  private generateMockCompletion(invocation: AiInvocation): {
    explanation: string;
    suggestedCode?: string;
  } {
    const { action, context, prompt } = invocation;
    const activeCode = context.activeFile.content;
    const path = context.activeFile.path;

    switch (action) {
      case 'EXPLAIN': {
        const lineCount = activeCode.split('\n').length;
        return {
          explanation: `### Code Analysis for \`${path}\`\n\n- **Structure**: Document contains ${lineCount} lines of ${context.activeFile.language} code.\n- **Overview**: Provides core execution logic for Pairly workspace routines.\n- **Complexity**: Clean algorithmic flow with linear $O(N)$ traversal properties.\n- **Recommendations**: Encapsulation is well-structured; follow strict null checks.`,
        };
      }
      case 'FIND_BUGS': {
        return {
          explanation: `### Bug Diagnostic Report\n\n- **Identified Risk**: Potential unchecked undefined access in payload handling.\n- **Remediation**: Added explicit type guard check before accessing properties.`,
          suggestedCode: `// Fixed: Added safety guard\nif (!data) {\n  throw new Error("Missing required payload data");\n}\n${activeCode}`,
        };
      }
      case 'REFACTOR': {
        return {
          explanation: `### Code Refactoring Proposal\n\n- Optimized data structure processing and eliminated redundant loops.\n- Cleaned variable declarations following TypeScript strict standards.`,
          suggestedCode: `// Optimized refactored version of ${path}\nexport const processedData = useMemo(() => {\n  return items.filter(Boolean).map(item => ({ ...item, updatedAt: Date.now() }));\n}, [items]);`,
        };
      }
      case 'GENERATE_TESTS': {
        return {
          explanation: `### Automated Unit Tests\n\n- Generated test suite with Vitest checking happy paths, edge cases, and error rejection.`,
          suggestedCode: `import { describe, it, expect } from 'vitest';\n\ndescribe('${path}', () => {\n  it('should initialize with default state', () => {\n    expect(true).toBe(true);\n  });\n\n  it('should handle boundary edge cases', () => {\n    expect(() => {}).not.toThrow();\n  });\n});`,
        };
      }
      case 'DOCUMENT': {
        return {
          explanation: `### Documentation & JSDoc Annotations\n\n- Added comprehensive TSDoc annotations describing parameters, return types, and exceptions.`,
          suggestedCode: `/**\n * Processed Pairly module: ${path}\n * @param context - The execution context\n * @returns The resolved state\n */\n${activeCode}`,
        };
      }
      case 'EXPLAIN_AND_FIX': {
        const errorMsg = context.errorContext?.message || 'Runtime execution error';
        return {
          explanation: `### Error Diagnosis & Patch (FR-AI-09)\n\n**Cause**: The execution aborted with \`${errorMsg}\`.\n**Fix**: Added bounds validation and error recovery handler.`,
          suggestedCode: `try {\n  // Protected execution block\n  ${activeCode.trim()}\n} catch (err) {\n  console.error("Safely recovered from execution error:", err);\n}`,
        };
      }
      case 'GENERATE_CODE':
      default: {
        const promptDesc = prompt || 'Utility helper';
        return {
          explanation: `### Implementation for: "${promptDesc}"\n\nGenerated high-performance TypeScript implementation matching workspace patterns.`,
          suggestedCode: `/**\n * Auto-generated helper for: ${promptDesc}\n */\nexport function handle${promptDesc.replace(/[^a-zA-Z0-9]/g, '')}() {\n  // Implementation\n  return { success: true, timestamp: Date.now() };\n}`,
        };
      }
    }
  }
}

export const defaultAiGateway = new AiGateway();
