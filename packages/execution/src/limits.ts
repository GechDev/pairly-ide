/**
 * Sandboxed Execution Resource Limits & Constraints.
 * Conforms to SRS FR-EXEC-04, FR-EXEC-05, and SEC-05:
 * - CPU, memory, wall-clock, output, and process limits.
 * - Outbound network disabled by default.
 */
export const DEFAULT_EXECUTION_LIMITS = {
  /** Maximum execution wall-clock time in milliseconds (10 seconds) */
  TIMEOUT_MS: 10000,

  /** Maximum compile wall-clock time in milliseconds */
  COMPILE_TIMEOUT_MS: 10000,

  /** Maximum memory limit in bytes: 256MB per FR-EXEC-04 */
  MEMORY_LIMIT_BYTES: 256 * 1024 * 1024, // 268,435,456 bytes

  /** Maximum memory limit in megabytes */
  MEMORY_LIMIT_MB: 256,

  /** Maximum process/thread count to prevent fork bombs */
  MAX_PROCESSES: 64,

  /** Maximum standard output / standard error buffer size (1MB) */
  MAX_OUTPUT_BYTES: 1024 * 1024, // 1MB

  /** Maximum standard input payload size (64KB) */
  MAX_STDIN_BYTES: 64 * 1024, // 64KB

  /** Outbound network disabled per SEC-05 and FR-EXEC-05 */
  NETWORK_ENABLED: false,
} as const;

export type ExecutionLimitsConfig = typeof DEFAULT_EXECUTION_LIMITS;
