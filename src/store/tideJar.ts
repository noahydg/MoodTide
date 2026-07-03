/**
 * 我的潮汐瓶 —— 被“收下”的心潮的本地持久化（localStorage）。
 * 同时支撑“卡片记得你”：下次刷到时可引用上一次收下的潮，形成连续叙事。
 */

import type { Mood } from '../context/palette'

export interface KeptTide {
  id: string
  mood: Mood
  moodLabel: string
  signature: string // 收下时的情境签名
  mind: string // 当时的读心文案
  ts: number // 收下时间戳
}

const KEY = 'moodtide.jar.v1'

function load(): KeptTide[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function save(list: KeptTide[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export const tideJar = {
  all(): KeptTide[] {
    return load()
  },
  count(): number {
    return load().length
  },
  /** id 用时间戳+随机后缀，避免依赖外部库 */
  keep(t: Omit<KeptTide, 'id' | 'ts'>): KeptTide {
    const list = load()
    const kept: KeptTide = { ...t, id: `${Date.now()}_${Math.floor(Math.random() * 1e4)}`, ts: Date.now() }
    list.unshift(kept)
    save(list)
    return kept
  },
  /** 最近一次收下的潮，用于“记得你” */
  last(): KeptTide | null {
    return load()[0] ?? null
  },
}
