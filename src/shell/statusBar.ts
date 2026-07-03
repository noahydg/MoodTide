/**
 * 状态栏 —— 模仿 iOS 抖音顶部（11:44 + 定位箭头 / 信号 wifi 电量）。
 * 时间用真实当前时间，呼应「此刻」。
 */
export function statusBar(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'statusbar'
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  el.innerHTML = `
    <div class="statusbar__time">
      ${hh}:${mm}
      <svg class="ic-loc" viewBox="0 0 16 16"><path d="M14 2L2 7l5 2 2 5z" fill="currentColor"/></svg>
    </div>
    <div class="statusbar__sys">
      <svg class="ic-signal" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity="0.35"/></svg>
      <svg class="ic-wifi" viewBox="0 0 16 12"><path d="M8 11.2l1.8-2.2a2.4 2.4 0 0 0-3.6 0L8 11.2zM3.6 5.8l1.5 1.8a4.6 4.6 0 0 1 5.8 0l1.5-1.8a7 7 0 0 0-8.8 0zM1 2.8l1.5 1.8a10.6 10.6 0 0 1 11 0L16 2.8a13 13 0 0 0-15 0z"/></svg>
      <span class="statusbar__batt"><i>56</i><svg viewBox="0 0 26 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3" fill="none" stroke="currentColor" opacity="0.5"/><rect x="2" y="2" width="13" height="9" rx="1.5"/><rect x="24" y="4" width="2" height="5" rx="1"/></svg></span>
    </div>
  `
  return el
}
