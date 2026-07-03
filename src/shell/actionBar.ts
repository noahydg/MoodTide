/**
 * 平台自带操作栏 —— 抖音互动空间底部的「不感兴趣 / 查看详情」+「⌃ 上滑继续看视频」。
 * 这是平台 chrome（非我们的内容），全局固定在 Tab 栏之上，所有卡片共用。
 * 「查看详情」= 进入第二层（更深的哼唱/微调）。「上滑」= 切到下一条抖音内容。
 */
import { icon } from '../ui/icons'

export function actionBar(handlers: { onDetail?: () => void; onDismiss?: () => void } = {}): HTMLElement {
  const el = document.createElement('div')
  el.className = 'actbar'
  el.innerHTML = `
    <div class="actbar__btns">
      <button class="actbar__btn" type="button">不感兴趣</button>
      <button class="actbar__btn actbar__btn--primary" type="button">查看详情</button>
    </div>
    <div class="actbar__up">${icon('chevronUp', 'ico ico--up')} 上滑继续看视频</div>
  `
  const [dismiss, detail] = el.querySelectorAll<HTMLButtonElement>('.actbar__btn')
  dismiss.addEventListener('click', () => handlers.onDismiss?.())
  detail.addEventListener('click', () => handlers.onDetail?.())
  return el
}
