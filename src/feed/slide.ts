/**
 * Slide —— 信息流里的“一屏”统一接口。
 * 内容卡(ContentCard) 与 心潮卡(Card) 都实现它，Feed 用同一套逻辑调度。
 */
export interface Slide {
  el: HTMLElement
  enter(): void // 进入视口
  leave(): void // 离开视口
  destroy(): void
}
