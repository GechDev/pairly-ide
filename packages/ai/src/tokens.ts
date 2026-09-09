import { AiContext } from '@pairly/contracts';

/**
 * Token budgeting & guardrails (FR-AI-07, FR-AI-12).
 * Heuristic estimation: ~4 chars per token for typical code and natural language.
 */
export const CHARS_PER_TOKEN = 4;

export interface TokenBudget {
  maxContextTokens: number;
  activeFileBudget: number;
  additionalFilesBudget: number;
  terminalBudget: number;
  chatBudget: number;
}

export const DEFAULT_TOKEN_BUDGET: TokenBudget = {
  maxContextTokens: 32_000,
  activeFileBudget: 16_000,
  additionalFilesBudget: 8_000,
  terminalBudget: 4_000,
  chatBudget: 2_000,
};

/**
 * Fast token count estimator.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Truncate string to fit within a given token limit.
 */
export function truncateToTokens(
  text: string,
  maxTokens: number,
  mode: 'head' | 'tail' | 'middle' = 'tail',
): { text: string; truncated: boolean; estimatedTokens: number } {
  const currentTokens = estimateTokens(text);
  if (currentTokens <= maxTokens) {
    return { text, truncated: false, estimatedTokens: currentTokens };
  }

  const maxChars = maxTokens * CHARS_PER_TOKEN;
  let truncatedStr = '';

  if (mode === 'head') {
    // Keep beginning, cut end
    truncatedStr = text.slice(0, maxChars) + '\n... [truncated]';
  } else if (mode === 'tail') {
    // Keep end (useful for terminal logs & stack traces)
    truncatedStr = '... [truncated]\n' + text.slice(text.length - maxChars);
  } else {
    // Middle: keep head & tail halves
    const half = Math.floor(maxChars / 2);
    truncatedStr = text.slice(0, half) + '\n... [truncated] ...\n' + text.slice(text.length - half);
  }

  return {
    text: truncatedStr,
    truncated: true,
    estimatedTokens: estimateTokens(truncatedStr),
  };
}

export interface BudgetedContextResult {
  context: AiContext;
  wasTruncated: boolean;
  totalTokens: number;
  breakdown: {
    activeFile: number;
    additionalFiles: number;
    terminalOutput: number;
    chatHistory: number;
  };
}

/**
 * Apply token budgets and safety caps across all fields of an AiContext.
 */
export function applyContextBudget(
  rawContext: AiContext,
  customBudget?: Partial<TokenBudget>,
): BudgetedContextResult {
  const budget: TokenBudget = { ...DEFAULT_TOKEN_BUDGET, ...customBudget };
  let wasTruncated = false;

  // 1. Active File Truncation
  const activeFileTokens = estimateTokens(rawContext.activeFile.content);
  let activeContent = rawContext.activeFile.content;
  if (activeFileTokens > budget.activeFileBudget) {
    const res = truncateToTokens(activeContent, budget.activeFileBudget, 'head');
    activeContent = res.text;
    wasTruncated = true;
  }

  // 2. Additional Files Truncation
  const additionalFiles: NonNullable<AiContext['additionalFiles']> = [];
  let remainingAddlTokens = budget.additionalFilesBudget;
  let addlTokensSum = 0;

  if (rawContext.additionalFiles && rawContext.additionalFiles.length > 0) {
    for (const file of rawContext.additionalFiles) {
      if (remainingAddlTokens <= 0) {
        wasTruncated = true;
        break;
      }
      const fileTokens = estimateTokens(file.content);
      if (fileTokens > remainingAddlTokens) {
        const res = truncateToTokens(file.content, remainingAddlTokens, 'head');
        additionalFiles.push({ path: file.path, content: res.text });
        addlTokensSum += res.estimatedTokens;
        remainingAddlTokens = 0;
        wasTruncated = true;
      } else {
        additionalFiles.push({ path: file.path, content: file.content });
        addlTokensSum += fileTokens;
        remainingAddlTokens -= fileTokens;
      }
    }
  }

  // 3. Terminal Output Truncation (Keep tail for recent logs/errors)
  let terminalOutput = rawContext.terminalOutput;
  let terminalTokens = 0;
  if (terminalOutput) {
    const tTokens = estimateTokens(terminalOutput);
    if (tTokens > budget.terminalBudget) {
      const res = truncateToTokens(terminalOutput, budget.terminalBudget, 'tail');
      terminalOutput = res.text;
      terminalTokens = res.estimatedTokens;
      wasTruncated = true;
    } else {
      terminalTokens = tTokens;
    }
  }

  // 4. Chat History Truncation (Keep latest messages)
  let chatHistory = rawContext.chatHistory ? [...rawContext.chatHistory] : undefined;
  let chatTokens = 0;
  if (chatHistory && chatHistory.length > 0) {
    let accTokens = 0;
    const keptMessages: typeof chatHistory = [];
    // Iterate from newest to oldest
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      const msg = chatHistory[i];
      if (!msg) continue;
      const msgTokens = estimateTokens(msg.content) + estimateTokens(msg.sender);
      if (accTokens + msgTokens <= budget.chatBudget) {
        keptMessages.unshift(msg);
        accTokens += msgTokens;
      } else {
        wasTruncated = true;
        break;
      }
    }
    chatHistory = keptMessages;
    chatTokens = accTokens;
  }

  const finalActiveTokens = estimateTokens(activeContent);
  const totalTokens = finalActiveTokens + addlTokensSum + terminalTokens + chatTokens;

  const budgetedContext: AiContext = {
    activeFile: {
      ...rawContext.activeFile,
      content: activeContent,
    },
    additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    terminalOutput,
    chatHistory,
    errorContext: rawContext.errorContext,
  };

  return {
    context: budgetedContext,
    wasTruncated,
    totalTokens,
    breakdown: {
      activeFile: finalActiveTokens,
      additionalFiles: addlTokensSum,
      terminalOutput: terminalTokens,
      chatHistory: chatTokens,
    },
  };
}
