# Pairly Sandboxed Execution Service (Piston)

This directory defines the configuration and operational setup for Pairly's sandboxed multi-language code runner.

## Security Constraints & Limits
Conforming to **Pairly SRS FR-EXEC-01, FR-EXEC-04, FR-EXEC-05**, and **SEC-05**:
- **Execution Wall Clock Timeout:** 10s maximum (`PISTON_RUN_TIMEOUT=10000`).
- **Memory Cap:** 256MB (`PISTON_RUN_MEMORY_LIMIT=268435456`).
- **Process Limits:** 64 processes maximum (`PISTON_MAX_PROCESS_COUNT=64`) to prevent fork bombs.
- **Network Isolation:** Outbound network is disabled (`PISTON_DISABLE_NETWORKING=true`).
- **Output Truncation:** Stdout and stderr capped at 1MB to prevent terminal buffer exhaustion.

## Quickstart
To start the sandboxed runner container:
```bash
docker compose -f infra/piston/docker-compose.yml up -d
bash infra/piston/install-packages.sh
```
The API is available at `http://localhost:2000/api/v2/execute`.
In offline development or environments without Docker, `@pairly/execution` automatically utilizes its built-in local fallback sandbox runner.
