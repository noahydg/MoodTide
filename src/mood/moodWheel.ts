/**
 * 情绪轮 —— 第二层（点进去）里的“唯一一次极轻互动”。
 * 一排情绪色点，轻点即把“环境给的底色”微调成“我此刻的心情”，旋律当场变形。
 * 守住“你不必开口”：进来已自动起调，这里只是可选的“再轻轻拨一下”。
 */

import { MOODS, type Mood } from '../context/palette'

export class MoodWheel {
  el: HTMLElement
  private onPick: (mood: Mood) => void
  private active: Mood

  constructor(initial: Mood, onPick: (mood: Mood) => void) {
    this.onPick = onPick
    this.active = initial
    this.el = document.createElement('div')
    this.el.className = 'wheel'
    this.el.innerHTML = `<div class="wheel__hint">轻轻一拨，调成此刻的你</div><div class="wheel__dots"></div>`
    const dots = this.el.querySelector('.wheel__dots') as HTMLElement

    ;(Object.keys(MOODS) as Mood[]).forEach((m) => {
      const spec = MOODS[m]
      const dot = document.createElement('button')
      dot.className = 'wheel__dot' + (m === initial ? ' is-active' : '')
      dot.style.background = `radial-gradient(circle at 35% 30%, ${spec.sea}, ${spec.colorB})`
      dot.dataset.mood = m
      dot.innerHTML = `<span>${spec.label.split('·').slice(-1)[0]}</span>`
      dot.addEventListener('click', () => this.pick(m))
      dots.appendChild(dot)
    })
  }

  private pick(m: Mood) {
    if (m === this.active) return
    this.active = m
    this.el.querySelectorAll('.wheel__dot').forEach((d) => {
      d.classList.toggle('is-active', (d as HTMLElement).dataset.mood === m)
    })
    this.onPick(m)
  }
}
