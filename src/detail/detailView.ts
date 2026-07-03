/**
 * 第二层 · 点进去的沉浸详情页。
 *
 * 「被刷到吸引进来」之后，用户点卡片进入这里，承载“更深一层”的体验：
 *   - 全屏声波海面（复用同一 AnalyserNode 实时驱动）
 *   - 情绪轮微调 → 旋律当场变形（你不必开口，但可“再拨一下”）
 *   - 收下到潮汐瓶 / 真实生成专属曲（豆包音乐，异步，有兜底）/ 分享卡导出
 *   - 返回手势回到信息流
 *
 * 音频协调：详情页打开时，信息流当前卡已 leave()（退潮）；详情页用同一个 SynthEngine。
 */

import { MOODS, BG_URL, applyPalette, type Mood, type MoodSpec } from '../context/palette'
import { SynthEngine } from '../audio/synthEngine'
import { WaveStrip } from '../visual/waveStrip'
import { MoodWheel } from '../mood/moodWheel'
import { tideJar } from '../store/tideJar'
import { resolveMusic } from '../music/musicService'
import type { CardData } from '../feed/card'

export class DetailView {
  el: HTMLElement
  private synth: SynthEngine
  private wave: WaveStrip
  private mood: Mood = 'night_calm'
  private signature = ''
  private mind = ''
  private onClose: () => void
  private audioEl: HTMLAudioElement | null = null

  constructor(synth: SynthEngine, onClose: () => void) {
    this.synth = synth
    this.onClose = onClose

    this.el = document.createElement('div')
    this.el.className = 'detail'
    this.el.innerHTML = `
      <canvas class="detail__canvas"></canvas>
      <button class="detail__back" aria-label="返回">‹ 返回潮流</button>
      <div class="detail__context"><span class="dot"></span><span class="detail__sig"></span></div>
      <div class="detail__mind"></div>
      <div class="detail__wheel"></div>
      <div class="detail__actions">
        <button class="act act--keep">收下这段心潮</button>
        <button class="act act--gen">✨ 为我真实生成专属曲</button>
        <button class="act act--share">生成分享卡</button>
      </div>
      <div class="detail__status"></div>
    `
    const canvas = this.el.querySelector('.detail__canvas') as HTMLCanvasElement
    this.wave = new WaveStrip(canvas)

    this.el.querySelector('.detail__back')!.addEventListener('click', () => this.close())
    this.el.querySelector('.act--keep')!.addEventListener('click', () => this.keep())
    this.el.querySelector('.act--gen')!.addEventListener('click', () => this.generateReal())
    this.el.querySelector('.act--share')!.addEventListener('click', () => this.share())
  }

  open(data: CardData) {
    this.mood = data.mood
    this.signature = data.signature
    const spec = MOODS[this.mood]
    this.mind = data.mindOverride ?? spec.minds[Math.floor(Math.random() * spec.minds.length)]

    applyPalette(this.el, spec)
    // 详情页背景换成对应情绪的实拍图
    this.el.style.backgroundImage = `linear-gradient(180deg, rgba(6,10,20,0.45), rgba(3,5,12,0.86)), url(${BG_URL[spec.bg]})`
    ;(this.el.querySelector('.detail__sig') as HTMLElement).textContent = this.signature
    ;(this.el.querySelector('.detail__mind') as HTMLElement).textContent = this.mind

    // 情绪轮：微调即当场换旋律
    const wheelHost = this.el.querySelector('.detail__wheel') as HTMLElement
    wheelHost.innerHTML = ''
    const wheel = new MoodWheel(this.mood, (m) => this.changeMood(m))
    wheelHost.appendChild(wheel.el)

    this.el.classList.add('is-open')
    this.playSynth(spec)
  }

  private playSynth(spec: MoodSpec) {
    this.stopAudioEl()
    this.synth.play(spec)
    this.wave.attach(this.synth.getAnalyser())
    this.wave.refreshTheme()
    this.wave.start()
  }

  private changeMood(m: Mood) {
    this.mood = m
    const spec = MOODS[m]
    applyPalette(this.el, spec)
    this.el.style.backgroundImage = `linear-gradient(180deg, rgba(6,10,20,0.45), rgba(3,5,12,0.86)), url(${BG_URL[spec.bg]})`
    this.mind = spec.minds[Math.floor(Math.random() * spec.minds.length)]
    ;(this.el.querySelector('.detail__mind') as HTMLElement).textContent = this.mind
    this.playSynth(spec)
  }

  private keep() {
    const spec = MOODS[this.mood]
    tideJar.keep({ mood: this.mood, moodLabel: spec.label, signature: this.signature, mind: this.mind })
    this.status('已收入潮汐瓶 🫙')
  }

  /** 第二层独有：真实调用豆包音乐生成（异步，有兜底）。这是技术含量 Happy Path。 */
  private async generateReal() {
    this.status('正在为此刻生成专属曲…')
    const res = await resolveMusic(
      { mood: this.mood, signature: this.signature, instrumental: true },
      { online: true, engine: 'doubao', onProgress: (s) => this.status(s) },
    )
    if (res.audioUrl) {
      this.playUrl(res.audioUrl)
      this.status(`已生成 · 来源 ${res.source} · 此段为你而生`)
    } else {
      // 兜底：继续用合成器（已经在响），用户无感
      this.status('网络不稳，已用本地潮声为你顶上（体验不中断）')
    }
  }

  private playUrl(url: string) {
    this.stopAudioEl()
    const a = new Audio(url)
    a.crossOrigin = 'anonymous'
    a.loop = true
    // 把真实音频也接入同一可视化 analyser，让声波海面随真曲起伏
    this.synth.connectExternal(a)
    a.play().catch(() => {})
    this.audioEl = a
    this.wave.attach(this.synth.getAnalyser())
  }

  private async share() {
    this.status('分享卡导出开发中（竖屏 9:16 + 情境水印 + 二维码）')
  }

  private status(s: string) {
    ;(this.el.querySelector('.detail__status') as HTMLElement).textContent = s
  }

  private stopAudioEl() {
    if (this.audioEl) {
      this.audioEl.pause()
      this.audioEl = null
    }
  }

  close() {
    this.stopAudioEl()
    this.synth.ebb()
    this.wave.stop()
    this.el.classList.remove('is-open')
    this.onClose()
  }
}
