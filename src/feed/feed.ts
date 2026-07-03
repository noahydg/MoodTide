/**
 * 抖音风格全屏竖向信息流（第一层）。
 * 用 IntersectionObserver 检测哪一屏进入视口 → enter()，其余 leave()。
 * 同一时刻只有一屏“激活”（心潮卡同一时刻只一张在响）。
 * 内容卡(ContentCard) 与 心潮卡(Card) 都是 Slide，统一调度。
 */

import type { Slide } from './slide'

export class Feed {
  private root: HTMLElement
  private slides: Slide[] = []
  private io: IntersectionObserver
  private current = -1
  private paused = false

  constructor(root: HTMLElement) {
    this.root = root
    this.io = new IntersectionObserver((entries) => this.onIntersect(entries), {
      root: this.root,
      threshold: 0.6,
    })
  }

  setSlides(slides: Slide[]) {
    this.slides.forEach((s) => {
      this.io.unobserve(s.el)
      s.destroy()
    })
    this.root.innerHTML = ''
    this.slides = slides
    slides.forEach((s) => {
      this.root.appendChild(s.el)
      this.io.observe(s.el)
    })
  }

  /** 进入应用后，激活首屏 */
  activateFirst() {
    if (this.slides[0]) {
      this.current = 0
      this.slides[0].enter()
    }
  }

  /** 进入详情页：挂起当前屏，暂停 IO 响应 */
  pause() {
    this.paused = true
    if (this.current >= 0) this.slides[this.current]?.leave()
  }

  /** 退出详情页：恢复当前屏 */
  resume() {
    this.paused = false
    if (this.current >= 0) this.slides[this.current]?.enter()
  }

  private onIntersect(entries: IntersectionObserverEntry[]) {
    if (this.paused) return
    for (const e of entries) {
      const idx = this.slides.findIndex((s) => s.el === e.target)
      if (idx < 0) continue
      if (e.isIntersecting && idx !== this.current) {
        if (this.current >= 0) this.slides[this.current]?.leave()
        this.slides[idx].enter()
        this.current = idx
      }
    }
  }
}
