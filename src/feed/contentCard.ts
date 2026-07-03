/**
 * 内容卡 —— 迷你信息流里的“你刚刷过的视频”。
 * 进入视口即记入 BrowsingTracker（作为 MoodSense 的处境层信号）。
 * 用实拍背景统一观感（emoji 作主体占位，后续可换真实短视频/图）。
 */

import type { Slide } from './slide'
import type { PrerollItem, BrowsingTracker } from './prerollFeed'
import { BG_URL } from '../context/palette'

export class ContentCard implements Slide {
  el: HTMLElement
  private item: PrerollItem
  private tracker: BrowsingTracker

  constructor(item: PrerollItem, tracker: BrowsingTracker) {
    this.item = item
    this.tracker = tracker
    this.el = document.createElement('section')
    this.el.className = 'content'
    // 情绪偏负→雨夜冷图(2)，偏正→晨曦暖图(1)，制造差异
    const bg = item.vector.valence < 0 ? BG_URL[2] : BG_URL[1]
    this.el.innerHTML = `
      <div class="content__bg" style="background-image:url(${bg})"></div>
      <div class="content__cover">${item.cover}</div>
      <div class="content__title">${item.title}</div>
      <div class="content__meta">为你推荐 · 正在播放</div>
      <div class="content__hint">上滑，让此刻的潮接住你 ↑</div>
    `
  }

  enter() {
    this.tracker.mark(this.item.id)
    this.el.animate(
      [
        { opacity: 0.6, transform: 'scale(1.04)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      { duration: 400, easing: 'ease-out' },
    )
  }

  leave() {}
  destroy() {}
}
