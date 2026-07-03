/**
 * 暮色海面 canvas —— 月亮已移除，涟漪是主角（「乐是潮」）。
 *
 * 画面：地平线下浮起海水（由浅入深）、地平线一道暖光、表面极淡的粼光，
 * 点击处荡开柔和发光的椭圆涟漪（贴在水面透视上，缓出 easeOut + 多层描边做辉光）。
 * 播放时，海面中心会periodic地自己荡开一圈很淡的「歌声波」——把这首歌送向海。
 * 进入沉浸屏才 start()，离开即 stop()；暂停即 setPlaying(false) 停止自动波（性能技能）。
 */
type RGB = [number, number, number]

interface Ripple {
  x: number
  y: number
  birth: number
  strength: number
  auto: boolean
}
interface Speck {
  xf: number
  yf: number
  r: number
  ph: number
  sp: number
}

function rgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}
function css(c: RGB, a: number): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`
}
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)

export class WaterScene {
  private canvas: HTMLCanvasElement
  private container: HTMLElement
  private ctx: CanvasRenderingContext2D | null = null
  private raf = 0
  private t0 = performance.now()
  private running = false
  private W = 0
  private H = 0
  private dpr = 1
  private horizon = 0
  private wave: RGB = [63, 99, 168]
  private accent: RGB = [125, 159, 208]
  private speed = 1
  private spread = 1
  private specks: Speck[] = []
  private ripples: Ripple[] = []
  private sprite: HTMLCanvasElement | null = null
  private playing = true
  private lastPulse = 0

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas
    this.container = container
    this.frame = this.frame.bind(this)
  }

  /** 预渲染一颗柔光点精灵，复用 drawImage 画出软边粼光（避免硬方块、且便宜） */
  private buildSprite() {
    const s = document.createElement('canvas')
    s.width = 64
    s.height = 64
    const c = s.getContext('2d')!
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,252,240,1)')
    g.addColorStop(0.45, 'rgba(255,250,235,0.45)')
    g.addColorStop(1, 'rgba(255,250,235,0)')
    c.fillStyle = g
    c.beginPath()
    c.arc(32, 32, 32, 0, 6.2832)
    c.fill()
    this.sprite = s
  }

  private seed() {
    // 越靠地平线越密、越细（透视）；缓慢闪烁
    this.specks = Array.from({ length: 80 }, () => ({
      xf: Math.random(),
      yf: Math.pow(Math.random(), 1.5),
      r: 1 + Math.random() * 2.4,
      ph: Math.random() * 6.283,
      sp: 0.4 + Math.random() * 1.3,
    }))
  }

  private size() {
    const W = this.container.clientWidth
    const H = this.container.clientHeight
    if (!W || !H) return
    this.W = W
    this.H = H
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.canvas.width = W * this.dpr
    this.canvas.height = H * this.dpr
    this.canvas.style.width = W + 'px'
    this.canvas.style.height = H + 'px'
    this.ctx = this.canvas.getContext('2d')
    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.horizon = H * 0.4
  }

  private frame(now: number) {
    if (!this.ctx || !this.W) {
      this.size()
      if (!this.ctx || !this.W) {
        if (this.running) this.raf = requestAnimationFrame(this.frame)
        return
      }
    }
    const ctx = this.ctx!
    const t = (now - this.t0) / 1000
    const { W, H, horizon } = this
    const deep = mix(this.wave, [22, 40, 76], 0.45)
    const shallow = mix(this.wave, [214, 226, 240], 0.55)
    const glow = mix([247, 233, 184], this.accent, 0.22)
    ctx.clearRect(0, 0, W, H)

    // 海水主体：地平线处由天色浮起，向观者加深
    const g = ctx.createLinearGradient(0, horizon, 0, H)
    g.addColorStop(0, css(shallow, 0))
    g.addColorStop(0.1, css(shallow, 0.5))
    g.addColorStop(0.5, css(this.wave, 0.9))
    g.addColorStop(1, css(deep, 0.98))
    ctx.fillStyle = g
    ctx.fillRect(0, horizon, W, H)

    // 地平线暖光边
    const hg = ctx.createLinearGradient(0, horizon - 12, 0, horizon + 20)
    hg.addColorStop(0, css(glow, 0))
    hg.addColorStop(0.5, css(glow, 0.42))
    hg.addColorStop(1, css(glow, 0))
    ctx.fillStyle = hg
    ctx.fillRect(0, horizon - 12, W, 32)

    ctx.globalCompositeOperation = 'lighter'

    // 极淡的粼光（柔光点精灵，非硬方块）
    if (this.sprite) {
      for (const s of this.specks) {
        const y = horizon + s.yf * (H - horizon)
        const x = s.xf * W + Math.sin(t * 0.25 + s.ph) * 5
        const tw = 0.3 + 0.7 * Math.max(0, Math.sin(t * s.sp + s.ph))
        const a = 0.16 * tw
        if (a <= 0.01) continue
        const size = s.r * (1.6 + s.yf * 2.2)
        ctx.globalAlpha = a
        ctx.drawImage(this.sprite, x - size, y - size, size * 2, size * 2)
      }
      ctx.globalAlpha = 1
    }

    // 播放时：海面中心周期性荡开一圈很淡的「歌声波」
    if (this.playing) {
      const interval = Math.min(6, Math.max(2.4, 3.6 / this.speed))
      if (t - this.lastPulse > interval) {
        this.ripples.push({
          x: W * 0.5,
          y: horizon + (H - horizon) * 0.16,
          birth: t,
          strength: 1,
          auto: true,
        })
        this.lastPulse = t
      }
    }

    // 涟漪：柔和发光椭圆，缓出展开 + 多层描边辉光
    const ring = (x: number, cy: number, rr: number, a: number, lw: number) => {
      if (rr <= 1 || a <= 0.004) return
      const passes: [number, number][] = [
        [lw * 3.4, a * 0.16],
        [lw * 1.9, a * 0.4],
        [lw, a],
      ]
      for (const [w, pa] of passes) {
        ctx.strokeStyle = css(glow, pa)
        ctx.lineWidth = w
        ctx.beginPath()
        ctx.ellipse(x, cy, rr, rr * 0.42, 0, 0, 6.2832)
        ctx.stroke()
      }
    }
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rp = this.ripples[i]
      const age = t - rp.birth
      const life = rp.auto ? 5.5 : 2.4
      if (age > life) {
        this.ripples.splice(i, 1)
        continue
      }
      if (age < 0) continue
      const p = age / life
      const e = easeOut(p)
      const cy = Math.max(horizon + 2, rp.y)
      const maxR = rp.auto ? W * 0.95 : 120 * rp.strength * this.spread
      const baseR = 6 + e * maxR
      const fade = 1 - p
      const ringA = (rp.auto ? 0.16 : 0.5) * fade
      for (let k = 0; k < 3; k++) {
        ring(rp.x, cy, baseR - k * 16, ringA * (1 - k * 0.26), (rp.auto ? 1.1 : 1.7) * (1 - k * 0.2))
      }
      // 手动点击：中心一抹柔光绽放（很快淡出）
      if (!rp.auto && p < 0.35) {
        const bp = p / 0.35
        const radius = 14 + bp * 46
        const ba = (1 - bp) * 0.5
        const rgGrad = ctx.createRadialGradient(rp.x, cy, 0, rp.x, cy, radius)
        rgGrad.addColorStop(0, css(glow, ba))
        rgGrad.addColorStop(1, css(glow, 0))
        ctx.fillStyle = rgGrad
        ctx.beginPath()
        ctx.ellipse(rp.x, cy, radius, radius * 0.5, 0, 0, 6.2832)
        ctx.fill()
      }
    }

    ctx.globalCompositeOperation = 'source-over'
    if (this.running) this.raf = requestAnimationFrame(this.frame)
  }

  start() {
    this.size()
    if (!this.sprite) this.buildSprite()
    if (!this.specks.length) this.seed()
    if (!this.running) {
      this.running = true
      this.t0 = performance.now()
      this.lastPulse = -1 // 进入后很快来第一圈歌声波
      this.raf = requestAnimationFrame(this.frame)
    }
  }
  stop() {
    this.running = false
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }
  pause() {
    this.stop()
  }
  resume() {
    if (!this.running) {
      this.running = true
      this.raf = requestAnimationFrame(this.frame)
    }
  }
  setPlaying(p: boolean) {
    this.playing = p
  }
  setMood(m: { wave: string; accent: string; dur: number; amp: number }) {
    this.wave = rgb(m.wave)
    this.accent = rgb(m.accent)
    this.speed = Math.max(0.5, 7 / m.dur)
    this.spread = Math.max(0.6, m.amp)
  }
  tap(x: number, y: number, strength = 1) {
    this.ripples.push({ x, y, birth: (performance.now() - this.t0) / 1000, strength, auto: false })
  }
}
