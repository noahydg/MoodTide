/**
 * 水面引擎（Canvas）—— 第二卡「把它拍进海里」的艺术化水面。
 *
 * 叠在实拍海景之上，只画「光」：
 *   · 常驻：多层发光波纹缓慢流动（微光呼吸）+ 中轴月光倒影随波荡漾
 *   · 点击：点哪起哪 —— 多层同心涟漪扩散+淡出，并在落点掀起一次水面扰动
 *   · 溅射：拍打溅起暖金月光粒子，抛物线落回水里（呼应海报月光）
 *
 * 性能：单一 RAF（外部 start/stop 控制，离开卡片即停）；涟漪/粒子数量受限；
 * 只用渐变填充与描边模拟辉光，不每帧动 box-shadow/filter。
 */

interface Ripple {
  x: number
  y: number
  r: number
  life: number // 1 → 0
}
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  gold: boolean
}

export class WaterSurface {
  private cv: HTMLCanvasElement
  private g: CanvasRenderingContext2D
  private dpr = Math.min(window.devicePixelRatio || 1, 2)
  private raf = 0
  private t = 0
  private W = 0
  private H = 0
  private ripples: Ripple[] = []
  private particles: Particle[] = []
  private sea = '#bfe0ef'
  private gold = '#ffd6a0'

  constructor(canvas: HTMLCanvasElement) {
    this.cv = canvas
    this.g = canvas.getContext('2d')!
    this.resize()
    window.addEventListener('resize', this.resize)
  }

  refreshTheme() {
    const c = getComputedStyle(this.cv).getPropertyValue('--mood-sea').trim()
    if (c) this.sea = c
  }

  private resize = () => {
    this.W = this.cv.clientWidth || 1
    this.H = this.cv.clientHeight || 1
    this.cv.width = this.W * this.dpr
    this.cv.height = this.H * this.dpr
    this.g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  /** 在 (x,y) 拍一下：涟漪 + 粒子溅射 + 局部扰动 */
  tap(x: number, y: number, strength = 1) {
    this.ripples.push({ x, y, r: 6, life: 1 })
    // 第二圈延迟扩散，做出多层折射
    this.ripples.push({ x, y, r: 0, life: 1.15 })
    const n = Math.round(7 + strength * 7)
    for (let i = 0; i < n; i++) {
      const a = Math.PI + Math.random() * Math.PI // 向上半圆溅
      const sp = 1.4 + Math.random() * 2.6 * strength
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.2,
        life: 1,
        gold: Math.random() < 0.5,
      })
    }
    if (this.particles.length > 90) this.particles.splice(0, this.particles.length - 90)
  }

  start() {
    if (this.raf) return
    this.refreshTheme()
    const loop = () => {
      this.frame()
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private frame() {
    if (this.cv.width <= this.dpr) this.resize()
    const g = this.g
    const W = this.W
    const H = this.H
    g.clearRect(0, 0, W, H)
    this.t += 0.02

    this.drawMoonColumn(g, W, H)
    this.drawWaves(g, W, H)
    this.drawRipples(g)
    this.drawParticles(g)
  }

  /** 中轴月光倒影：竖向光带，随波左右轻摆 */
  private drawMoonColumn(g: CanvasRenderingContext2D, W: number, H: number) {
    const cx = W * 0.5
    for (let y = H * 0.28; y < H; y += 5) {
      const tt = (y - H * 0.28) / (H * 0.72)
      const wob = Math.sin(y * 0.05 + this.t * 1.6) * (4 + tt * 10)
      const w = (8 + tt * 40)
      const alpha = (1 - tt) * 0.1
      g.fillStyle = rgba(this.gold, alpha)
      g.fillRect(cx + wob - w / 2, y, w, 3)
    }
  }

  /** 多层发光波纹缓慢流动 */
  private drawWaves(g: CanvasRenderingContext2D, W: number, H: number) {
    const layers = [
      { base: 0.52, amp: 7, sp: 0.6, k: 0.018, a: 0.16 },
      { base: 0.66, amp: 11, sp: -0.85, k: 0.024, a: 0.24 },
      { base: 0.8, amp: 15, sp: 1.05, k: 0.03, a: 0.32 },
    ]
    for (const L of layers) {
      g.beginPath()
      const baseY = H * L.base
      for (let x = 0; x <= W; x += 6) {
        const y =
          baseY +
          Math.sin(x * L.k + this.t * L.sp) * L.amp +
          Math.sin(x * L.k * 2.3 - this.t * L.sp * 0.7) * L.amp * 0.4
        if (x === 0) g.moveTo(x, y)
        else g.lineTo(x, y)
      }
      const grad = g.createLinearGradient(0, baseY - 20, 0, baseY + 20)
      grad.addColorStop(0, rgba(lighten(this.sea, 0.5), L.a))
      grad.addColorStop(1, rgba(this.sea, 0))
      g.strokeStyle = grad
      g.lineWidth = 1.6
      g.stroke()
    }
  }

  private drawRipples(g: CanvasRenderingContext2D) {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i]
      r.r += 2.4
      r.life -= 0.018
      if (r.life <= 0) {
        this.ripples.splice(i, 1)
        continue
      }
      // 双环：外亮内淡，模拟水面折射
      g.beginPath()
      g.ellipse(r.x, r.y, r.r, r.r * 0.42, 0, 0, Math.PI * 2)
      g.strokeStyle = rgba(lighten(this.sea, 0.6), Math.max(0, r.life) * 0.55)
      g.lineWidth = 2
      g.stroke()
      g.beginPath()
      g.ellipse(r.x, r.y, r.r * 0.62, r.r * 0.26, 0, 0, Math.PI * 2)
      g.strokeStyle = rgba('#ffffff', Math.max(0, r.life) * 0.28)
      g.lineWidth = 1
      g.stroke()
    }
  }

  private drawParticles(g: CanvasRenderingContext2D) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.12 // 重力
      p.life -= 0.022
      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }
      const col = p.gold ? this.gold : lighten(this.sea, 0.5)
      g.beginPath()
      g.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
      g.fillStyle = rgba(col, Math.max(0, p.life))
      g.fill()
    }
  }

  destroy() {
    this.stop()
    window.removeEventListener('resize', this.resize)
  }
}

function parse(hex: string) {
  if (hex.startsWith('rgb')) {
    const m = hex.match(/\d+/g) || ['191', '224', '239']
    return { r: +m[0], g: +m[1], b: +m[2] }
  }
  const s = hex.replace('#', '')
  const n = s.length === 3 ? s.split('').map((x) => x + x).join('') : s
  return { r: parseInt(n.slice(0, 2), 16) || 0, g: parseInt(n.slice(2, 4), 16) || 0, b: parseInt(n.slice(4, 6), 16) || 0 }
}
function rgba(hex: string, a: number) {
  const { r, g, b } = parse(hex)
  return `rgba(${r},${g},${b},${a})`
}
function lighten(hex: string, amt: number) {
  const { r, g, b } = parse(hex)
  return `rgb(${Math.round(r + (255 - r) * amt)},${Math.round(g + (255 - g) * amt)},${Math.round(b + (255 - b) * amt)})`
}
