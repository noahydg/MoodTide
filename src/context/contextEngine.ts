/**
 * 此刻情境引擎 —— MoodTide “你不必开口”的核心。
 * 输入：被动信号（系统时间 / 节气 /（可选）天气），不向用户索取任何输入。
 * 输出：情境签名（给卡顶展示）+ 推断出的情绪档位 mood。
 *
 * 演示要点：现场把系统时间改到深夜、或隔天再刷，卡片的文案/配色/旋律会真的变化，
 * 证明“持续变化”不是假动画。
 */

import { currentSolarTerm } from './solarTerms'
import type { Mood } from './palette'

export type Weather = 'clear' | 'cloudy' | 'rain' | 'unknown'

export interface Context {
  date: Date
  timeBand: 'dawn' | 'day' | 'dusk' | 'night'
  solarTerm: string
  weather: Weather
  /** 给卡顶展示的一行情境签名，如：5月30日 · 小满 · 黄昏 */
  signature: string
  /** HH:MM，给概览卡展示 */
  clock: string
  /** 天气中文标签 */
  weatherLabel: string
  /** 时段中文标签 */
  bandLabel: string
}

const WEATHER_LABEL: Record<Weather, string> = {
  clear: '晴',
  cloudy: '多云',
  rain: '微雨',
  unknown: '此刻',
}

function timeBand(h: number): Context['timeBand'] {
  if (h >= 5 && h < 10) return 'dawn'
  if (h >= 10 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}

const BAND_LABEL: Record<Context['timeBand'], string> = {
  dawn: '清晨',
  day: '白日',
  dusk: '黄昏',
  night: '深夜',
}

/**
 * 读取当前情境。weather 留作可选信号：
 * MVP 默认 'unknown'（不影响演示）；接入真实天气 API 后传入即可。
 */
export function readContext(now: Date = new Date(), weather: Weather = 'unknown'): Context {
  const h = now.getHours()
  const band = timeBand(h)
  const term = currentSolarTerm(now)
  const sig = `${now.getMonth() + 1}月${now.getDate()}日 · ${term} · ${BAND_LABEL[band]}`
  const clock = `${String(h).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return {
    date: now,
    timeBand: band,
    solarTerm: term,
    weather,
    signature: sig,
    clock,
    weatherLabel: WEATHER_LABEL[weather],
    bandLabel: BAND_LABEL[band],
  }
}

/**
 * 情境 → 情绪档位。只做几个高置信度映射（准比全重要）。
 * 雨天优先压过时段（潮湿感最具辨识度）。
 */
export function inferMood(ctx: Context): Mood {
  if (ctx.weather === 'rain') return 'rain_melancholy'
  switch (ctx.timeBand) {
    case 'dawn':
      return 'dawn_clear'
    case 'day':
      return 'day_focus'
    case 'dusk':
      return 'dusk_ease'
    case 'night':
    default:
      return 'night_calm'
  }
}
