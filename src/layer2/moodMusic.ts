/**
 * MoodMusic —— 第二层沉浸屏的音乐引擎。
 *
 * 优先播放预设音轨（MiniMax music-2.5 生成，public/music/mood{0..3}.mp3）；
 * 文件加载失败才回退到内置 Web Audio 合成（保证 demo 不静音）。
 * 拍海 / 速度滑杆 → 实时变速（playbackRate）；微调走向 → 换曲速/音色。
 * 进沉浸屏 start()，离开 stop()，省电。
 *
 * 接真模型：换 public/music 里的文件即可，或改 scripts/genMusic.mjs 重烤。
 */
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

export interface MoodPreset {
  name: string
  rootMidi: number
  scale: number[]
  progression: number[]
  bpm: number
  reverb: number
  density: number
  brightness: number
  melodyOct: number
  attack: number
}

// 四种心境（与 layer2 data.ts 的 feed 顺序一致）——合成回退用的乐理参数
export const PRESETS: MoodPreset[] = [
  { name: '深夜', rootMidi: 53, scale: [0, 2, 3, 5, 7, 8, 10], progression: [0, 5, 2, 6], bpm: 56, reverb: 0.6, density: 0.45, brightness: 0.32, melodyOct: 1, attack: 0.012 },
  { name: '黄昏', rootMidi: 60, scale: [0, 2, 4, 5, 7, 9, 11], progression: [0, 5, 3, 4], bpm: 68, reverb: 0.5, density: 0.55, brightness: 0.5, melodyOct: 0, attack: 0.05 },
  { name: '通勤', rootMidi: 57, scale: [0, 2, 3, 5, 7, 8, 10], progression: [0, 3, 4, 5], bpm: 70, reverb: 0.42, density: 0.6, brightness: 0.46, melodyOct: 0, attack: 0.02 },
  { name: '雨天', rootMidi: 50, scale: [0, 2, 3, 5, 7, 8, 10], progression: [0, 5, 2, 4], bpm: 58, reverb: 0.62, density: 0.5, brightness: 0.34, melodyOct: 1, attack: 0.05 },
]

// 微调四走向（与 moodChips 顺序一致）——合成回退时改变换
export const TONES: Array<(p: MoodPreset) => MoodPreset> = [
  (p) => ({ ...p, bpm: Math.round(p.bpm * 0.82), density: 0.32, brightness: Math.max(0.24, p.brightness - 0.12), attack: Math.max(p.attack, 0.05) }),
  (p) => ({ ...p, scale: [0, 2, 4, 5, 7, 9, 11], progression: [0, 5, 3, 4], bpm: Math.round(p.bpm * 1.06), brightness: Math.min(0.7, p.brightness + 0.16), reverb: Math.max(0.4, p.reverb - 0.06) }),
  (p) => ({ ...p, scale: [0, 2, 3, 5, 7, 8, 10], reverb: Math.min(0.78, p.reverb + 0.12), density: 0.3, attack: 0.12, brightness: Math.max(0.28, p.brightness - 0.06) }),
  (p) => ({ ...p, bpm: Math.round(p.bpm * 1.18), density: 0.6, brightness: Math.min(0.72, p.brightness + 0.12), attack: 0.012 }),
]

export class MoodMusic {
  // 合成相关
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private wet: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private padFilter: BiquadFilterNode | null = null
  private padOsc: OscillatorNode[] = []
  private padGain: GainNode[] = []
  private padLfo: OscillatorNode | null = null
  private timer: number | null = null
  private preset: MoodPreset = PRESETS[0]
  private feed: MoodPreset = PRESETS[0]
  private bpm = 56
  private degree = 0
  private barIndex = 0
  private step = 0
  private nextStepTime = 0
  notes = 0

  // 预设音轨
  audio: HTMLAudioElement | null = null
  private usingFile = false
  private curIndex = 0
  playing = false
  src = 'none' // 'file' | 'synth' | 'none'

  // ============ 公开 API ============
  /** 进入某心境并开始（用户手势里调用，解锁音频）。优先放真音乐文件。 */
  start(presetIndex?: number) {
    if (typeof presetIndex === 'number') {
      this.curIndex = presetIndex
      this.feed = PRESETS[presetIndex] ?? PRESETS[0]
      this.preset = this.feed
      this.bpm = this.preset.bpm
    }
    this.playing = true
    this.startFile(this.curIndex)
  }

  pause() {
    this.playing = false
    if (this.audio) {
      this.fadeAudio(0, 0.4)
      const a = this.audio
      window.setTimeout(() => {
        if (!this.playing) {
          try {
            a.pause()
          } catch {
            /* ignore */
          }
        }
      }, 420)
    }
    this.stopSynthTimer()
    this.fadeTo(0.0001, 0.6)
  }

  toggle(): boolean {
    if (this.playing) this.pause()
    else this.start()
    return this.playing
  }

  /** 离开沉浸屏：彻底停止并释放 */
  stop() {
    this.pause()
    if (this.audio) {
      try {
        this.audio.pause()
      } catch {
        /* ignore */
      }
      this.audio.src = ''
      this.audio = null
    }
    this.usingFile = false
    this.src = 'none'
    const padOsc = this.padOsc
    const padLfo = this.padLfo
    this.padOsc = []
    this.padGain = []
    this.padLfo = null
    window.setTimeout(() => {
      padOsc.forEach((o) => {
        try {
          o.stop()
        } catch {
          /* already */
        }
      })
      try {
        padLfo?.stop()
      } catch {
        /* ignore */
      }
      try {
        this.master?.disconnect()
      } catch {
        /* ignore */
      }
      this.master = null
      this.padFilter = null
    }, 700)
  }

  /** 实时改速度（拍海 / 速度滑杆 → 不同频率） */
  setBpm(n: number) {
    this.bpm = Math.max(36, Math.min(200, Math.round(n)))
    if (this.usingFile && this.audio) this.audio.playbackRate = this.fileRate()
  }

  /** 实时换走向（微调四档） */
  setTone(chipIndex: number) {
    const fn = TONES[chipIndex]
    if (!fn) return
    this.preset = fn(this.feed)
    this.bpm = this.preset.bpm
    if (this.usingFile && this.audio) this.audio.playbackRate = this.fileRate()
    else this.applyBrightness()
  }

  get state() {
    return {
      playing: this.playing,
      ctxState: this.ctx?.state ?? 'none',
      bpm: this.bpm,
      notes: this.notes,
      preset: this.preset.name,
      src: this.src,
      usingFile: this.usingFile,
    }
  }

  // ============ 预设音轨 ============
  private startFile(index: number) {
    this.stopSynthTimer()
    if (!this.audio) {
      this.audio = new Audio()
      this.audio.loop = true
      this.audio.preload = 'auto'
      this.audio.addEventListener('error', () => this.fallbackToSynth())
    }
    if (!this.audio.src.endsWith(`mood${index}.mp3`)) {
      this.audio.src = `./music/mood${index}.mp3`
    }
    this.audio.playbackRate = this.fileRate()
    this.audio.volume = 0
    const pr = this.audio.play()
    if (pr && typeof pr.then === 'function') {
      pr.then(() => {
        this.usingFile = true
        this.src = 'file'
        this.fadeAudio(0.9, 1.0)
      }).catch(() => this.fallbackToSynth())
    } else {
      this.usingFile = true
      this.src = 'file'
      this.audio.volume = 0.9
    }
  }

  private fileRate() {
    return Math.max(0.75, Math.min(1.3, this.bpm / (this.preset.bpm || this.bpm)))
  }

  private fadeAudio(to: number, secs: number) {
    const a = this.audio
    if (!a) return
    const from = a.volume
    const t0 = performance.now()
    const tick = () => {
      if (!this.audio) return
      const k = Math.min(1, (performance.now() - t0) / (secs * 1000))
      this.audio.volume = Math.max(0, Math.min(1, from + (to - from) * k))
      if (k < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  // ============ 合成回退 ============
  private fallbackToSynth() {
    this.usingFile = false
    this.src = 'synth'
    this.ensureCtx()
    const c = this.ctx!
    if (c.state === 'suspended') void c.resume()
    if (!this.master) this.buildGraph()
    this.fadeTo(0.5, 1.4)
    if (!this.timer) {
      this.nextStepTime = c.currentTime + 0.06
      this.step = 0
      this.barIndex = 0
      this.timer = window.setInterval(() => this.schedule(), 25)
    }
  }

  private stopSynthTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private ensureCtx() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
    }
  }

  private fadeTo(v: number, dur: number) {
    if (!this.master || !this.ctx) return
    const t = this.ctx.currentTime
    const g = this.master.gain
    g.cancelScheduledValues(t)
    g.setValueAtTime(Math.max(0.0001, g.value), t)
    g.exponentialRampToValueAtTime(Math.max(0.0001, v), t + dur)
  }

  private buildGraph() {
    const c = this.ctx!
    const master = c.createGain()
    master.gain.value = 0.0001
    const comp = c.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 3
    master.connect(comp).connect(c.destination)
    this.master = master

    const reverb = c.createConvolver()
    reverb.buffer = this.makeIR(2.4, 2.6)
    const wet = c.createGain()
    wet.gain.value = this.preset.reverb
    reverb.connect(wet).connect(master)
    this.reverb = reverb
    this.wet = wet

    const padFilter = c.createBiquadFilter()
    padFilter.type = 'lowpass'
    padFilter.frequency.value = 400 + this.preset.brightness * 1400
    padFilter.Q.value = 0.6
    padFilter.connect(master)
    padFilter.connect(reverb)
    this.padFilter = padFilter

    const lfo = c.createOscillator()
    const lfoGain = c.createGain()
    lfo.frequency.value = 0.07
    lfoGain.gain.value = 220
    lfo.connect(lfoGain).connect(padFilter.frequency)
    lfo.start()
    this.padLfo = lfo

    const tri = this.chordMidis(this.degree)
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator()
      o.type = 'triangle'
      o.frequency.value = mtof(tri[i] - 12)
      o.detune.value = (i - 1) * 4
      const g = c.createGain()
      g.gain.value = 0.05
      o.connect(g).connect(padFilter)
      o.start()
      this.padOsc.push(o)
      this.padGain.push(g)
    }
  }

  private applyBrightness() {
    if (this.padFilter && this.ctx) {
      this.padFilter.frequency.setTargetAtTime(400 + this.preset.brightness * 1400, this.ctx.currentTime, 0.3)
    }
    if (this.wet && this.ctx) {
      this.wet.gain.setTargetAtTime(this.preset.reverb, this.ctx.currentTime, 0.3)
    }
  }

  private makeIR(seconds: number, decay: number): AudioBuffer {
    const c = this.ctx!
    const rate = c.sampleRate
    const len = Math.floor(rate * seconds)
    const buf = c.createBuffer(2, len, rate)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
    return buf
  }

  private degMidi(d: number, octShift = 0): number {
    const s = this.preset.scale
    const oct = Math.floor(d / s.length)
    const idx = ((d % s.length) + s.length) % s.length
    return this.preset.rootMidi + s[idx] + 12 * (oct + octShift)
  }

  private chordMidis(degree: number): number[] {
    return [this.degMidi(degree), this.degMidi(degree + 2), this.degMidi(degree + 4)]
  }

  private schedule() {
    const c = this.ctx
    if (!c) return
    const lookahead = 0.12
    while (this.nextStepTime < c.currentTime + lookahead) {
      this.tick(this.step, this.nextStepTime)
      const sec16 = 60 / this.bpm / 4
      this.nextStepTime += sec16
      this.step = (this.step + 1) % 16
      if (this.step === 0) this.barIndex++
    }
  }

  private tick(step: number, time: number) {
    const p = this.preset
    if (step === 0) {
      this.degree = p.progression[this.barIndex % p.progression.length]
      this.revoicePad(time)
      this.bass(time, this.degMidi(this.degree, -2))
    }
    const arp = this.chordMidis(this.degree).map((m) => m + 12 * p.melodyOct)
    const seq = [arp[0], arp[1], arp[2], arp[0] + 12]
    if (step % 4 === 0) {
      const beatIdx = step >> 2
      const vel = beatIdx % 2 === 0 ? 1 : 0.72
      this.pluck(time, seq[beatIdx], p, vel)
      this.notes++
      if (p.density >= 0.55) {
        this.pluck(time + 60 / this.bpm / 2, arp[(beatIdx + 1) % 3], p, 0.4)
        this.notes++
      }
    }
  }

  private revoicePad(time: number) {
    const tri = this.chordMidis(this.degree)
    this.padOsc.forEach((o, i) => o.frequency.setTargetAtTime(mtof(tri[i] - 12), time, 0.28))
  }

  private pluck(time: number, midi: number, p: MoodPreset, vel = 1) {
    const c = this.ctx!
    const f = mtof(midi)
    const out = c.createGain()
    out.gain.value = 0.0001
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900 + p.brightness * 3200
    lp.connect(out)
    out.connect(this.master!)
    out.connect(this.reverb!)
    const partials: Array<[number, OscillatorType, number]> = [
      [1, 'triangle', 0.5],
      [2, 'sine', 0.16],
      [3, 'sine', 0.06],
    ]
    const oscs: OscillatorNode[] = []
    for (const [mult, type, amp] of partials) {
      const o = c.createOscillator()
      o.type = type
      o.frequency.value = f * mult
      const g = c.createGain()
      g.gain.value = amp
      o.connect(g).connect(lp)
      o.start(time)
      oscs.push(o)
    }
    const dur = p.attack > 0.04 ? 1.8 : 1.3
    const peak = 0.15 * vel
    out.gain.setValueAtTime(0.0001, time)
    out.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + Math.max(0.008, p.attack))
    out.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    oscs.forEach((o) => o.stop(time + dur + 0.05))
  }

  private bass(time: number, midi: number) {
    const c = this.ctx!
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.value = mtof(midi)
    const g = c.createGain()
    g.gain.value = 0.0001
    o.connect(g).connect(this.master!)
    const dur = (60 / this.bpm) * 3.6
    g.gain.setValueAtTime(0.0001, time)
    g.gain.exponentialRampToValueAtTime(0.16, time + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    o.start(time)
    o.stop(time + dur + 0.05)
  }
}
