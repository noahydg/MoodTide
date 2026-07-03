/**
 * 卡片手势 —— 在“滚动 / 轻点进入 / 长按收下”之间消歧。
 *   - 轻点（快速松手、无位移）       → onTap：点进去看详情（第二层）
 *   - 长按到阈值                     → onKeep：把这段心潮收下（潮汐瓶）
 *   - 拖动（位移超阈值）             → 视为滚动，取消手势
 *
 * 用 pointer 事件统一鼠标/触屏。长按进度环在 TAP 窗口（避免轻点也闪环）之后才显示。
 */

interface HoldOptions {
  el: HTMLElement
  holdMs?: number
  tapMaxMs?: number
  moveTolerance?: number
  onProgress?: (p: number) => void
  onTap?: () => void
  onKeep: () => void
  onCancel: () => void
}

export function bindHoldToKeep({
  el,
  holdMs = 1100,
  tapMaxMs = 220,
  moveTolerance = 12,
  onProgress,
  onTap,
  onKeep,
  onCancel,
}: HoldOptions) {
  let raf = 0
  let startT = 0
  let sx = 0
  let sy = 0
  let active = false
  let moved = false
  let kept = false

  const tick = () => {
    const elapsed = performance.now() - startT
    // TAP 窗口内不显示进度环（保持轻点干净）
    const p = elapsed <= tapMaxMs ? 0 : Math.min((elapsed - tapMaxMs) / (holdMs - tapMaxMs), 1)
    onProgress?.(p)
    if (p >= 1) {
      kept = true
      finish()
      return
    }
    raf = requestAnimationFrame(tick)
  }

  const start = (e: PointerEvent) => {
    if (active || e.button === 2) return
    active = true
    moved = false
    kept = false
    startT = performance.now()
    sx = e.clientX
    sy = e.clientY
    raf = requestAnimationFrame(tick)
  }

  const move = (e: PointerEvent) => {
    if (!active) return
    if (Math.abs(e.clientX - sx) > moveTolerance || Math.abs(e.clientY - sy) > moveTolerance) {
      moved = true
      cancel() // 当作滚动
    }
  }

  const finish = () => {
    if (!active) return
    active = false
    cancelAnimationFrame(raf)
    onProgress?.(0)
    if (kept) {
      onKeep()
      return
    }
    const elapsed = performance.now() - startT
    if (!moved && elapsed <= tapMaxMs) onTap?.()
    else onCancel()
  }

  const cancel = () => {
    if (!active) return
    active = false
    cancelAnimationFrame(raf)
    onProgress?.(0)
    onCancel()
  }

  el.addEventListener('pointerdown', start)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', finish)
  el.addEventListener('pointercancel', cancel)
  el.addEventListener('pointerleave', cancel)

  return () => {
    cancelAnimationFrame(raf)
    el.removeEventListener('pointerdown', start)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', finish)
    el.removeEventListener('pointercancel', cancel)
    el.removeEventListener('pointerleave', cancel)
  }
}
