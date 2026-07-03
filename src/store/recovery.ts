/**
 * 心潮·潮汐周期 —— 把「走出一段感情」设计成一次完整的潮汐：
 * 失恋时你搁浅在「落潮」的谷底，心潮陪着你，潮位一天天涨回来，直到「满潮」。
 *
 * 周期 = 14 天（情绪急性期），科学参照（均有局限，仅作产品设计依据，非医学承诺）：
 *   · 失恋后最初 1–2 周情绪最强烈，之后大脑开始适应——这是最难熬的「急性期」。
 *   · DSM-5 评估持续性情绪状态用「持续两周」作为观察窗，两周是有意义的时间锚点。
 *   · Gilbert/Wilson 研究：人会高估负面情绪的持续时间——其实没你以为的那么久。
 * 定位：陪你走过最难的两周，不是「14 天就痊愈」的承诺。
 *
 * 注：浏览器环境，Date 正常可用（仅 Workflow 脚本里才禁用 Date）。
 */
const KEY = 'moodtide.healStart'
const CYCLE_KEY = 'moodtide.cycleDays'
const DEMO_DAYS_AGO = 10 // demo 默认从 10 天前起 → 今天是第 11 天
export const DEFAULT_CYCLE = 14 // 默认潮汐周期 = 情绪急性期两周
export const CYCLE_OPTIONS = [7, 14, 21, 30] // 可选周期（设置里调）

/** 当前疗愈周期（天）；用户可在设置里调整，持久化在 localStorage */
export function cycleDays(): number {
  const v = Number(localStorage.getItem(CYCLE_KEY))
  return CYCLE_OPTIONS.includes(v) ? v : DEFAULT_CYCLE
}
/** 设置疗愈周期（仅接受预设值） */
export function setCycleDays(n: number): void {
  if (CYCLE_OPTIONS.includes(n)) localStorage.setItem(CYCLE_KEY, String(n))
}
/** 兼容旧引用：常量名保留，值取当前周期 */
export const CYCLE_DAYS = DEFAULT_CYCLE

export function recoveryStart(): number {
  let v = localStorage.getItem(KEY)
  if (!v) {
    const d = new Date()
    d.setDate(d.getDate() - DEMO_DAYS_AGO)
    v = String(d.getTime())
    localStorage.setItem(KEY, v)
  }
  return Number(v)
}

/** 当前是潮汐周期的第几天（1..周期，封顶） */
export function recoveryDay(): number {
  const raw = Math.floor((Date.now() - recoveryStart()) / 86_400_000) + 1
  return Math.max(1, Math.min(cycleDays(), raw))
}

/** 潮位进度 0..1（第几天 / 周期），用于潮汐进度条 */
export function recoveryProgress(): number {
  return recoveryDay() / cycleDays()
}

/** 重新开始（清空起点，下次读取重新计为第 1 天） */
export function resetRecovery() {
  localStorage.removeItem(KEY)
}
