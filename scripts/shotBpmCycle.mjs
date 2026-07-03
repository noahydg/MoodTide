// 验收：沉浸屏拍打海面出 BPM + 设置里疗愈周期可调（改 7 天后心潮路径节点变少）。
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

// 进沉浸屏
await p.evaluate(() => [...document.querySelectorAll('button,span')].find((e) => e.textContent?.trim() === '查看详情')?.click())
await new Promise((r) => setTimeout(r, 400))
await p.evaluate(() => document.querySelector('.l2card')?.click())
await new Promise((r) => setTimeout(r, 600))

// 拍打海面 5 下（间隔 ~300ms）
const box = await p.evaluate(() => { const r = document.querySelector('.imm__sea').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.55 } })
for (let i = 0; i < 5; i++) {
  await p.mouse.move(box.x + (i % 2 ? 12 : -12), box.y)
  await p.mouse.down(); await p.mouse.up()
  await new Promise((r) => setTimeout(r, 300))
}
const beat = await p.evaluate(() => ({
  live: document.querySelector('.imm__beat')?.classList.contains('is-live'),
  bpm: document.querySelector('.imm__bpm-n')?.textContent,
  sub: document.querySelector('.imm__bpm-sub')?.textContent,
}))
console.log('BPM ' + JSON.stringify(beat))
await p.screenshot({ path: '/tmp/bpm_sea.png' })

// 回 feed → 我的 → 设置
await p.evaluate(() => [...document.querySelectorAll('.l2nav__b')].find((x) => x.dataset.t === 'feed')?.click())
await new Promise((r) => setTimeout(r, 300))
await p.evaluate(() => [...document.querySelectorAll('.l2nav__b')].find((x) => x.dataset.t === 'me')?.click())
await new Promise((r) => setTimeout(r, 300))
await p.evaluate(() => document.querySelector('.l2mi[data-m="set"]')?.click())
await new Promise((r) => setTimeout(r, 500))
const set1 = await p.evaluate(() => ({
  chips: [...document.querySelectorAll('.cyc')].map((c) => c.textContent),
  on: document.querySelector('.cyc.is-on')?.textContent,
  v: document.querySelector('.setblk__v')?.textContent,
  reset: !!document.querySelector('[data-reset]'),
}))
console.log('SET ' + JSON.stringify(set1))
await p.screenshot({ path: '/tmp/cycle_set.png' })

// 点 7 天
await p.evaluate(() => [...document.querySelectorAll('.cyc')].find((c) => c.dataset.cyc === '7')?.click())
await new Promise((r) => setTimeout(r, 400))
const set2 = await p.evaluate(() => ({ on: document.querySelector('.cyc.is-on')?.textContent, v: document.querySelector('.setblk__v')?.textContent }))
console.log('AFTER7 ' + JSON.stringify(set2))

// 返回 → 心潮，看节点数是否随 7 天周期变化（≤7）
await p.evaluate(() => document.querySelector('.sheet__back')?.click())
await new Promise((r) => setTimeout(r, 350))
await p.evaluate(() => [...document.querySelectorAll('.l2nav__b')].find((x) => x.dataset.t === 'diary')?.click())
await new Promise((r) => setTimeout(r, 1700))
const diary = await p.evaluate(() => ({
  nodes: document.querySelectorAll('.tp__node').length,
  daySub: document.querySelector('.tp__sub')?.textContent?.replace(/\s+/g, ' ').trim(),
}))
console.log('DIARY7 ' + JSON.stringify(diary))
await p.screenshot({ path: '/tmp/cycle_diary7.png' })

await b.close()
console.log('SAVED bpm_sea / cycle_set / cycle_diary7')
