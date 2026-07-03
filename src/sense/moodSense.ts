/**
 * MoodSense —— 客观→主观推断引擎（产品的灵魂）。
 *
 * 流程：采集客观信号(时间/天气/季节/刚刷过的内容) → 加权融合成心境坐标
 *      → snap 到情绪档 → 生成标签/“为什么是这首”/共鸣计数。
 *
 * 这是对“此刻情绪从哪来”的正面回答：不是问用户，而是从客观因素推断主观心境。
 */

import { MOODS, nearestMood, moodLabel, type Mood, type MoodVector } from '../context/palette'
import type { Context } from '../context/contextEngine'
import type { MoodInference, SignalContribution } from './types'
import { timeSignal, weatherSignal, seasonSignal } from './signals'
import { browsingSignal, BrowsingTracker } from '../feed/prerollFeed'

function clamp(x: number): number {
  return Math.max(-1, Math.min(1, x))
}

/** 加权融合多个信号 → 一个心境坐标 */
function fuse(contribs: SignalContribution[]): MoodVector {
  const total = contribs.reduce((s, c) => s + c.weight, 0) || 1
  const valence = contribs.reduce((s, c) => s + c.valence * c.weight, 0) / total
  const arousal = contribs.reduce((s, c) => s + c.arousal * c.weight, 0) / total
  return { valence: clamp(valence), arousal: clamp(arousal) }
}

/** 共鸣计数：由坐标确定性地算一个“今夜 N 人和你相似”的可信数字 */
function resonance(v: MoodVector): number {
  return Math.round(700 + (v.arousal + 1) * 280 + (1 - Math.abs(v.valence)) * 240)
}

/**
 * 主推断：把此刻情境 + 刚刷过的内容，推断成一次完整的心境结果。
 * browsing 为 null（还没刷迷你信息流）时，仅用环境层信号，结果依然成立。
 */
export function infer(ctx: Context, browsing: BrowsingTracker | null): MoodInference {
  const contribs: SignalContribution[] = [timeSignal(ctx), weatherSignal(ctx), seasonSignal(ctx)]
  const b = browsing ? browsingSignal(browsing) : null
  if (b) contribs.unshift(b) // 处境层放最前，作主导依据

  const live = contribs.filter((c) => c.weight > 0)
  const vector = fuse(live)
  const mood = nearestMood(vector)
  const why = live
    .slice()
    .sort((x, y) => y.weight - x.weight)
    .map((c) => c.reason)
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ')

  return {
    vector,
    mood,
    label: moodLabel(vector),
    why,
    contributors: live,
    resonanceCount: resonance(vector),
  }
}

/**
 * 为某个固定情绪档造一份推断（用于“向下刷”的其它情绪变体卡，不依赖真实信号）。
 */
export function inferenceForMood(mood: Mood): MoodInference {
  // 用该档的 anchor 作为坐标
  const v = MOODS[mood].anchor
  return {
    vector: v,
    mood,
    label: moodLabel(v),
    why: `另一种心情 · ${MOODS[mood].label}`,
    contributors: [],
    resonanceCount: resonance(v),
  }
}
