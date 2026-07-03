#!/usr/bin/env bash
# 打包 MoodTide 为抖音虚拟创作平台可上传的 ZIP。
# 要求：① 根目录含 index.html ② 整包 ≤ 8MB ③ 相对路径(vite base: './')。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
OUT="$ROOT/moodtide-submit.zip"

if [ ! -f "$DIST/index.html" ]; then
  echo "✗ dist/index.html 不存在，请先 npm run build" >&2
  exit 1
fi

rm -f "$OUT"
# 关键：在 dist 内打包，使 index.html 位于 zip 根目录（而非 dist/index.html）
( cd "$DIST" && zip -r -q "$OUT" . -x ".*" )

SIZE_BYTES=$(stat -f%z "$OUT" 2>/dev/null || stat -c%s "$OUT")
SIZE_MB=$(awk "BEGIN{printf \"%.2f\", $SIZE_BYTES/1048576}")

# 检测 zip 根目录是否有 index.html（zip 内路径无前导目录即为根）
if unzip -Z1 "$OUT" | grep -qx 'index.html'; then
  ROOT_INDEX="有 ✓"
else
  ROOT_INDEX="✗ 缺失!"
fi

echo "✓ 已生成 $OUT"
echo "  根目录 index.html：$ROOT_INDEX"
echo "  包体大小：${SIZE_MB} MB（上限 8MB）"

if [ "$SIZE_BYTES" -gt 8388608 ]; then
  echo "  ⚠️  超过 8MB！需精简资源（压缩 mp3 / 改用 OSS 外链 / 减少封面图）" >&2
fi

echo "  内含文件："
unzip -l "$OUT" | awk 'NR>3 && $4!="" && $4!~/----/ {print "    " $4 "  (" $1 "B)"}'
