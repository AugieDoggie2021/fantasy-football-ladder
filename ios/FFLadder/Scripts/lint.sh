#!/bin/bash
set -euo pipefail
if ! command -v swiftlint >/dev/null 2>&1; then
  echo "SwiftLint not installed. Install via Homebrew: brew install swiftlint"
  exit 1
fi
# Run from the directory containing .swiftlint.yml (ios/FFLadder)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR" || exit
swiftlint --config .swiftlint.yml




