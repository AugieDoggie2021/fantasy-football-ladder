#!/bin/bash
set -euo pipefail
if ! command -v swiftlint >/dev/null 2>&1; then
  echo "SwiftLint not installed. Install via Homebrew: brew install swiftlint"
  exit 1
fi
swiftlint --config .swiftlint.yml




