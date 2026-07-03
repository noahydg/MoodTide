/**
 * 疗愈环境音播放器 —— 卡1 的「此刻的潮」点播放就出声。
 *
 * 自包含的极简 Web Audio 氛围 pad：根音 + 五度 + 高八度，正弦波，慢速 LFO 起伏，
 * 缓缓淡入淡出 —— 营造"被潮水温柔托着"的安定感（不是旋律，是底色）。
 * 懒初始化：首次 play() 在用户手势里创建/恢复 AudioContext（规避自动播放限制）。
 */
export class HealPlayer {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private voices: { osc: OscillatorNode; lfo: OscillatorNode }[] = []
  private breath: number | null = null
  playing = false

  /** 切换播放，返回切换后的状态 */
  toggle(): boolean {
    if (this.playing) this.stop()
    else this.play()
    return this.playing
  }

  play() {
    if (this.playing) return
    const Ctor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!this.ctx) this.ctx = new Ctor()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    const c = this.ctx

    const master = c.createGain()
    master.gain.value = 0.0001
    master.connect(c.destination)
    this.master = master

    // F3 根音的温柔小三和声：稳、暖、不悲不喜
    const freqs = [174.61, 261.63, 349.23]
    freqs.forEach((f, i) => {
      const osc = c.createOscillator()
      const g = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      g.gain.value = i === 0 ? 0.5 : 0.28
      // 慢速颤音，避免电子味
      const lfo = c.createOscillator()
      const lfoGain = c.createGain()
      lfo.frequency.value = 0.06 + i * 0.03
      lfoGain.gain.value = f * 0.003
      lfo.connect(lfoGain).connect(osc.frequency)
      osc.connect(g).connect(master)
      osc.start()
      lfo.start()
      this.voices.push({ osc, lfo })
    })

    // 淡入
    const t = c.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setValueAtTime(0.0001, t)
    master.gain.exponentialRampToValueAtTime(0.5, t + 1.6)

    // 呼吸起伏（潮起潮落）
    const period = 6
    const loop = () => {
      const n = c.currentTime
      master.gain.cancelScheduledValues(n)
      master.gain.setValueAtTime(master.gain.value || 0.4, n)
      master.gain.linearRampToValueAtTime(0.55, n + period / 2)
      master.gain.linearRampToValueAtTime(0.34, n + period)
    }
    loop()
    this.breath = window.setInterval(loop, period * 1000)
    this.playing = true
  }

  stop() {
    if (!this.playing) return
    this.playing = false
    if (this.breath) {
      clearInterval(this.breath)
      this.breath = null
    }
    const c = this.ctx!
    const m = this.master!
    const t = c.currentTime
    m.gain.cancelScheduledValues(t)
    m.gain.setValueAtTime(m.gain.value || 0.4, t)
    m.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
    const voices = this.voices
    this.voices = []
    window.setTimeout(() => {
      voices.forEach((v) => {
        try {
          v.osc.stop()
          v.lfo.stop()
        } catch {
          /* already stopped */
        }
      })
      try {
        m.disconnect()
      } catch {
        /* ignore */
      }
    }, 900)
  }
}
