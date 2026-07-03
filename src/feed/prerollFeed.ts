/**
 * 迷你信息流（pre-roll）—— 我们自己掌控的“前后刷的视频”。
 *
 * 黑客松拿不到抖音真实浏览数据，所以自建一小段内容流：评委进 MoodTide 前先刷
 * 这几张内容卡，每张打好情绪标签。MoodSense 读“你刚停在了哪几张”→ 推断当下心境。
 * 这样“从前后刷的视频推断心境”是真的、现场可验证，还顺带证明了“卡片就在信息流里”。
 */

import type { MoodVector } from '../context/palette'
import type { SignalContribution } from '../sense/types'

export interface PrerollItem {
  id: string
  title: string // 内容卡标题
  cover: string // 占位封面：emoji（演示期）；后续可换真实短视频/图
  bg: [string, string] // 卡背渐变色
  vector: MoodVector // 这条内容代表的情绪
  reason: string // 被它影响后的人话依据，如 '你刚停在了雨夜与独处'
}

/** 演示用内容池（情绪分布有意拉开，方便现场切换不同前置→不同结果） */
export const PREROLL: PrerollItem[] = [
  {
    id: 'rain_store',
    title: '雨夜便利店的暖光',
    cover: '🌧️',
    bg: ['#10131f', '#26344a'],
    vector: { valence: -0.4, arousal: -0.3 },
    reason: '你刚停在了雨夜与独处',
  },
  {
    id: 'cat_nap',
    title: '猫睡了一整个下午',
    cover: '🐱',
    bg: ['#3a2740', '#6a4a5e'],
    vector: { valence: 0.35, arousal: -0.45 },
    reason: '你刚被慵懒治愈了一下',
  },
  {
    id: 'late_work',
    title: '凌晨三点还在改方案',
    cover: '💻',
    bg: ['#15131d', '#2a2540'],
    vector: { valence: -0.3, arousal: -0.1 },
    reason: '你深夜还醒着、还没停下',
  },
  {
    id: 'sea_sunset',
    title: '海边日落延时摄影',
    cover: '🌅',
    bg: ['#2a1f3a', '#7a4a5e'],
    vector: { valence: 0.45, arousal: -0.2 },
    reason: '你刚看过开阔的海与黄昏',
  },
]

/** 浏览行为追踪：记录刷过/停留的内容（按顺序），供 MoodSense 读取 */
export class BrowsingTracker {
  private viewed: string[] = []

  mark(id: string) {
    // 同一条重复进入只记最近一次顺序
    this.viewed = this.viewed.filter((v) => v !== id)
    this.viewed.push(id)
  }

  /** 最近看过的若干条（默认 3） */
  recent(n = 3): PrerollItem[] {
    return this.viewed
      .slice(-n)
      .map((id) => PREROLL.find((p) => p.id === id))
      .filter((p): p is PrerollItem => !!p)
  }

  hasAny() {
    return this.viewed.length > 0
  }
}

/**
 * 把“刚刷过的内容”聚合成一个心境贡献。
 * 权重随浏览条数上升（看得越多越能代表你此刻的处境），主导依据取最近一条。
 */
export function browsingSignal(tracker: BrowsingTracker): SignalContribution | null {
  const recent = tracker.recent(3)
  if (!recent.length) return null
  const v = recent.reduce((s, p) => s + p.vector.valence, 0) / recent.length
  const a = recent.reduce((s, p) => s + p.vector.arousal, 0) / recent.length
  return {
    source: 'browsing',
    valence: v,
    arousal: a,
    weight: Math.min(0.75, 0.35 + 0.2 * recent.length), // 处境层权重最高
    reason: recent[recent.length - 1].reason,
  }
}
