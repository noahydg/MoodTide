/**
 * 心潮卡片 —— 第一层信息流的内容单元。
 *
 * 视觉语言参照获奖 Demo（莫干山攻略）：**实拍海天背景 + 玻璃拟态信息卡分层叠放 +
 * 抖音导航栏 + 丰富结构化内容 + 底部操作按钮**。把“情绪推断”呈现成一张像旅行攻略
 * 一样精致、可读、可信的“此刻心境攻略”。
 *
 * 内容映射（对应 Demo 的结构）：
 *   标题 + AI 徽标          ← Demo 大标题 + “AI生成”
 *   心境概览四宫格           ← Demo 目的地/天数/气温/风景
 *   「为什么是这首」+ 实时声波 ← Demo 简介 + 海拔剖面图（换成 AnalyserNode 实时波形）
 *   「此刻在响」读心文案+共鸣  ← Demo 博主语录卡
 *   不太对 / 听得更深         ← Demo 不感兴趣 / 查看详情
 */

import { gsap } from 'gsap'
import { MOODS, BG_URL, applyPalette, type Mood } from '../context/palette'
import { SynthEngine } from '../audio/synthEngine'
import { WaveStrip } from '../visual/waveStrip'
import { bindHoldToKeep } from '../interaction/holdToKeep'
import { tideJar } from '../store/tideJar'
import type { Slide } from './slide'
import type { MoodInference } from '../sense/types'
import type { Context } from '../context/contextEngine'

export interface CardData {
  mood: Mood
  signature: string
  ctx?: Context // 真实情境（首张=此刻），用于概览四宫格
  mindOverride?: string
  inference?: MoodInference
}

export interface CardHandlers {
  onKept?: (mind: string) => void
  onOpen?: (data: CardData) => void
  inferAtEnter?: () => MoodInference
}

// 共鸣语录池：城市 + 一句，营造“此刻同潮的人”（不孤独）
const PEER_POOL = [
  { ava: '🌃', city: '上海', line: '也在这个点没睡，收下了一段' },
  { ava: '🌧️', city: '杭州', line: '窗外的雨，刚好配上了' },
  { ava: '🌙', city: '成都', line: '深夜一个人，被这段接住了' },
  { ava: '☕', city: '北京', line: '加班的间隙，听了一遍又一遍' },
  { ava: '🏙️', city: '深圳', line: '回家地铁上，正好是这个味道' },
]

export class Card implements Slide {
  el: HTMLElement
  private synth: SynthEngine
  private wave: WaveStrip
  private data: CardData
  private mind = ''
  private playing = false
  private unbindHold: (() => void) | null = null
  private handlers: CardHandlers

  constructor(data: CardData, synth: SynthEngine, handlers: CardHandlers = {}) {
    this.data = data
    this.synth = synth
    this.handlers = handlers
    const spec = MOODS[data.mood]

    this.el = document.createElement('section')
    this.el.className = 'card'
    this.el.innerHTML = `
      <div class="card__bg"></div>
      <div class="card__tint"></div>
      <div class="card__scrim"></div>

      <header class="card__nav">
        <span class="nav__menu">☰</span>
        <nav class="nav__tabs"><i>关注</i><i>朋友</i><b>推荐</b><i>同城</i></nav>
        <span class="nav__search">⌕</span>
      </header>

      <div class="card__scroll">
        <div class="card__titleRow">
          <h1 class="card__title">此刻 · 为你而起的潮</h1>
          <span class="card__badge">心潮 · AI</span>
        </div>
        <div class="card__sig"></div>

        <section class="panel panel--stats">
          <div class="stat"><label>此刻</label><b class="st-clock">—</b></div>
          <div class="stat"><label>天气</label><b class="st-weather">—</b></div>
          <div class="stat"><label>节气</label><b class="st-term">—</b></div>
          <div class="stat"><label>心境</label><b class="st-mood">—</b></div>
        </section>

        <section class="panel panel--why">
          <div class="panel__head">
            <span class="panel__title">为什么是这首</span>
            <svg class="coord" viewBox="0 0 44 44" aria-hidden="true">
              <line x1="22" y1="5" x2="22" y2="39"></line>
              <line x1="5" y1="22" x2="39" y2="22"></line>
              <circle class="coordDot" cx="22" cy="22" r="3.6"></circle>
            </svg>
          </div>
          <p class="why__text">—</p>
          <canvas class="why__wave"></canvas>
          <div class="why__axis"><span>潮起</span><span>此刻为你而响</span><span>潮落</span></div>
        </section>

        <section class="panel panel--now">
          <div class="now__head"><span class="now__dot"></span><span>此刻正在为你而响</span></div>
          <p class="now__mind">—</p>
          <div class="now__resonance">🌊 <span class="reso-n">—</span></div>
          <div class="now__peers"></div>
        </section>
      </div>

      <div class="card__actions">
        <button class="cta cta--ghost" type="button">不太对</button>
        <button class="cta cta--fill" type="button">听得更深 ›</button>
      </div>
      <svg class="card__ring" viewBox="0 0 52 52">
        <circle class="bg" cx="26" cy="26" r="22"></circle>
        <circle class="fg" cx="26" cy="26" r="22" stroke-dasharray="138.2" stroke-dashoffset="138.2"></circle>
      </svg>
      <div class="card__hint">长按收下这段潮 · 上滑遇见下一段</div>
    `

    ;(this.el.querySelector('.card__bg') as HTMLElement).style.backgroundImage = `url(${BG_URL[spec.bg]})`
    applyPalette(this.el, spec)
    this.el.style.setProperty('--tintB', hexA(spec.colorA, 0.55))

    const canvas = this.el.querySelector('.why__wave') as HTMLCanvasElement
    this.wave = new WaveStrip(canvas)

    if (data.inference) this.renderInference(data.inference)
    this.renderStats()
    this.bindHold()
    this.bindButtons()
  }

  private renderStats() {
    const ctx = this.data.ctx
    const q = (s: string) => this.el.querySelector(s) as HTMLElement
    if (ctx) {
      q('.st-clock').textContent = ctx.clock
      q('.st-weather').textContent = ctx.weatherLabel
      q('.st-term').textContent = ctx.solarTerm
    } else {
      q('.st-clock').textContent = '另一刻'
      q('.st-weather').textContent = '——'
      q('.st-term').textContent = '——'
    }
    q('.card__sig').textContent = this.data.signature
  }

  private renderInference(inf: MoodInference) {
    this.data.inference = inf
    const q = (s: string) => this.el.querySelector(s) as HTMLElement
    q('.st-mood').textContent = inf.label
    q('.why__text').textContent = inf.why
    q('.reso-n').textContent = `今夜 ${inf.resonanceCount.toLocaleString()} 人刷到相似的潮`
    const dot = this.el.querySelector('.coordDot') as SVGCircleElement
    dot.setAttribute('cx', String(22 + inf.vector.valence * 15))
    dot.setAttribute('cy', String(22 - inf.vector.arousal * 15))
    const peers = pickPeers(2, this.data.mood)
    q('.now__peers').innerHTML = peers
      .map(
        (p) =>
          `<div class="peer"><span class="peer__ava">${p.ava}</span><div class="peer__body"><div class="peer__line">“${p.line}”</div><div class="peer__city">${p.city} · 刚刚</div></div></div>`,
      )
      .join('')
  }

  private bindButtons() {
    const ghost = this.el.querySelector('.cta--ghost') as HTMLButtonElement
    const fill = this.el.querySelector('.cta--fill') as HTMLButtonElement
    const stop = (e: Event) => e.stopPropagation()
    ;[ghost, fill].forEach((b) => b.addEventListener('pointerdown', stop))
    ghost.addEventListener('click', (e) => {
      stop(e)
      this.handlers.onOpen?.(this.data)
    })
    fill.addEventListener('click', (e) => {
      stop(e)
      this.handlers.onOpen?.(this.data)
    })
  }

  private bindHold() {
    const ring = this.el.querySelector('.card__ring') as SVGElement
    const fg = this.el.querySelector('.card__ring .fg') as SVGCircleElement
    const CIRC = 138.2
    this.unbindHold = bindHoldToKeep({
      el: this.el,
      onProgress: (p) => {
        ring.classList.toggle('is-active', p > 0)
        fg.style.strokeDashoffset = String(CIRC * (1 - p))
      },
      onTap: () => this.handlers.onOpen?.(this.data),
      onKeep: () => this.keep(),
      onCancel: () => {},
    })
  }

  /** 进入视口：刷到那一刻才推断 → 上色 → 起调 → 波形 → GSAP 编排浮出 */
  enter() {
    if (this.playing) return
    this.playing = true

    const inf = this.handlers.inferAtEnter?.() ?? this.data.inference
    if (inf) {
      this.data.mood = inf.mood
      const spec = MOODS[inf.mood]
      ;(this.el.querySelector('.card__bg') as HTMLElement).style.backgroundImage = `url(${BG_URL[spec.bg]})`
      applyPalette(this.el, spec)
      this.el.style.setProperty('--tintB', hexA(spec.colorA, 0.55))
      this.renderInference(inf)
      this.renderStats()
    }
    const spec = MOODS[this.data.mood]
    this.mind = this.data.mindOverride ?? spec.minds[Math.floor(Math.random() * spec.minds.length)]
    ;(this.el.querySelector('.now__mind') as HTMLElement).textContent = this.mind

    this.synth.play(spec)
    this.wave.attach(this.synth.getAnalyser())
    this.wave.refreshTheme()
    this.wave.start()

    this.choreograph()
  }

  /** 入场编排：标题 → 概览 → 为什么 → 此刻在响 → 操作，逐层浮出 */
  private choreograph() {
    const q = (s: string) => this.el.querySelector(s) as HTMLElement
    const tl = gsap.timeline()
    tl.fromTo(q('.card__nav'), { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.5 })
      .fromTo([q('.card__titleRow'), q('.card__sig')], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, 0.15)
      .fromTo(q('.panel--stats'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.5)
      .fromTo(q('.panel--why'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.72)
      .fromTo(q('.panel--now'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.94)
      .fromTo(q('.card__actions'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 1.2)
      .fromTo(q('.card__hint'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 1.4)
  }

  leave() {
    if (!this.playing) return
    this.playing = false
    this.synth.ebb()
    this.wave.stop()
  }

  private keep() {
    const spec = MOODS[this.data.mood]
    tideJar.keep({ mood: this.data.mood, moodLabel: spec.label, signature: this.data.signature, mind: this.mind })
    this.flyToJar()
    this.handlers.onKept?.(this.mind)
  }

  private flyToJar() {
    const shell = document.createElement('div')
    shell.className = 'shell'
    const jar = document.querySelector('.jar') as HTMLElement | null
    const sx = window.innerWidth / 2 - 13
    const sy = window.innerHeight / 2 - 13
    shell.style.left = `${sx}px`
    shell.style.top = `${sy}px`
    document.body.appendChild(shell)
    const tx = jar ? jar.getBoundingClientRect().left - sx : window.innerWidth - 60 - sx
    const ty = jar ? jar.getBoundingClientRect().top - sy : -sy + 80
    shell.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(0.3)`, opacity: 0.2 },
      ],
      { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)' },
    ).onfinish = () => shell.remove()
  }

  destroy() {
    this.unbindHold?.()
    this.wave.stop()
  }
}

function pickPeers(n: number, mood: Mood) {
  const off = Math.abs(hashStr(mood)) % PEER_POOL.length
  const out = []
  for (let i = 0; i < n; i++) out.push(PEER_POOL[(off + i) % PEER_POOL.length])
  return out
}
function hashStr(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
function hexA(hex: string, a: number) {
  const s = hex.replace('#', '')
  const n = s.length === 3 ? s.split('').map((x) => x + x).join('') : s
  const r = parseInt(n.slice(0, 2), 16) || 0
  const g = parseInt(n.slice(2, 4), 16) || 0
  const b = parseInt(n.slice(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${a})`
}
