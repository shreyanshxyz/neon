#!/bin/bash
set -euo pipefail

cargo build --target wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/*.wasm plugin.wasm
