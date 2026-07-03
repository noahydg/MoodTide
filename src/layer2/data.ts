/**
 * 第二层（小程序）数据 —— 沿用团队原型结构，文案对齐第一层「失恋疗愈」语气。
 * 海报配色：钴蓝 · 米白 · 暖金 · 长春花紫。
 */
export interface Mood {
  ctx: string
  read: string
  accent: string
  wave: string
  amp: number
  dur: number
  color: string
  arr: string
}

// 此刻 feed：几张「读心卡」，点进去即沉浸生成一首歌
export const moods: Mood[] = [
  {
    ctx: '深夜 · 睡不着',
    read: '凌晨三点还醒着吧。<br>这首先不吵你，陪你把这夜走完。',
    accent: '#6d8fc9',
    wave: '#3f63a8',
    amp: 0.8,
    dur: 9,
    color: '#6d8fc9',
    arr: '钢琴 · 留白 · 远处的海',
  },
  {
    ctx: '黄昏 · 一个人',
    read: '天黑下来最难熬。<br>让弦乐先接住你，再透进一点光。',
    accent: '#e2b35f',
    wave: '#cf9c45',
    amp: 1.0,
    dur: 6,
    color: '#e2b35f',
    arr: '弦乐 · 暖垫 · 一点微光',
  },
  {
    ctx: '通勤 · 走神',
    read: '人群里又突然想起了。<br>给你一段不打扰的潮，陪你走完这段路。',
    accent: '#d98f64',
    wave: '#c4794f',
    amp: 0.7,
    dur: 8,
    color: '#d98f64',
    arr: '电钢 · 低音 · 城市的风',
  },
  {
    ctx: '雨天 · 想念',
    read: '这种雨夜，<br>适合一首没有歌词的歌。',
    accent: '#9a86c6',
    wave: '#7d68b0',
    amp: 0.9,
    dur: 7,
    color: '#9a86c6',
    arr: '钢琴 · 雨声 · 大提琴',
  },
]

// 微调抽屉里的情绪走向（呼应疗愈弧：先同频、再托起）
export interface MoodChip {
  t: string
  accent: string
  wave: string
  amp: number
  dur: number
  arr: string
}
export const moodChips: MoodChip[] = [
  { t: '更平静', accent: '#6d8fc9', wave: '#3f63a8', amp: 0.6, dur: 10, arr: '氛围垫 · 缓弦 · 大留白' },
  { t: '更暖一点', accent: '#e2b35f', wave: '#cf9c45', amp: 1.1, dur: 6, arr: '暖钢琴 · 木吉他 · 微光' },
  { t: '更想念', accent: '#9a86c6', wave: '#7d68b0', amp: 0.85, dur: 8, arr: '大提琴 · 钢琴 · 一点回声' },
  { t: '有点力气', accent: '#e6c277', wave: '#d3a955', amp: 1.4, dur: 3.6, arr: '鼓点 · 合成器 · 向前的律动' },
]
