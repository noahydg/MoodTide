/**
 * 第二卡 · 拍打海面 Tap the Sea —— small game to adjust the music。
 *
 * 拍打海面：起涟漪 + 震动 + 水滴音 + 同时 UI 发生变化（色温脉动）。
 * 这把"用户此刻的节奏"录进去——拍得快=律动强，拍得慢=平静——之后直接驱动音乐节奏。
 * 「哼一曲」是更深入的输入，点它＝进入第二层（本步先占位）。
 */
import { SeaAudio, buzz } from './seaAudio'
import { WaterSurface } from './seaCanvas'
import { icon } from '../ui/icons'
import type { PageCard } from './types'

export function card2Sea(onHum?: () => void): PageCard {
  const audio = new SeaAudio()

  const el = document.createElement('div')
  el.className = 'card card2'
  el.innerHTML = `
    <div class="sea__flash"></div>
    <div class="c-head">
      <h1 class="c-title">把它拍进海里</h1>
      <span class="c-ai">${icon('hand', 'ico ico--xs')}Tap the Sea</span>
    </div>
    <div class="c-sig">心里憋着的，一下下拍进海里 · 拍得越用力，这段潮越懂你此刻</div>

    <div class="sea__zone" role="button" aria-label="拍打海面">
      <canvas class="sea__cv"></canvas>
      <div class="sea__center">
        <div class="sea__bpm"><span class="sea__hint">${icon('hand')} 轻轻拍一下</span></div>
        <div class="sea__bpmsub">把这一刻的心情交给海</div>
      </div>
    </div>

    <button class="sea__deep" type="button">
      <span class="sea__deep-ic">${icon('waveform')}</span>
      <span class="sea__deep-tx">
        <b>说不出口的，哼给海听</b>
        <i>哼一句，潮会长出你的声音</i>
      </span>
      <span class="sea__deep-go">${icon('chevronRight')}</span>
    </button>
  `

  const zone = el.querySelector('.sea__zone') as HTMLElement
  const bpmEl = el.querySelector('.sea__bpm') as HTMLElement
  const subEl = el.querySelector('.sea__bpmsub') as HTMLElement
  const flash = el.querySelector('.sea__flash') as HTMLElement
  const water = new WaterSurface(el.querySelector('.sea__cv') as HTMLCanvasElement)

  // 连续快拍 → 强度更大（溅得更猛、涟漪更密）
  let lastTap = 0
  zone.addEventListener('pointerdown', (e) => {
    const rect = zone.getBoundingClientRect()
    const x = (e as PointerEvent).clientX - rect.left
    const y = (e as PointerEvent).clientY - rect.top

    const now = performance.now()
    const fast = now - lastTap < 420
    lastTap = now
    const strength = fast ? 1.6 : 1

    water.tap(x, y, strength) // 艺术化涟漪 + 月光粒子溅射
    buzz(fast ? 22 : 14) // 安卓震动
    audio.tap() // 水滴音 + 记节奏

    // 全卡色温脉动一下
    flash.animate([{ opacity: 0.45 }, { opacity: 0 }], { duration: 560, easing: 'ease-out' })

    const bpm = audio.bpm()
    if (bpm) {
      bpmEl.innerHTML = `${icon('waveform')} ${bpm}`
      subEl.textContent = bpm > 110 ? '很用力 · 把情绪都拍出来' : bpm > 75 ? '一下一下 · 慢慢松开' : '轻轻的 · 像在叹气'
    } else {
      bpmEl.textContent = '再拍几下…'
      subEl.textContent = '让海记住你此刻的节奏'
    }
  })

  const deep = el.querySelector('.sea__deep') as HTMLButtonElement
  deep.addEventListener('click', () => onHum?.())

  return {
    el,
    enter() {
      water.refreshTheme()
      water.start() // 进入卡片才跑 RAF
    },
    leave() {
      water.stop() // 离开即停，省电（性能技能要求）
      audio.reset()
      bpmEl.innerHTML = `<span class="sea__hint">${icon('hand')} 轻轻拍一下</span>`
      subEl.textContent = '把这一刻的心情交给海'
    },
  }
}
