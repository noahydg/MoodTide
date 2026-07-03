/**
 * 情绪档位配置 —— 情绪→配色/合成参数/读心文案 的映射表。
 *
 * 混合情绪模型（团队定稿）：
 *   - 内部用连续的「情绪坐标」MoodVector { valence 愉悦, arousal 唤醒 }，由 MoodSense 推断。
 *   - 对外把坐标 snap 到下面几个“高置信度情绪档”，用于选曲/配色（准比全，演示稳）。
 * 每档带 anchor（它在坐标系里的锚点），nearestMood() 据此就近匹配。
 */

export interface MoodVector {
  valence: number // 愉悦度 -1(负) .. +1(正)
  arousal: number // 唤醒度 -1(平静) .. +1(激动)
}

export type Mood =
  | 'dawn_clear' //  清晨清醒
  | 'day_focus' //   白日专注
  | 'dusk_ease' //   黄昏松弛
  | 'night_calm' //  深夜安静
  | 'rain_melancholy' // 雨天微忧
  | 'tender' //      温柔思念

export interface MoodSpec {
  mood: Mood
  label: string // 人类可读
  anchor: MoodVector // 在情绪坐标系里的锚点（用于 snap）
  colorA: string // 情境主色（叠加到实拍背景）
  colorB: string // 情境辅色
  sea: string // 声波主色
  bg: 1 | 2 | 3 // 实拍背景：1晨曦暖 / 2雨夜冷 / 3日落金
  /** 合成器参数：调式根音(Hz)、音阶、节奏感(0慢~1快)、明暗(0暗~1亮) */
  rootHz: number
  scale: number[] // 半音相对根音的音程
  tempo: number
  brightness: number
  /** 读心文案池：进入卡片时随机取一句（替用户说出心情） */
  minds: string[]
}

/** 实拍背景 URL（相对路径，适配抖音沙箱 base:'./'）
 *  1 = 晨曦海面(暖蓝金，声波纹) / 2 = 雨夜海岸(冷青灰，雨丝声波) / 3 = 日落金海(暖金，声波纹) */
export const BG_URL: Record<1 | 2 | 3, string> = {
  1: './bg/bg1.jpg',
  2: './bg/bg2.jpg',
  3: './bg/bg3.jpg',
}

export const MOODS: Record<Mood, MoodSpec> = {
  dawn_clear: {
    mood: 'dawn_clear',
    label: '清晨·清醒',
    anchor: { valence: 0.5, arousal: 0.3 },
    colorA: '#1d3a4d',
    colorB: '#2e6f8e',
    sea: '#7fd6e8',
    bg: 1, // 晨曦海面（清醒明亮）
    rootHz: 261.63, // C4
    scale: [0, 2, 4, 7, 9], // 大调五声，明亮
    tempo: 0.45,
    brightness: 0.85,
    minds: ['像睡饱后拉开窗帘的那一下', '今天还没开始，一切都还来得及', '空气是凉的，脑子是清的'],
  },
  day_focus: {
    mood: 'day_focus',
    label: '白日·专注',
    anchor: { valence: 0.05, arousal: 0.35 },
    colorA: '#202840',
    colorB: '#34406b',
    sea: '#8fa6ff',
    bg: 1, // 晨曦海面（白日开阔）
    rootHz: 220.0, // A3
    scale: [0, 3, 5, 7, 10], // 小调五声，沉稳
    tempo: 0.55,
    brightness: 0.6,
    minds: ['把世界调成静音，只剩手里这件事', '心跳和秒针，慢慢对齐了', '别急，一格一格往前'],
  },
  dusk_ease: {
    mood: 'dusk_ease',
    label: '黄昏·松弛',
    anchor: { valence: 0.4, arousal: -0.4 },
    colorA: '#3a2740',
    colorB: '#7a4a5e',
    sea: '#ffb27a',
    bg: 3, // 日落金海（黄昏松弛）
    rootHz: 196.0, // G3
    scale: [0, 2, 4, 7, 9],
    tempo: 0.38,
    brightness: 0.55,
    minds: ['像加完班松了口气的那种安静', '天色慢慢沉下来，肩膀也松了', '这一刻不属于任何人，只属于你'],
  },
  night_calm: {
    mood: 'night_calm',
    label: '深夜·安静',
    anchor: { valence: -0.1, arousal: -0.7 },
    colorA: '#10131f',
    colorB: '#222a45',
    sea: '#6a78c9',
    bg: 2, // 雨夜海岸（深夜安静）
    rootHz: 174.61, // F3
    scale: [0, 2, 3, 7, 8], // 含小二度，幽深
    tempo: 0.3,
    brightness: 0.32,
    minds: ['整座城市睡了，只有你还醒着', '夜把声音都收走了，留下你和呼吸', '这么晚了，听一段只给你的潮'],
  },
  rain_melancholy: {
    mood: 'rain_melancholy',
    label: '雨天·微忧',
    anchor: { valence: -0.5, arousal: -0.3 },
    colorA: '#1a2230',
    colorB: '#2f3d52',
    sea: '#9fb3c8',
    bg: 2, // 雨夜海岸（雨天微忧）
    rootHz: 207.65, // G#3
    scale: [0, 3, 5, 6, 10], // 含蓝调音，潮湿
    tempo: 0.34,
    brightness: 0.4,
    minds: ['窗外在下雨，心里也有点', '有些情绪不用名字，听着就懂', '雨声把世界调慢了'],
  },
  tender: {
    mood: 'tender',
    label: '此刻·温柔',
    anchor: { valence: 0.3, arousal: -0.2 },
    colorA: '#2a2350',
    colorB: '#5a3f8a',
    sea: '#c9a9ff',
    bg: 3, // 日落金海（温柔思念）
    rootHz: 246.94, // B3
    scale: [0, 2, 4, 5, 9],
    tempo: 0.4,
    brightness: 0.7,
    minds: ['忽然想起一个很久没联系的人', '心里软了一下，说不清为什么', '有些温柔，是这一刻才有的'],
  },
}

/** 把情境配色注入到某个卡片元素的 CSS 变量上 */
export function applyPalette(el: HTMLElement, spec: MoodSpec) {
  el.style.setProperty('--mood-a', spec.colorA)
  el.style.setProperty('--mood-b', spec.colorB)
  el.style.setProperty('--mood-sea', spec.sea)
}

/** 把连续坐标就近 snap 到一个情绪档（欧氏距离最近的 anchor） */
export function nearestMood(v: MoodVector): Mood {
  let best: Mood = 'night_calm'
  let bestD = Infinity
  ;(Object.keys(MOODS) as Mood[]).forEach((m) => {
    const a = MOODS[m].anchor
    const d = (a.valence - v.valence) ** 2 + (a.arousal - v.arousal) ** 2
    if (d < bestD) {
      bestD = d
      best = m
    }
  })
  return best
}

/** 坐标 → 人类可读的心境标签（9 宫格） */
export function moodLabel(v: MoodVector): string {
  const hi = v.arousal > 0.25
  const lo = v.arousal < -0.25
  const pos = v.valence > 0.25
  const neg = v.valence < -0.25
  if (hi) return pos ? '振奋愉悦' : neg ? '焦灼紧绷' : '专注清醒'
  if (lo) return pos ? '松弛温柔' : neg ? '低落偏平静' : '安静沉淀'
  return pos ? '平和愉悦' : neg ? '淡淡失落' : '平静中性'
}
