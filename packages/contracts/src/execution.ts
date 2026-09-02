import { z } from 'zod';

/**
 * 20+ Executable Programming Languages supported at launch.
 * Per SRS FR-EXEC-01 & Section 14.2:
 * Target at least 20 executable languages including JavaScript, TypeScript, Python,
 * Java, C, C++, C#, Go, Rust, PHP, Ruby, Kotlin, Swift, SQL, Bash, etc.
 */
export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby',
  'kotlin',
  'swift',
  'sql',
  'bash',
  'perl',
  'r',
  'scala',
  'dart',
  'elixir',
  'lua',
  'zig',
  'haskell',
] as const;

export const SupportedLanguageSchema = z.enum(SUPPORTED_LANGUAGES);
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;

/**
 * Execution Limits Schema.
 * Per SRS FR-EXEC-04 & FR-EXEC-05: 256MB memory cap, 10s timeout, network disabled.
 */
export const ExecutionLimitsSchema = z.object({
  timeoutMs: z
    .number()
    .int('Timeout must be an integer')
    .min(500, 'Minimum timeout is 500ms')
    .max(10000, 'Maximum timeout is 10,000ms (10 seconds per SRS FR-EXEC-04)')
    .default(10000),
  memoryLimitMb: z
    .number()
    .int('Memory limit must be an integer')
    .min(16, 'Minimum memory is 16MB')
    .max(256, 'Maximum memory is 256MB per SRS FR-EXEC-04')
    .default(256),
  networkEnabled: z
    .literal(false, {
      errorMap: () => ({
        message: 'Outbound network access must remain disabled by default (SRS SEC-05, FR-EXEC-05)',
      }),
    })
    .default(false),
});
export type ExecutionLimits = z.infer<typeof ExecutionLimitsSchema>;

/**
 * File payload for execution.
 */
export const ExecutionFileSchema = z.object({
  name: z.string().trim().min(1, 'File name is required').max(255, 'File name too long'),
  content: z.string().max(1024 * 1024 * 5, 'File content cannot exceed 5MB'),
  encoding: z.enum(['utf-8', 'base64']).default('utf-8'),
});
export type ExecutionFile = z.infer<typeof ExecutionFileSchema>;

/**
 * Run Parameters Schema.
 * Primary contract for submitting code to the sandboxed execution service.
 */
export const RunParametersSchema = z.object({
  language: SupportedLanguageSchema,
  version: z.string().trim().max(30).optional(),
  files: z.array(ExecutionFileSchema).min(1, 'At least one file must be provided for execution'),
  entrypoint: z.string().trim().min(1).max(255).optional(),
  stdin: z.string().max(65536, 'stdin payload cannot exceed 64KB').optional(),
  args: z.array(z.string().max(1000)).max(50, 'Maximum 50 arguments').optional(),
  limits: ExecutionLimitsSchema.default({}),
});
export type RunParameters = z.infer<typeof RunParametersSchema>;

/**
 * Execution Status Lifecycle.
 */
export const ExecutionStatusSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'TIMEOUT',
  'OOM_KILLED',
  'CANCELLED',
]);
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

/**
 * Real-time Stream Output Chunk (SRS FR-EXEC-02).
 */
export const ExecutionOutputChunkSchema = z.object({
  runId: z.string().min(1, 'runId is required'),
  stream: z.enum(['stdout', 'stderr', 'system']),
  data: z.string(),
  timestamp: z.number().int().positive(),
});
export type ExecutionOutputChunk = z.infer<typeof ExecutionOutputChunkSchema>;

/**
 * Execution Final Result.
 */
export const ExecutionResultSchema = z.object({
  runId: z.string().min(1, 'runId is required'),
  status: ExecutionStatusSchema,
  exitCode: z.number().int().nullable(),
  stdout: z.string(),
  stderr: z.string(),
  durationMs: z.number().int().nonnegative(),
  memoryUsedBytes: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
});
export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

/**
 * Interactive Stdin Input Contract (SRS FR-EXEC-03).
 */
export const SendStdinSchema = z.object({
  runId: z.string().min(1, 'runId is required'),
  data: z.string().max(65536, 'stdin chunk cannot exceed 64KB'),
});
export type SendStdinInput = z.infer<typeof SendStdinSchema>;

/**
 * Cancel Execution Contract.
 */
export const CancelExecutionSchema = z.object({
  runId: z.string().min(1, 'runId is required'),
  reason: z.string().max(200).optional(),
});
export type CancelExecutionInput = z.infer<typeof CancelExecutionSchema>;

/* Runtime validation helpers */
export function validateRunParameters(input: unknown) {
  return RunParametersSchema.safeParse(input);
}

export function validateExecutionResult(input: unknown) {
  return ExecutionResultSchema.safeParse(input);
}

export function validateSendStdin(input: unknown) {
  return SendStdinSchema.safeParse(input);
}

export function validateCancelExecution(input: unknown) {
  return CancelExecutionSchema.safeParse(input);
}
