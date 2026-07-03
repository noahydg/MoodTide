/**
 * 心潮路径（可交互）—— 把每日「心情分(1~100)」画成真实起伏的折线。
 * 每个点可悬停/点选：放大 + 浮出小标签（第N天 · 心境 · 分数），点击回调出详情。
 * 折线随分数着色（冷蓝→紫→暖金），并投射到「满潮」目标。
 *
 * 这是纯渲染 + 事件绑定；分数/文案来自 tideData.ts。返回挂载函数。
 */
import { scoreColor, CYCLE, type TideDay } from './tideData'

const W = 320
const H = 150
const PADX = 20
const PADTOP = 16
const PADBOT = 28

let currentCycle = 14 // 渲染时按当前疗愈周期定横轴
const px = (day: number) => PADX + ((day - 1) / Math.max(1, currentCycle - 1)) * (W - PADX * 2)
const py = (score: number) => H - PADBOT - (score / 100) * (H - PADTOP - PADBOT)

function smooth(pts: { x: number; y: number }[]): string {
  if (!pts.length) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export interface TidePathHandle {
  el: SVGSVGElement
  /** 入场动画（GSAP 由调用方驱动；这里返回关键元素） */
  parts: { line: SVGPathElement | null; nodes: SVGGElement[]; now: SVGGElement | null }
}

/**
 * 渲染心潮路径到容器。
 * @param onPick 点击某天 → 详情回调
 */
export function mountTidePath(
  container: HTMLElement,
  days: TideDay[],
  onPick: (d: TideDay) => void,
): TidePathHandle {
  currentCycle = CYCLE()
  const pts = days.map((d) => ({ x: px(d.day), y: py(d.score) }))
  const line = smooth(pts)
  const last = pts[pts.length - 1]
  const goalP = { x: px(currentCycle), y: py(96) }
  const area = `${line} L ${last.x.toFixed(1)} ${(H - PADBOT).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(H - PADBOT).toFixed(1)} Z`
  const proj = `M ${last.x.toFixed(1)} ${last.y.toFixed(1)} L ${goalP.x.toFixed(1)} ${goalP.y.toFixed(1)}`

  const nodeMarks = days
    .map((d, i) => {
      const p = pts[i]
      const isNow = i === days.length - 1
      const c = scoreColor(d.score)
      return `<g class="tp__node${isNow ? ' is-now' : ''}" data-i="${i}" style="--d:${(0.9 + i * 0.09).toFixed(2)}s" tabindex="0" role="button" aria-label="第${d.day}天 ${d.mood} ${d.score}分">
        <circle class="tp__hit" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="15" fill="transparent"/>
        <circle class="tp__halo" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${isNow ? 9 : 6.5}" fill="${c}" opacity="0.22"/>
        <circle class="tp__core" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${isNow ? 4.6 : 3.4}" fill="${c}"/>
        <circle class="tp__shine" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.4" fill="#fffdf4"/>
      </g>`
    })
    .join('')

  container.innerHTML = `
    <svg class="tp__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tpStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#5b79b8"/>
          <stop offset="0.5" stop-color="#9a86c6"/>
          <stop offset="1" stop-color="#e6c277"/>
        </linearGradient>
        <linearGradient id="tpFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9ab6dd" stop-opacity="0.32"/>
          <stop offset="1" stop-color="#9ab6dd" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${area}" fill="url(#tpFill)"/>
      <path d="${proj}" fill="none" stroke="#c9b079" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 5" opacity="0.55"/>
      <path class="tp__line" d="${line}" fill="none" stroke="url(#tpStroke)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
      <circle class="tp__goal" cx="${goalP.x.toFixed(1)}" cy="${goalP.y.toFixed(1)}" r="5.5" fill="none" stroke="#d3a955" stroke-width="1.4" stroke-dasharray="2 3"/>
      ${nodeMarks}
      <text class="tp__lbl" x="${(pts[0].x - 2).toFixed(1)}" y="${(H - 10).toFixed(1)}">落潮</text>
      <text class="tp__lbl tp__lbl--r" x="${(goalP.x + 2).toFixed(1)}" y="${(goalP.y - 9).toFixed(1)}" text-anchor="end">满潮</text>
    </svg>
    <div class="tp__tip" aria-hidden="true">
      <b class="tp__tip-day"></b>
      <span class="tp__tip-mood"></span>
      <span class="tp__tip-score"></span>
    </div>`

  const svg = container.querySelector('.tp__svg') as SVGSVGElement
  const tip = container.querySelector('.tp__tip') as HTMLElement
  const tipDay = container.querySelector('.tp__tip-day') as HTMLElement
  const tipMood = container.querySelector('.tp__tip-mood') as HTMLElement
  const tipScore = container.querySelector('.tp__tip-score') as HTMLElement
  const nodeEls = Array.from(svg.querySelectorAll<SVGGElement>('.tp__node'))

  function showTip(i: number) {
    const d = days[i]
    const p = pts[i]
    tipDay.textContent = `第 ${d.day} 天`
    tipMood.textContent = d.mood
    tipScore.textContent = `${d.score}`
    tipScore.style.color = scoreColor(d.score)
    // SVG 用户坐标 → 容器像素坐标
    const rect = container.getBoundingClientRect()
    const xPx = (p.x / W) * rect.width
    const yPx = (p.y / H) * rect.height
    tip.style.left = `${xPx}px`
    tip.style.top = `${yPx}px`
    tip.classList.add('is-on')
    nodeEls.forEach((n, k) => n.classList.toggle('is-hot', k === i))
  }
  function hideTip() {
    tip.classList.remove('is-on')
    nodeEls.forEach((n) => n.classList.remove('is-hot'))
  }

  nodeEls.forEach((n, i) => {
    n.addEventListener('pointerenter', () => showTip(i))
    n.addEventListener('pointerleave', hideTip)
    n.addEventListener('focus', () => showTip(i))
    n.addEventListener('blur', hideTip)
    n.addEventListener('click', () => {
      showTip(i)
      onPick(days[i])
    })
    n.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
        e.preventDefault()
        onPick(days[i])
      }
    })
  })

  return {
    el: svg,
    parts: {
      line: svg.querySelector('.tp__line'),
      nodes: nodeEls,
      now: svg.querySelector('.tp__node.is-now'),
    },
  }
}

/** 由趋势生成「此刻建议」：看最近走势 + 当前分数，给一句温柔的引导。 */
export function tideAdvice(days: TideDay[]): { title: string; body: string; tone: 'warm' | 'hold' | 'rise' } {
  if (days.length < 2) return { title: '今天，先陪你坐一会儿', body: '不用急着好起来，我在。', tone: 'hold' }
  const cur = days[days.length - 1].score
  const prev = days[days.length - 2].score
  const delta = cur - prev
  if (delta <= -8)
    return {
      title: '今天有点回落，没关系',
      body: '走出来本就有涨有落。这段潮放得更轻，先接住你。',
      tone: 'hold',
    }
  if (cur >= 70)
    return {
      title: '你已经涨起来很多了',
      body: '试着把今天的好，写两句留下来——往后回看会是力气。',
      tone: 'warm',
    }
  if (delta >= 6)
    return {
      title: '比昨天更暖了一点',
      body: '顺着这股劲，今晚来一段明亮些的潮，陪你往前。',
      tone: 'rise',
    }
  return {
    title: '稳住了，这很好',
    body: '平稳也是一种前进。要不要记下此刻的心情分？',
    tone: 'rise',
  }
}
