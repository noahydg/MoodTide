/**
 * 底部 Tab —— 1:1 模仿获奖 Demo（首页 朋友 ➕ 消息 我），简洁无红点。
 * ➕ 用抖音标志性的红蓝错位白方块。
 */
export function tabBar(): HTMLElement {
  const el = document.createElement('nav')
  el.className = 'tabbar'
  el.innerHTML = `
    <span class="tab is-active">首页</span>
    <span class="tab">朋友</span>
    <span class="tab tab--plus"><span class="plus">+</span></span>
    <span class="tab">消息</span>
    <span class="tab">我</span>
  `
  return el
}
