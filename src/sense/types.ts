/**
 * MoodSense 类型 —— 客观→主观推断的数据结构。
 */

import type { Mood, MoodVector } from '../context/palette'

/** 单个客观信号对心境坐标的贡献 */
export interface SignalContribution {
  source: 'time' | 'weather' | 'season' | 'browsing'
  valence: number // -1..1
  arousal: number // -1..1
  weight: number // 0..1，越大越主导
  reason: string // 人话依据片段，如 '深夜' / '雨' / '你刚停在了雨夜与独处'
}

/** 一次完整的心境推断结果（驱动一张 MoodTide 卡片） */
export interface MoodInference {
  vector: MoodVector // 融合后的心境坐标
  mood: Mood // snap 到的情绪档
  label: string // 心境标签，如 '低落偏平静'
  why: string // 为什么是这首：'深夜 · 雨 · 你刚停在了雨夜与独处'
  contributors: SignalContribution[] // 全部生效信号（第二层可展开看）
  resonanceCount: number // 今夜 N 人刷到相似的潮
}
