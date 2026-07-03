#!/usr/bin/env bash
# ============================================================================
#  MoodTide 启动台  ——  一键把整个项目跑起来，并通过 Cloudflare 临时隧道
#  暴露成公网 HTTPS 链接 + 终端二维码（手机扫码即玩）。
#
#  用法：
#    ./launch.sh            启动（托管已构建的 dist，最稳，默认）
#    ./launch.sh --build    先重新构建再启动
#    ./launch.sh --dev      用 Vite 开发服务器(带 HMR 热更新)启动
#    ./launch.sh stop       停止全部（隧道 + 本地服务）
#    ./launch.sh status     查看运行状态与公网链接
#    ./launch.sh url        只打印当前公网链接
#    ./launch.sh open       在默认浏览器打开公网链接
#
#  启动后保持前台运行，按 Ctrl+C 即可干净停止全部进程。
# ============================================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PORT=5173
RUN_DIR="$ROOT/.moodtide-run"
mkdir -p "$RUN_DIR"
SERVE_PID="$RUN_DIR/serve.pid"
TUNNEL_PID="$RUN_DIR/cloudflared.pid"
SERVE_LOG="$RUN_DIR/serve.log"
TUNNEL_LOG="$RUN_DIR/cloudflared.log"
URL_FILE="$RUN_DIR/public-url.txt"

# 颜色
B=$'\033[1m'; DIM=$'\033[2m'; G=$'\033[32m'; C=$'\033[36m'; Y=$'\033[33m'; R=$'\033[31m'; M=$'\033[35m'; X=$'\033[0m'
say(){ printf "%b\n" "$*"; }

# --------------------------------------------------------------------------
# 进程清理
# --------------------------------------------------------------------------
kill_pidfile(){
  local f="$1" pid
  [[ -f "$f" ]] || return 0
  pid="$(cat "$f" 2>/dev/null || true)"
  if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    for _ in 1 2 3 4 5; do kill -0 "$pid" 2>/dev/null || break; sleep 0.2; done
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$f"
}

free_port(){
  local pids
  pids="$(lsof -ti tcp:$PORT 2>/dev/null || true)"
  [[ -n "$pids" ]] && kill -9 $pids 2>/dev/null || true
}

stop_all(){
  say "${Y}⏹  正在停止 MoodTide 启动台…${X}"
  kill_pidfile "$TUNNEL_PID"
  kill_pidfile "$SERVE_PID"
  pkill -f "cloudflared tunnel --url http://127.0.0.1:$PORT" 2>/dev/null || true
  free_port
  rm -f "$URL_FILE"
  say "${G}✓ 已全部停止。${X}"
}

cleanup_on_exit(){ trap - INT TERM EXIT; stop_all; exit 0; }

# --------------------------------------------------------------------------
# 二维码
# --------------------------------------------------------------------------
show_qr(){
  local url="$1"
  if node -e "require('qrcode-terminal')" >/dev/null 2>&1; then
    node -e "require('qrcode-terminal').generate(process.argv[1],{small:true})" "$url"
  elif command -v qrencode >/dev/null 2>&1; then
    qrencode -t ANSIUTF8 "$url"
  else
    say "${DIM}(未安装二维码工具，请手动复制上方链接到手机打开)${X}"
  fi
}

lan_ip(){ ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1"; }

# --------------------------------------------------------------------------
# 启动本地服务
# --------------------------------------------------------------------------
start_serve(){
  free_port
  if [[ "$MODE" == "dev" ]]; then
    say "${C}▶ 启动 Vite 开发服务器（HMR 热更新）…${X}"
    npm run dev -- --host 0.0.0.0 --port "$PORT" --strictPort >"$SERVE_LOG" 2>&1 &
    echo $! >"$SERVE_PID"
  else
    if [[ "$MODE" == "build" || ! -f "$ROOT/dist/index.html" ]]; then
      say "${C}▶ 构建生产版本（npm run build）…${X}"
      if ! npm run build >"$RUN_DIR/build.log" 2>&1; then
        say "${R}✗ 构建失败，详见 $RUN_DIR/build.log${X}"; tail -20 "$RUN_DIR/build.log"; exit 1
      fi
    fi
    say "${C}▶ 托管已构建的 dist/（生产版，最稳）…${X}"
    python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$ROOT/dist" >"$SERVE_LOG" 2>&1 &
    echo $! >"$SERVE_PID"
  fi
  # 等本地服务起来
  for _ in $(seq 1 40); do
    if curl -sf -o /dev/null "http://127.0.0.1:$PORT/" 2>/dev/null; then return 0; fi
    if ! kill -0 "$(cat "$SERVE_PID")" 2>/dev/null; then
      say "${R}✗ 本地服务启动失败，日志：${X}"; tail -20 "$SERVE_LOG"; exit 1
    fi
    sleep 0.25
  done
  say "${Y}⚠ 本地服务似乎未在 ${PORT} 端口就绪，仍继续尝试隧道…${X}"
}

# --------------------------------------------------------------------------
# 启动 Cloudflare 隧道
# --------------------------------------------------------------------------
start_tunnel(){
  command -v cloudflared >/dev/null 2>&1 || {
    say "${R}✗ 未找到 cloudflared。安装：${X}brew install cloudflared"; exit 1; }
  : >"$TUNNEL_LOG"
  say "${C}▶ 开启 Cloudflare 临时隧道…${X}"
  cloudflared tunnel --url "http://127.0.0.1:$PORT" >"$TUNNEL_LOG" 2>&1 &
  echo $! >"$TUNNEL_PID"
}

get_url(){
  local tries=0 url=""
  while (( tries < 60 )); do
    url="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1 || true)"
    [[ -n "$url" ]] && { printf "%s" "$url"; return 0; }
    if ! kill -0 "$(cat "$TUNNEL_PID" 2>/dev/null)" 2>/dev/null; then return 1; fi
    sleep 0.5; tries=$((tries+1))
  done
  return 1
}

# --------------------------------------------------------------------------
# 漂亮地打印结果
# --------------------------------------------------------------------------
banner(){
  local url="$1" lan; lan="$(lan_ip)"
  say ""
  say "${M}${B}  ╭──────────────────────────────────────────────╮${X}"
  say "${M}${B}  │   🌊  MoodTide 心潮  ·  已上线               │${X}"
  say "${M}${B}  ╰──────────────────────────────────────────────╯${X}"
  say ""
  say "  ${B}公网链接（手机扫码即玩，HTTPS）${X}"
  say "  ${G}${B}${url}${X}"
  say ""
  show_qr "$url"
  say ""
  say "  ${DIM}本机预览：${X} http://localhost:${PORT}/"
  say "  ${DIM}同局域网：${X} http://${lan}:${PORT}/"
  say "  ${DIM}日志：    ${X}${TUNNEL_LOG}"
  say ""
  say "  ${Y}保持此窗口开启 = 持续在线；按 ${B}Ctrl+C${X}${Y} 停止全部。${X}"
  say ""
}

# --------------------------------------------------------------------------
# 子命令
# --------------------------------------------------------------------------
cmd_status(){
  local running=0
  if [[ -f "$SERVE_PID" ]] && kill -0 "$(cat "$SERVE_PID")" 2>/dev/null; then
    say "${G}● 本地服务运行中${X} (pid $(cat "$SERVE_PID"), 端口 $PORT)"; running=1
  else say "${DIM}○ 本地服务未运行${X}"; fi
  if [[ -f "$TUNNEL_PID" ]] && kill -0 "$(cat "$TUNNEL_PID")" 2>/dev/null; then
    say "${G}● Cloudflare 隧道运行中${X} (pid $(cat "$TUNNEL_PID"))"; running=1
  else say "${DIM}○ Cloudflare 隧道未运行${X}"; fi
  [[ -f "$URL_FILE" ]] && say "公网链接： ${G}$(cat "$URL_FILE")${X}"
  [[ $running -eq 0 ]] && say "${DIM}（用 ./launch.sh 启动）${X}"
}

cmd_url(){ [[ -f "$URL_FILE" ]] && cat "$URL_FILE" || { say "${Y}未在运行${X}"; exit 1; }; }
cmd_open(){ [[ -f "$URL_FILE" ]] && open "$(cat "$URL_FILE")" || { say "${Y}未在运行${X}"; exit 1; }; }

# --------------------------------------------------------------------------
# 入口
# --------------------------------------------------------------------------
MODE="serve"   # serve | dev | build
case "${1:-}" in
  stop)    stop_all; exit 0 ;;
  status)  cmd_status; exit 0 ;;
  url)     cmd_url; exit 0 ;;
  open)    cmd_open; exit 0 ;;
  restart) stop_all ;;
  --dev)   MODE="dev" ;;
  --build) MODE="build" ;;
  ""|start) : ;;
  *) say "${R}未知参数：$1${X}  用法见脚本顶部注释"; exit 1 ;;
esac

# 先清理上一次的残留
kill_pidfile "$TUNNEL_PID"; kill_pidfile "$SERVE_PID"

trap cleanup_on_exit INT TERM

clear 2>/dev/null || true
say "${M}${B}🌊 MoodTide 启动台${X} ${DIM}(模式：$MODE)${X}"
say ""

start_serve
start_tunnel

say "${DIM}⏳ 等待 Cloudflare 分配公网域名（首次约 3~8 秒）…${X}"
if url="$(get_url)"; then
  printf "%s" "$url" >"$URL_FILE"
  banner "$url"
else
  say "${R}✗ 未能获取公网链接，隧道日志：${X}"
  tail -20 "$TUNNEL_LOG"
  stop_all; exit 1
fi

# 前台守候：任一进程退出则收尾
while true; do
  if ! kill -0 "$(cat "$SERVE_PID" 2>/dev/null)" 2>/dev/null; then
    say "${R}本地服务已退出。${X}"; break
  fi
  if ! kill -0 "$(cat "$TUNNEL_PID" 2>/dev/null)" 2>/dev/null; then
    say "${R}Cloudflare 隧道已退出（临时隧道偶发断线，重跑 ./launch.sh 即可）。${X}"; break
  fi
  sleep 2
done
cleanup_on_exit
