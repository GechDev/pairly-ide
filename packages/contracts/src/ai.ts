import { z } from 'zod';

/**
 * AI Assistant Actions.
 * Per SRS FR-AI-03 & FR-AI-09:
 * Code explanation, bug analysis, refactoring, test generation, documentation,
 * code generation, and error explanation/fix.
 */
export const AiActionSchema = z.enum([
  'EXPLAIN',
  'FIND_BUGS',
  'REFACTOR',
  'GENERATE_TESTS',
  'DOCUMENT',
  'GENERATE_CODE',
  'EXPLAIN_AND_FIX',
]);
export type AiAction = z.infer<typeof AiActionSchema>;

/**
 * Editor Selection Coordinates.
 */
export const EditorSelectionSchema = z.object({
  startLine: z.number().int().positive('Start line must be positive'),
  startColumn: z.number().int().positive('Start column must be positive'),
  endLine: z.number().int().positive('End line must be positive'),
  endColumn: z.number().int().positive('End column must be positive'),
  text: z
    .string()
    .max(1024 * 128, 'Selected text too large')
    .optional(),
});
export type EditorSelection = z.infer<typeof EditorSelectionSchema>;

/**
 * Transparent AI Request Context.
 * Per SRS FR-AI-07 & NFR-PRIV-02:
 * Disclose exactly which files, selections, terminal output, or chat context are sent.
 */
export const AiContextSchema = z.object({
  activeFile: z.object({
    path: z.string().min(1, 'Active file path is required'),
    content: z.string().max(1024 * 1024, 'Active file content cannot exceed 1MB'),
    language: z.string().min(1),
    selection: EditorSelectionSchema.optional(),
  }),
  additionalFiles: z
    .array(
      z.object({
        path: z.string().min(1),
        content: z.string().max(1024 * 512, 'Additional file content cannot exceed 512KB'),
      }),
    )
    .max(10, 'Maximum 10 additional context files')
    .optional(),
  terminalOutput: z.string().max(32768, 'Terminal output context cannot exceed 32KB').optional(),
  chatHistory: z
    .array(
      z.object({
        sender: z.string().min(1),
        content: z.string().max(2000),
      }),
    )
    .max(20, 'Maximum 20 chat messages in context')
    .optional(),
  errorContext: z
    .object({
      message: z.string().max(4000),
      stackTrace: z.string().max(8000).optional(),
    })
    .optional(),
});
export type AiContext = z.infer<typeof AiContextSchema>;

/**
 * AI Invocation Request Schema.
 */
export const AiInvocationSchema = z.object({
  action: AiActionSchema,
  prompt: z.string().trim().max(4000, 'Prompt cannot exceed 4000 characters').optional(),
  context: AiContextSchema,
  model: z.string().trim().max(100).optional(),
});
export type AiInvocation = z.infer<typeof AiInvocationSchema>;

/**
 * AI Proposal Status.
 */
export const AiProposalStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'SUPERSEDED']);
export type AiProposalStatus = z.infer<typeof AiProposalStatusSchema>;

/**
 * AI Code Modification Proposal.
 * Per SRS FR-AI-04, FR-AI-05, FR-AI-08, AT-07, AT-08:
 * Proposed code changes are shown as reviewable diffs before application,
 * and track baseDocumentVersion to prevent stale applications.
 */
export const AiProposalSchema = z.object({
  proposalId: z.string().min(1, 'proposalId is required'),
  action: AiActionSchema,
  filePath: z.string().min(1, 'filePath is required'),
  baseDocumentVersion: z.union([z.number().int().nonnegative(), z.string().min(1)]),
  explanation: z.string().min(1, 'Explanation is required'),
  diff: z.string().min(1, 'Diff is required'),
  suggestedCode: z.string().optional(),
  status: AiProposalStatusSchema.default('PENDING'),
  createdAt: z.number().int().positive(),
  acceptedBy: z.string().optional(),
});
export type AiProposal = z.infer<typeof AiProposalSchema>;

/**
 * Proposal Review Decision.
 * Per SRS FR-AI-05 & AT-08:
 * Accept or reject proposal, optionally supplying current document version for stale check.
 */
export const ReviewProposalSchema = z.object({
  proposalId: z.string().min(1, 'proposalId is required'),
  decision: z.enum(['ACCEPT', 'REJECT']),
  currentDocumentVersion: z.union([z.number().int().nonnegative(), z.string().min(1)]).optional(),
});
export type ReviewProposalInput = z.infer<typeof ReviewProposalSchema>;

/**
 * AI Response Streaming Chunk (SRS FR-AI-06).
 */
export const AiStreamChunkSchema = z.object({
  requestId: z.string().min(1),
  chunk: z.string(),
  isDone: z.boolean().default(false),
  proposal: AiProposalSchema.optional(),
});
export type AiStreamChunk = z.infer<typeof AiStreamChunkSchema>;

/* Runtime validation helpers */
export function validateAiInvocation(input: unknown) {
  return AiInvocationSchema.safeParse(input);
}

export function validateAiProposal(input: unknown) {
  return AiProposalSchema.safeParse(input);
}

export function validateReviewProposal(input: unknown) {
  return ReviewProposalSchema.safeParse(input);
}
