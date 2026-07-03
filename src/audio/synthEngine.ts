/**
 * 合成器引擎 —— 零素材也能跑的“当场生成”兜底 + 技术亮点。
 *
 * 用 Web Audio 按情绪参数实时合成一段环境氛围 pad（每次播放音符随机、绝不重复），
 * 并暴露 AnalyserNode 供声波海面做“音频实时驱动”的可视化。
 *
 * 后续可平滑替换为真实 mp3 音乐池 / Suno 生成的音频：
 * 只要让 pool 返回 AudioBuffer/URL，再接到同一个 analyser 即可，可视化层不用改。
 */

import type { MoodSpec } from '../context/palette'

export class SynthEngine {
  private ctx: AudioContext
  private master: GainNode
  private analyser: AnalyserNode
  private voices: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode }[] = []
  private timer: number | null = null
  private extSource: MediaElementAudioSourceNode | null = null
  private extEl: HTMLMediaElement | null = null

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 1024
    this.analyser.smoothingTimeConstant = 0.82
    this.master.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
  }

  /** 浏览器自动播放策略：必须在一次用户手势里 resume */
  async unlock() {
    if (this.ctx.state === 'suspended') await this.ctx.resume()
  }

  getAnalyser() {
    return this.analyser
  }

  /**
   * 把外部音频元素（真实 mp3 / 豆包/Suno 生成的曲）接入同一条 analyser，
   * 让声波海面也能随“真曲”实时起伏。接入时停掉合成器，避免叠音。
   * 注意：一个 <audio> 元素只能 createMediaElementSource 一次，这里做缓存与切换。
   */
  connectExternal(el: HTMLMediaElement) {
    this.stopNow()
    if (this.extEl === el && this.extSource) return
    try {
      this.extSource?.disconnect()
    } catch {
      /* ignore */
    }
    this.extSource = this.ctx.createMediaElementSource(el)
    this.extEl = el
    this.extSource.connect(this.analyser)
  }

  /** 按情绪开始播放（淡入）。会先停掉上一段。 */
  play(spec: MoodSpec) {
    this.stopNow()

    // 1) 低频持续衬底（drone）：根音 + 五度，营造“海面”厚度
    const droneFreqs = [spec.rootHz / 2, (spec.rootHz / 2) * 1.5]
    droneFreqs.forEach((f) => this.addVoice(f, 'sine', 0.12 * (0.6 + spec.brightness * 0.4)))

    // 2) 旋律 pad：从音阶里随机挑 3 个音叠成柔和和声（每次播放不同 → 不重复）
    const picks = this.pickNotes(spec.scale, 3)
    picks.forEach((semi) => {
      const f = spec.rootHz * Math.pow(2, semi / 12)
      this.addVoice(f, spec.brightness > 0.6 ? 'triangle' : 'sine', 0.08)
    })

    // 3) 缓慢的“呼吸”起伏：让整体音量随 tempo 起落（潮起潮落）
    const now = this.ctx.currentTime
    const period = 6 - spec.tempo * 3 // tempo 越快，呼吸越短
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(0.0001, now)
    this.master.gain.exponentialRampToValueAtTime(0.9, now + 1.4) // 淡入
    this.breathe(period)
  }

  /** 退潮：淡出后停止（松手不收下时调用） */
  ebb(seconds = 1.6) {
    const now = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value || 0.0001, now)
    this.master.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
    window.setTimeout(() => this.stopNow(), seconds * 1000 + 60)
  }

  private breathe(period: number) {
    const loop = () => {
      const now = this.ctx.currentTime
      const g = this.master.gain
      g.cancelScheduledValues(now)
      g.setValueAtTime(g.value || 0.4, now)
      g.linearRampToValueAtTime(0.95, now + period / 2)
      g.linearRampToValueAtTime(0.5, now + period)
    }
    loop()
    this.timer = window.setInterval(loop, period * 1000)
  }

  private addVoice(freq: number, type: OscillatorType, gainVal: number) {
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.value = freq

    // 轻微失谐 + 慢速 LFO 颤动，避免电子味、更接近“有机”的潮声
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.frequency.value = 0.08 + Math.random() * 0.12
    lfoGain.gain.value = freq * 0.004
    lfo.connect(lfoGain).connect(osc.frequency)

    gain.gain.value = gainVal
    osc.connect(gain).connect(this.master)
    osc.start()
    lfo.start()
    this.voices.push({ osc, gain, lfo })
  }

  private pickNotes(scale: number[], n: number): number[] {
    const pool = [...scale, ...scale.map((s) => s + 12)] // 跨一个八度
    const out: number[] = []
    for (let i = 0; i < n; i++) {
      out.push(pool[Math.floor(Math.random() * pool.length)])
    }
    return out
  }

  private stopNow() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.voices.forEach((v) => {
      try {
        v.osc.stop()
        v.lfo.stop()
      } catch {
        /* already stopped */
      }
    })
    this.voices = []
  }
}
