/**
 * Tap the Sea 音频 —— 每次拍打海面播一颗"水滴音"，并统计拍打节奏(BPM)。
 *
 * 这是"把此刻的节奏交给音乐"的核心：用户拍打的快慢 = 当下心情的律动，
 * 之后(后续步骤)用这个 BPM 直接驱动生成音乐的节奏。
 *
 * 懒初始化：首次拍打是用户手势，此时才创建/恢复 AudioContext（规避自动播放限制）。
 */
export class SeaAudio {
  private ctx: AudioContext | null = null
  private taps: number[] = [] // 最近若干次拍打的时间戳(performance.now)

  private ensure() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  /** 拍一下：播水滴音 + 记节奏 */
  tap() {
    const c = this.ensure()
    const t = c.currentTime

    // 水滴音：正弦快速下滑 + 短促包络
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(540 + Math.random() * 140, t)
    osc.frequency.exponentialRampToValueAtTime(170, t + 0.18)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.28, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.36)
    osc.connect(gain).connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.4)

    const now = performance.now()
    this.taps.push(now)
    this.taps = this.taps.filter((x) => now - x < 4000) // 只看近 4 秒
  }

  /** 由近几次拍打估算 BPM；不足两次返回 null */
  bpm(): number | null {
    if (this.taps.length < 2) return null
    let sum = 0
    for (let i = 1; i < this.taps.length; i++) sum += this.taps[i] - this.taps[i - 1]
    const avg = sum / (this.taps.length - 1)
    return Math.max(30, Math.min(200, Math.round(60000 / avg)))
  }

  reset() {
    this.taps = []
  }
}

/** 安卓震动（iOS 网页不支持，静默忽略）——拍打海面的"震动感" */
export function buzz(ms = 16) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* no-op */
  }
}
