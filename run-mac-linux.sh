#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required. Install it and run this file again."
  exit 1
fi

if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
fi

.venv/bin/python -m pip install -r requirements.txt
(
  sleep 1
  if command -v open >/dev/null 2>&1; then
    open http://127.0.0.1:8000
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://127.0.0.1:8000
  fi
) &

echo "Keep this terminal open while using the app. Press Ctrl+C to stop."
.venv/bin/python server.py
