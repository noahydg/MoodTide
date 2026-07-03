/**
 * 声波条 —— 嵌在卡片信息面板里的「实时音频波形」。
 *
 * 参照获奖 Demo 里那张“海拔剖面图”的位置，但我们画的是 **由 AnalyserNode 实时驱动
 * 的真实波形**（不是静态图）——既呼应“声音/潮汐”，又是技术含量的直接证据：
 * 切歌/静音时波形立刻变化。颜色取自情绪档 --mood-sea。
 */

export class WaveStrip {
  private canvas: HTMLCanvasElement
  private c2d: CanvasRenderingContext2D
  private analyser: AnalyserNode | null = null
  private buf: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0))
  private raf = 0
  private dpr = Math.min(window.devicePixelRatio || 1, 2)
  private phase = 0
  private color = '#cfe6ff'

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.c2d = canvas.getContext('2d')!
    this.resize()
    window.addEventListener('resize', this.resize)
  }

  attach(analyser: AnalyserNode) {
    this.analyser = analyser
    this.buf = new Uint8Array(new ArrayBuffer(analyser.fftSize))
  }

  refreshTheme() {
    const c = getComputedStyle(this.canvas).getPropertyValue('--mood-sea').trim()
    if (c) this.color = c
  }

  private resize = () => {
    const w = this.canvas.clientWidth || 1
    const h = this.canvas.clientHeight || 1
    this.canvas.width = w * this.dpr
    this.canvas.height = h * this.dpr
    this.c2d.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  start() {
    cancelAnimationFrame(this.raf)
    const draw = () => {
      this.frame()
      this.raf = requestAnimationFrame(draw)
    }
    draw()
  }

  stop() {
    cancelAnimationFrame(this.raf)
  }

  private frame() {
    if (this.canvas.width <= this.dpr) this.resize() // 面板布局后惰性兜底
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    const ctx = this.c2d
    ctx.clearRect(0, 0, w, h)
    this.phase += 0.04

    let data: number[] = []
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.buf)
      data = Array.from(this.buf)
    }

    const mid = h * 0.58
    const N = 96
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w
      let a = 0
      if (data.length) {
        const idx = Math.floor((i / N) * data.length)
        a = (data[idx] - 128) / 128
      }
      const base = Math.sin(i * 0.35 + this.phase) * 0.35 + Math.sin(i * 0.13 - this.phase * 0.7) * 0.25
      const y = mid - (a * h * 0.42 + base * h * 0.14)
      pts.push({ x, y })
    }

    // 柔和填充
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      const xc = (pts[i].x + pts[i - 1].x) / 2
      const yc = (pts[i].y + pts[i - 1].y) / 2
      ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc)
    }
    ctx.lineTo(w, h)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, rgba(this.color, 0.34))
    grad.addColorStop(1, rgba(this.color, 0))
    ctx.fillStyle = grad
    ctx.fill()

    // 波形主线 + 辉光
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      const xc = (pts[i].x + pts[i - 1].x) / 2
      const yc = (pts[i].y + pts[i - 1].y) / 2
      ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc)
    }
    ctx.strokeStyle = rgba(lighten(this.color, 0.35), 0.9)
    ctx.lineWidth = 2
    ctx.shadowColor = this.color
    ctx.shadowBlur = 10
    ctx.stroke()
    ctx.shadowBlur = 0
  }
}

function parse(hex: string) {
  if (hex.startsWith('rgb')) {
    const m = hex.match(/\d+/g) || ['200', '224', '255']
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
