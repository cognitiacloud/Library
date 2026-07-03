#!/usr/bin/env bash
# BUDGET WHEELS DEALEROS build packets — typecheck + mock tests.
# Dependency policy: dev-only (typescript + @types/node). No network calls,
# no secrets, no live integrations — everything under test is a mock.
set -euo pipefail
cd "$(dirname "$0")"

echo "== typecheck =="
./node_modules/.bin/tsc --noEmit

echo "== compile =="
rm -rf .build
./node_modules/.bin/tsc

echo "== run tests =="
fail=0
while IFS= read -r t; do
  echo "--- node ${t}"
  if node "$t"; then echo "PASS ${t}"; else echo "FAIL ${t}"; fail=1; fi
done < <(find .build -name '*.test.js' | sort)

if [ "$fail" -ne 0 ]; then echo "TESTS FAILED"; exit 1; fi
echo "ALL TESTS PASSED"
