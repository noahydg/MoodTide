/**
 * 横滑容器 —— 第一层的 4 张卡片左右滑（区别于上下刷视频）。
 * CSS scroll-snap 横向分页 + 顶部圆点指示 + 进入/离开生命周期。
 */
import type { PageCard } from '../cards/types'

export function mountPager(cards: PageCard[]): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'pager'

  const track = document.createElement('div')
  track.className = 'pager__track'
  cards.forEach((c) => {
    const page = document.createElement('div')
    page.className = 'pager__page'
    page.appendChild(c.el)
    track.appendChild(page)
  })

  const dots = document.createElement('div')
  dots.className = 'pager__dots'
  dots.innerHTML = cards.map((_, i) => `<i class="${i === 0 ? 'is-on' : ''}"></i>`).join('')

  wrap.append(dots, track)

  let active = -1
  const setActive = (i: number) => {
    if (i === active || i < 0 || i >= cards.length) return
    if (active >= 0) cards[active].leave?.()
    active = i
    cards[i].enter?.()
    ;[...dots.children].forEach((d, di) => d.classList.toggle('is-on', di === i))
  }

  let raf = 0
  track.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth)
        setActive(i)
      })
    },
    { passive: true },
  )

  // 点圆点跳转
  ;[...dots.children].forEach((d, i) => {
    d.addEventListener('click', () => {
      track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' })
    })
  })

  requestAnimationFrame(() => setActive(0))
  return wrap
}
