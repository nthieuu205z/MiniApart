#!/usr/bin/env bash
# Guard của repo chạy trên BẢN CHÉP (không đụng frontend/): áp overlay token đề xuất rồi chạy
#   1) vitest designTokens.test.ts  2) toàn bộ vitest  3) tsc -b && vite build (CSS overlay phải parse được).
# Chạy từ thư mục gốc repo:  bash docs/design/ui-redesign/tools/run-repo-guard.sh [thư_mục_tạm]
# Kết quả: <tạm>/guard-*.log. Thư mục tạm mặc định = $TMPDIR/ma-guard (bị xoá và tạo lại mỗi lần).
set -u
REPO="$(pwd)"
[ -f "$REPO/frontend/package.json" ] || { echo "Chạy từ thư mục gốc repo MiniApart"; exit 2; }
G="${1:-${TMPDIR:?cần TMPDIR}/ma-guard}"
case "$G" in "$REPO"*) echo "Thư mục tạm không được nằm trong repo"; exit 2;; esac
rm -rf "$G" && mkdir -p "$G/frontend"
# Chép (kể cả node_modules, ~100 MB) để không phải tạo junction trỏ vào repo
cp -r "$REPO/frontend/." "$G/frontend/" && rm -rf "$G/frontend/dist"
T="$G/frontend/src/tokens"
# Overlay: phần biến của assets/tokens.css; @font-face trỏ fonts/ nên chép kèm font
cp "$REPO/docs/design/ui-redesign/assets/tokens.css" "$T/overlay-ui-redesign.css"
mkdir -p "$T/fonts" && cp "$REPO/docs/design/ui-redesign/assets/fonts/"*.woff2 "$T/fonts/"
printf "\n@import './overlay-ui-redesign.css';\n" >> "$T/index.css"
# designTokens.test.ts chỉ nạp colors.css + typography.css (?raw) → nối overlay vào cuối typography.css (nạp sau cùng)
printf "\n/* overlay ui-redesign (guard) */\n" >> "$T/typography.css"
sed '/@font-face/d' "$T/overlay-ui-redesign.css" >> "$T/typography.css"
cd "$G/frontend" || exit 2
npx vitest run src/designTokens.test.ts > "$G/guard-1-designTokens.log" 2>&1; R1=$?
npx vitest run > "$G/guard-2-full.log" 2>&1; R2=$?
npm run build > "$G/guard-3-build.log" 2>&1; R3=$?
echo "designTokens=$R1 full=$R2 build=$R3 (0 = qua) · log ở $G"
