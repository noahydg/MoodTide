/**
 * 二十四节气（近似版）。
 * 用每个节气的“近似公历日期”做边界判断，逐年漂移 ±1 天，
 * 对“刷到即懂”的演示精度足够（演示要点是“它知道现在是小满/黄昏”，不是天文级精度）。
 * 如需精确，后续可替换为寿星公式或调用日历 API。
 */

interface Term {
  name: string
  month: number // 1-12
  day: number // 该节气的近似起始日
}

// 顺序为公历年内的时间顺序
const TERMS: Term[] = [
  { name: '小寒', month: 1, day: 5 },
  { name: '大寒', month: 1, day: 20 },
  { name: '立春', month: 2, day: 4 },
  { name: '雨水', month: 2, day: 19 },
  { name: '惊蛰', month: 3, day: 5 },
  { name: '春分', month: 3, day: 20 },
  { name: '清明', month: 4, day: 5 },
  { name: '谷雨', month: 4, day: 20 },
  { name: '立夏', month: 5, day: 5 },
  { name: '小满', month: 5, day: 21 },
  { name: '芒种', month: 6, day: 6 },
  { name: '夏至', month: 6, day: 21 },
  { name: '小暑', month: 7, day: 7 },
  { name: '大暑', month: 7, day: 22 },
  { name: '立秋', month: 8, day: 7 },
  { name: '处暑', month: 8, day: 23 },
  { name: '白露', month: 9, day: 7 },
  { name: '秋分', month: 9, day: 23 },
  { name: '寒露', month: 10, day: 8 },
  { name: '霜降', month: 10, day: 23 },
  { name: '立冬', month: 11, day: 7 },
  { name: '小雪', month: 11, day: 22 },
  { name: '大雪', month: 12, day: 7 },
  { name: '冬至', month: 12, day: 22 },
]

/** 返回 date 当天所处（最近一个已开始）的节气名 */
export function currentSolarTerm(date: Date): string {
  const m = date.getMonth() + 1
  const d = date.getDate()
  const cur = m * 100 + d
  let result = '冬至' // 跨年时落在上一年的冬至
  for (const t of TERMS) {
    if (t.month * 100 + t.day <= cur) result = t.name
    else break
  }
  return result
}
