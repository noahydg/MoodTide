/**
 * 第一层卡片的统一接口。4 张卡都实现它，横滑容器 pager 用同一套调度。
 * enter/leave 在卡片进入/离开视口时触发（如 Tap the Sea 的音频、卡1的均衡器）。
 */
export interface PageCard {
  el: HTMLElement
  enter?(): void
  leave?(): void
}
