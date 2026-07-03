/**
 * 心潮路径数据 —— 每天一个 1~100 的「心情分」，由用户自评 + 大模型解析当天文字综合得出。
 * 因此这条折线不是一路上升，而是有真实的起伏（第3、6、9天的回落）——疗愈本就有涨有落。
 *
 * 本文件提供：当日记录(buildTideDays)、分数配色(scoreColor)、
 * 大模型文字解析的本地模拟(analyzeText) —— 接真模型时只换 analyzeText 内部即可。
 */
export interface TideDay {
  day: number
  score: number // 0..100 综合心情分
  mood: string
  note: string
  song: string
  ai?: string // 大模型读出的一句话（可选）
}

import { cycleDays } from '../store/recovery'

/** 当前疗愈周期（天）——跟随设置 */
export const CYCLE = (): number => cycleDays()

// 一条真实起伏的疗愈曲线模板（整体向上，但有回落）；按周期长度重采样
const SCORE_TPL = [12, 19, 10, 24, 31, 17, 30, 44, 39, 56, 64, 73, 84, 96]
function scoreFor(day: number, cycle: number): number {
  // 把第 day 天映射到模板的归一化位置，线性插值（让任意周期都有完整起伏弧）
  const pos = ((day - 1) / Math.max(1, cycle - 1)) * (SCORE_TPL.length - 1)
  const i = Math.floor(pos)
  const f = pos - i
  const a = SCORE_TPL[i] ?? 50
  const b = SCORE_TPL[Math.min(SCORE_TPL.length - 1, i + 1)] ?? a
  return Math.round(a + (b - a) * f)
}

interface Story {
  mood: string
  note: string
  song: string
  ai?: string
}
const STORY: Record<number, Story> = {
  1: { mood: '崩溃 · 失眠', note: '他真的走了。', song: '凌晨突然醒来', ai: '字里全是不敢相信，先陪你坐一会儿。' },
  3: { mood: '难过 · 失眠', note: '凌晨三点还醒着，听着听着就睡了。', song: '凌晨三点的潮', ai: '夜里最难熬，你撑住了。' },
  6: { mood: '反复 · 克制', note: '删了又写的草稿，终究没发出去。', song: '删了又写的草稿', ai: '想念又涌上来了，但你忍住了，这很了不起。' },
  8: { mood: '平静 · 微亮', note: '', song: '一个人也能走', ai: '语气松了一点，开始有光。' },
  10: { mood: '安静 · 想念', note: '还是会想起，但没那么疼了。', song: '雨停在窗外', ai: '疼在变淡，你在往前。' },
  12: { mood: '好多了', note: '今天竟然笑了一下。', song: '有点光的下午', ai: '久违的轻松，记住这一刻。' },
}

function fillerMood(s: number): string {
  if (s < 22) return '低落'
  if (s < 38) return '钝痛 · 缓'
  if (s < 55) return '平静'
  if (s < 70) return '微亮'
  return '渐暖'
}

/** 取到「今天」为止的每日记录（today 之外的天用模板分 + 自动心境） */
export function buildTideDays(today: number, cycle = CYCLE()): TideDay[] {
  const n = Math.min(cycle, Math.max(1, today))
  // 故事锚点只在默认 14 天周期套用；其他周期纯用曲线（保持 demo 简洁）
  const useStory = cycle === 14
  const out: TideDay[] = []
  for (let d = 1; d <= n; d++) {
    const score = scoreFor(d, cycle)
    const s = useStory ? STORY[d] : undefined
    out.push({
      day: d,
      score,
      mood: s?.mood ?? fillerMood(score),
      note: s?.note ?? '',
      song: s?.song ?? '那天的潮',
      ai: s?.ai,
    })
  }
  return out
}

type RGB = [number, number, number]
const STOPS: { at: number; c: RGB }[] = [
  { at: 0, c: [91, 121, 184] }, // 深钴蓝（落潮）
  { at: 35, c: [125, 143, 201] },
  { at: 55, c: [154, 134, 198] }, // 长春花紫
  { at: 75, c: [226, 179, 95] },
  { at: 100, c: [230, 194, 119] }, // 暖金（满潮）
]
/** 分数→配色：冷蓝(低) → 紫 → 暖金(高) */
export function scoreColor(score: number): string {
  const s = Math.max(0, Math.min(100, score))
  let a = STOPS[0]
  let b = STOPS[STOPS.length - 1]
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (s >= STOPS[i].at && s <= STOPS[i + 1].at) {
      a = STOPS[i]
      b = STOPS[i + 1]
      break
    }
  }
  const t = b.at === a.at ? 0 : (s - a.at) / (b.at - a.at)
  const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * t)
  const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * t)
  const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

// —— 大模型文字解析（本地模拟）——
const DOWN = ['难过', '想念', '想他', '想她', '哭', '失眠', '睡不着', '痛', '疼', '删', '发不出', '崩溃', '放不下', '回不去', '一个人', '后悔', '空', '冷', '累', '撑不住', '没意思']
const UP = ['好多了', '睡着', '走出', '笑', '轻松', '释然', '开心', '平静', '没那么', '慢慢', '好起来', '加油', '可以', '新', '明天', '阳光', '出门', '吃了', '约', '朋友', '暖', '光']

export interface AiParse {
  score: number // 0..100，模型对文字的情绪评分
  label: string // 一句话解读
}
/** 解析自由文字，返回情绪评分 + 一句话（接真模型时替换此函数体即可） */
export function analyzeText(text: string): AiParse {
  const t = (text || '').trim()
  if (!t) return { score: 50, label: '没写字也没关系，按你自己的感觉来。' }
  let up = 0
  let down = 0
  for (const w of UP) if (t.includes(w)) up++
  for (const w of DOWN) if (t.includes(w)) down++
  let score = 50 + up * 9 - down * 9
  score = Math.max(6, Math.min(94, score))
  let label: string
  if (score >= 66) label = '字里有光了，今天偏暖。'
  else if (score >= 46) label = '语气平稳，在慢慢变好。'
  else if (score >= 30) label = '还有点低，但你稳住了。'
  else label = '今天挺难的——这些话，被听见了。'
  return { score, label }
}

/** 自评分 + 文字解析 → 综合分（各占一半） */
export function blendScore(selfScore: number, ai: AiParse, hasText: boolean): number {
  if (!hasText) return Math.round(selfScore)
  return Math.round(selfScore * 0.5 + ai.score * 0.5)
}
