/**
 * 抖音外壳 —— 手机模型 → (实拍海景 + 遮罩 + 状态栏 + 顶部导航 +
 * 第一层 4 卡横滑 pager + 平台操作栏(不感兴趣/查看详情/上滑) + 底部 Tab)。
 *
 * 第一层四张卡（左右滑，区别于上下刷视频）：
 *   ① 此刻的潮 ② 拍打海面 Tap the Sea ③ 给你的建议 ④ 海潮日记
 * 平台操作栏与底部 Tab 是抖音自带 chrome，全局固定。「查看详情」→ 第二层。
 */
import { mountPhone } from './phoneFrame'
import { statusBar } from './statusBar'
import { topNav } from './topNav'
import { actionBar } from './actionBar'
import { tabBar } from './tabBar'
import { mountPager } from '../feed/pager'
import { card1Now } from '../cards/card1Now'
import { card2Sea } from '../cards/card2Sea'
import { card3Suggest } from '../cards/card3Suggest'
import { card4Diary } from '../cards/card4Diary'
import { mountLayer2 } from '../layer2/layer2'

export function mountShell(root: HTMLElement) {
  const screen = mountPhone(root)

  const stage = document.createElement('div')
  stage.className = 'stage'

  const bg = document.createElement('div')
  bg.className = 'stage__bg'
  bg.style.backgroundImage = 'url(./bg/bg1.jpg)'

  const tint = document.createElement('div')
  tint.className = 'stage__tint'

  const scrim = document.createElement('div')
  scrim.className = 'stage__scrim'

  // 第二层（小程序）：浮在第一层之上，从「查看详情/哼一曲/展开日记」点入
  const layer2 = mountLayer2(screen)
  const toLayer2 = (entry?: { card?: number; from?: string }) => layer2.open(entry)

  const pager = mountPager([
    card1Now(),
    card2Sea(() => toLayer2({ from: '哼一曲' })),
    card3Suggest(),
    card4Diary(() => toLayer2({ from: '展开海潮日记' })),
  ])

  const bar = actionBar({
    onDetail: () => toLayer2({ from: '查看详情' }),
    onDismiss: () => console.log('[MoodTide] 不感兴趣'),
  })

  stage.append(bg, tint, scrim, statusBar(), topNav(), pager, bar, tabBar())
  screen.append(stage)
}
