/**
 * 顶部导航 —— 1:1 模仿抖音（☰ / 团购 经验 温州 关注 商城 推荐 / ⌕）。
 * 「推荐」高亮 + 下划线。温州＝本次黑客松城市，呼应在地感。
 */
const TABS = ['团购', '经验', '温州', '关注', '商城', '推荐']
const ACTIVE = '推荐'

export function topNav(): HTMLElement {
  const el = document.createElement('header')
  el.className = 'topnav'
  el.innerHTML = `
    <button class="topnav__menu" aria-label="菜单">
      <svg viewBox="0 0 22 16"><rect y="1" width="22" height="2" rx="1"/><rect y="7" width="16" height="2" rx="1"/><rect y="13" width="22" height="2" rx="1"/></svg>
    </button>
    <nav class="topnav__tabs">
      ${TABS.map((t) => `<span class="${t === ACTIVE ? 'is-active' : ''}">${t}</span>`).join('')}
    </nav>
    <button class="topnav__search" aria-label="搜索">
      <svg viewBox="0 0 22 22"><circle cx="9.5" cy="9.5" r="7" fill="none" stroke="currentColor" stroke-width="2"/><line x1="14.5" y1="14.5" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
  `
  return el
}
