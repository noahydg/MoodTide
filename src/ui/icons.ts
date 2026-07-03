/**
 * SF Symbols 风格内联图标 —— 细线条、圆角、Apple 质感，用 currentColor 上色。
 * 不用 emoji（团队要求），零依赖、零体积负担（不引外部字体）。
 * 若日后拿到桌面的 SF 符号 SVG，把对应 path 替换进 PATHS 即可，调用处不用改。
 *
 * 用法： icon('waveform')  → 返回 <svg> 字符串；class 由调用方加，尺寸用 CSS 控制。
 */
type IconName =
  | 'sparkle'
  | 'waveform'
  | 'quote'
  | 'chevronUp'
  | 'chevronRight'
  | 'drop'
  | 'hand'
  | 'bulb'
  | 'book'
  | 'clock'
  | 'sun'
  | 'moon'
  | 'cloudRain'
  | 'leaf'
  | 'person'
  | 'play'
  | 'pause'

// 统一 24×24 viewBox。stroke 用 currentColor，fill 视图标而定。
const PATHS: Record<IconName, { d: string; fill?: boolean }> = {
  // 四角星（AI / 灵感）
  sparkle: { d: 'M12 3l1.8 5.4a3 3 0 0 0 1.9 1.9L21 12l-5.3 1.7a3 3 0 0 0-1.9 1.9L12 21l-1.8-5.4a3 3 0 0 0-1.9-1.9L3 12l5.3-1.7a3 3 0 0 0 1.9-1.9z', fill: true },
  // 声波柱
  waveform: { d: 'M3 12h0M7 7v10M11 4v16M15 8v8M19 11v2M21 12h0' },
  // 引号
  quote: { d: 'M7 7C5 8 4 10 4 13v4h5v-6H6c0-2 .7-3 2-4zM17 7c-2 1-3 3-3 6v4h5v-6h-3c0-2 .7-3 2-4z', fill: true },
  chevronUp: { d: 'M6 14l6-6 6 6' },
  chevronRight: { d: 'M9 6l6 6-6 6' },
  // 水滴（拍打海面）
  drop: { d: 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z', fill: true },
  // 手指轻点
  hand: { d: 'M9 11V6a1.5 1.5 0 0 1 3 0v4m0-1a1.5 1.5 0 0 1 3 0v1m0-.5a1.5 1.5 0 0 1 3 0V15a5 5 0 0 1-5 5h-2a4 4 0 0 1-3-1.5L4.5 15a1.6 1.6 0 0 1 2.3-2.2L9 14.5' },
  // 灯泡（建议）
  bulb: { d: 'M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.6.6-1 1.3-1 2.2v.3H9v-.3c0-.9-.4-1.6-1-2.2A6 6 0 0 1 12 3z' },
  // 书（日记）
  book: { d: 'M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11' },
  clock: { d: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
  sun: { d: 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19' },
  moon: { d: 'M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10z' },
  cloudRain: { d: 'M7 16a4 4 0 0 1-.5-8 5 5 0 0 1 9.6-.8A3.5 3.5 0 0 1 17 16M9 19l-1 2M13 19l-1 2M16 19l-1 2' },
  leaf: { d: 'M5 19c0-8 5-13 14-13 0 9-5 14-13 14-1 0-1 0-1-1zM6 18c3-4 6-6 9-7' },
  person: { d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0', fill: false },
  play: { d: 'M8 5v14l11-7z', fill: true },
  pause: { d: 'M8 5h3v14H8zM13 5h3v14h-3z', fill: true },
}

export function icon(name: IconName, cls = 'ico'): string {
  const p = PATHS[name]
  const fill = p.fill ? 'currentColor' : 'none'
  const stroke = p.fill ? 'none' : 'currentColor'
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${p.d}"/></svg>`
}

/** 按时段取天气/天色图标名 */
export function skyIcon(band: 'dawn' | 'day' | 'dusk' | 'night', weatherRain = false): IconName {
  if (weatherRain) return 'cloudRain'
  if (band === 'night') return 'moon'
  return 'sun'
}
