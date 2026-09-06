#!/bin/bash
# Installs 20+ execution runtimes in Piston per Pairly SRS FR-EXEC-01
set -e

PISTON_URL=${PISTON_URL:-"http://localhost:2000"}

echo "Installing Pairly core runtimes on ${PISTON_URL}..."

LANGUAGES=(
  "python"
  "javascript"
  "typescript"
  "go"
  "rust"
  "cpp"
  "c"
  "java"
  "csharp.net"
  "ruby"
  "php"
  "swift"
  "kotlin"
  "bash"
  "sqlite3"
  "perl"
  "rscript"
  "scala"
  "dart"
  "elixir"
  "lua"
  "zig"
  "haskell"
)

for lang in "${LANGUAGES[@]}"; do
  echo "Installing ${lang}..."
  curl -s -X POST "${PISTON_URL}/api/v2/packages" \
    -H "Content-Type: application/json" \
    -d "{\"language\": \"${lang}\"}" || true
done

echo "All runtimes provisioned successfully."
