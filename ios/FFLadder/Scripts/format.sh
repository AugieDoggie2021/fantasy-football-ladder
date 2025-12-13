#!/bin/bash
set -euo pipefail
if ! command -v swiftformat >/dev/null 2>&1; then
  echo "SwiftFormat not installed. Install via Homebrew: brew install swiftformat"
  exit 1
fi
swiftformat .




