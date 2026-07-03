/**
 * 手机模型外框 —— 桌面预览时把 App 包进一个精致的 iPhone 机身（机身/灵动岛/侧键/反光）。
 *
 * 自适应：
 *   - 宽屏（桌面/演示）：居中显示带边框的手机，像产品样机。
 *   - 窄屏（真机/抖音沙箱）：CSS 媒体查询自动去掉边框，全屏铺满。
 *
 * 返回「屏幕内层」元素，App 内容挂到这里。
 */
export function mountPhone(root: HTMLElement): HTMLElement {
  root.innerHTML = ''
  root.className = 'stageRoot'

  const device = document.createElement('div')
  device.className = 'device'

  const frame = document.createElement('div')
  frame.className = 'device__frame'

  const screen = document.createElement('div')
  screen.className = 'device__screen'

  const island = document.createElement('div')
  island.className = 'device__island'

  const glare = document.createElement('div')
  glare.className = 'device__glare'

  frame.append(screen, island, glare)
  device.append(frame)
  root.append(device)

  return screen
}
