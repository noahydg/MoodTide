/**
 * 客观信号采集器 —— 每个信号产出一个对心境坐标的“贡献”。
 * 这些都是“客观因素”，MoodSense 把它们融合成“主观心境”。
 *
 * 三层信号（越往下越“懂你”）：
 *   环境层：时间、天气、季节/节气（人人共享，稳）
 *   处境层：你刚刷过什么（browsing，抖音独有的“懂你”，由迷你信息流提供）
 *   个人层：定位、历史潮汐瓶（可选/远期，涉隐私）
 */

import type { Context } from '../context/contextEngine'
import type { SignalContribution } from './types'

/** 时间信号：一天中的时辰最影响“唤醒度” */
export function timeSignal(ctx: Context): SignalContribution {
  switch (ctx.timeBand) {
    case 'dawn':
      return { source: 'time', valence: 0.4, arousal: 0.3, weight: 0.5, reason: '清晨' }
    case 'day':
      return { source: 'time', valence: 0.05, arousal: 0.35, weight: 0.4, reason: '白日' }
    case 'dusk':
      return { source: 'time', valence: 0.25, arousal: -0.35, weight: 0.5, reason: '黄昏' }
    case 'night':
    default:
      return { source: 'time', valence: -0.15, arousal: -0.6, weight: 0.6, reason: '深夜' }
  }
}

/** 天气信号：雨最影响“愉悦度”（潮湿、内收） */
export function weatherSignal(ctx: Context): SignalContribution {
  switch (ctx.weather) {
    case 'rain':
      return { source: 'weather', valence: -0.4, arousal: -0.2, weight: 0.6, reason: '雨' }
    case 'clear':
      return { source: 'weather', valence: 0.35, arousal: 0.15, weight: 0.4, reason: '晴' }
    case 'cloudy':
      return { source: 'weather', valence: -0.1, arousal: -0.1, weight: 0.3, reason: '阴' }
    case 'unknown':
    default:
      return { source: 'weather', valence: 0, arousal: 0, weight: 0, reason: '' } // weight 0 → 不参与
  }
}

/** 季节信号：弱权重的“底色”，呼应东方节气美学 */
export function seasonSignal(ctx: Context): SignalContribution {
  const m = ctx.date.getMonth() + 1
  if (m >= 3 && m <= 5)
    return { source: 'season', valence: 0.2, arousal: 0.1, weight: 0.2, reason: `${ctx.solarTerm}` }
  if (m >= 6 && m <= 8)
    return { source: 'season', valence: 0.1, arousal: 0.2, weight: 0.2, reason: `${ctx.solarTerm}` }
  if (m >= 9 && m <= 11)
    return { source: 'season', valence: -0.1, arousal: -0.1, weight: 0.2, reason: `${ctx.solarTerm}` }
  return { source: 'season', valence: -0.15, arousal: -0.2, weight: 0.2, reason: `${ctx.solarTerm}` }
}
