#!/usr/bin/env bash
# Render toàn bộ sơ đồ .mmd trong thư mục này ra .png
# Yêu cầu: npm install -g @mermaid-js/mermaid-cli
set -euo pipefail
cd "$(dirname "$0")"

WIDTH=2200
FAIL=0

for f in *.mmd; do
  name="${f%.mmd}"
  printf "%-38s " "$name"
  if mmdc -i "$f" -o "$name.png" -w "$WIDTH" -b white >/dev/null 2>/tmp/mmdc-err.txt; then
    echo "OK"
  else
    echo "LỖI"
    sed 's/^/    /' /tmp/mmdc-err.txt | tail -10
    FAIL=1
  fi
done

exit $FAIL
