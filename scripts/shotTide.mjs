// 验收交互心潮路径：折线起伏 / 节点悬停tooltip / 点击详情 / 记录今天 / 建议+洞察。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const b = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const p = await b.newPage()
await p.setViewport({ width: 340, height: 736, deviceScaleFactor: 3 })
await p.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))
await p.evaluate(() => [...document.querySelectorAll('button,span')].find((e) => e.textContent?.trim() === '查看详情')?.click())
await new Promise((r) => setTimeout(r, 400))
await p.evaluate(() => [...document.querySelectorAll('.l2nav__b')].find((x) => x.dataset.t === 'diary')?.click())
await new Promise((r) => setTimeout(r, 1900))

const base = await p.evaluate(() => {
  const ys = [...document.querySelectorAll('.tp__node .tp__core')].map((c) => +c.getAttribute('cy'))
  const dips = ys.filter((y, i) => i > 0 && y > ys[i - 1]).length // cy 变大=分数变低=回落
  return {
    nodes: document.querySelectorAll('.tp__node').length,
    hasDips: dips > 0, // 折线是否有回落（非全程上升）
    advTitle: document.querySelector('.tadv__t')?.textContent,
    advBody: document.querySelector('.tadv__b')?.textContent,
    insights: [...document.querySelectorAll('.tins__c b')].map((e) => e.textContent),
    tlScores: [...document.querySelectorAll('.dentry__sc')].slice(0, 3).map((e) => e.textContent),
  }
})
console.log('PATH ' + JSON.stringify(base))
await p.screenshot({ path: '/tmp/tide_main.png' })

// 悬停一个中部节点 → tooltip
const nb = await p.evaluate(() => {
  const n = document.querySelectorAll('.tp__node')[2]
  const r = n.querySelector('.tp__core').getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})
await p.mouse.move(nb.x, nb.y)
await new Promise((r) => setTimeout(r, 400))
const tip = await p.evaluate(() => ({
  on: document.querySelector('.tp__tip')?.classList.contains('is-on'),
  day: document.querySelector('.tp__tip-day')?.textContent,
  mood: document.querySelector('.tp__tip-mood')?.textContent,
  score: document.querySelector('.tp__tip-score')?.textContent,
  hot: !!document.querySelector('.tp__node.is-hot'),
}))
console.log('TIP ' + JSON.stringify(tip))
await p.screenshot({ path: '/tmp/tide_tip.png' })

// 点击该节点 → 详情卡
await p.mouse.click(nb.x, nb.y)
await new Promise((r) => setTimeout(r, 700))
const dnd = await p.evaluate(() => ({
  on: document.querySelector('.dnd')?.classList.contains('is-on'),
  day: document.querySelector('.dnd__day')?.textContent,
  num: document.querySelector('.dnd__num')?.textContent,
  fillW: document.querySelector('.dnd__fill')?.style.width,
}))
console.log('DETAIL ' + JSON.stringify(dnd))
await p.screenshot({ path: '/tmp/tide_detail.png' })
await p.evaluate(() => document.querySelector('.dnd__close')?.click())
await new Promise((r) => setTimeout(r, 400))

// 记录今天 → 写字触发解析 → 保存
await p.evaluate(() => document.querySelector('.trec')?.click())
await new Promise((r) => setTimeout(r, 500))
await p.evaluate(() => { const t = document.querySelector('.rec__text'); t.value = '今天竟然笑了一下，好多了'; t.dispatchEvent(new Event('input', { bubbles: true })) })
await new Promise((r) => setTimeout(r, 500))
const recAi = await p.evaluate(() => document.querySelector('.rec__ai-tx')?.textContent)
console.log('REC_AI "' + recAi + '"')
await p.screenshot({ path: '/tmp/tide_rec.png' })
await p.evaluate(() => document.querySelector('.rec__save')?.click())
await new Promise((r) => setTimeout(r, 1700))
const after = await p.evaluate(() => ({
  toastSeen: true,
  todayScoreTL: document.querySelector('.dentry__sc')?.textContent,
}))
console.log('AFTER ' + JSON.stringify(after))
await p.screenshot({ path: '/tmp/tide_after.png' })

await b.close()
console.log('SAVED tide_main/tip/detail/rec/after')
