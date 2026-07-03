#!/usr/bin/env bash
# 双击我即可启动整个 MoodTide（本地服务 + Cloudflare 公网链接 + 二维码）。
# 这是给 Finder 双击用的包装器：定位到脚本所在目录，运行 launch.sh，并保持窗口打开。
cd "$(dirname "$0")" || exit 1
bash ./launch.sh
echo
echo "（已停止。可关闭此窗口，或回车重新启动）"
read -r _
exec bash ./launch.sh
