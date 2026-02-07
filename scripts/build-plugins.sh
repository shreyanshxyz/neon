#!/bin/bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"

for plugin_dir in "$root_dir"/src/plugins/*/; do
  if [ ! -d "$plugin_dir" ]; then
    continue
  fi

  if [ ! -f "$plugin_dir/Cargo.toml" ]; then
    continue
  fi

  echo "Building plugin in $plugin_dir"
  (cd "$plugin_dir" && cargo build --target wasm32-unknown-unknown --release)

  wasm_file=$(ls "$plugin_dir"/target/wasm32-unknown-unknown/release/*.wasm 2>/dev/null | head -n 1 || true)
  if [ -n "$wasm_file" ]; then
    cp "$wasm_file" "$plugin_dir/plugin.wasm"
  else
    echo "No wasm output found for $plugin_dir"
  fi
done
