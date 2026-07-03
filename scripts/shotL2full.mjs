// 第二层全流程验收：feed → 沉浸(海面无月亮, 涟漪) → 心潮日记 → 我的。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 340, height: 736, deviceScaleFactor: 3 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))

// 开第二层
await page.evaluate(() => [...document.querySelectorAll('button,span')].find((e) => e.textContent?.trim() === '查看详情')?.click())
await new Promise((r) => setTimeout(r, 500))

// 进沉浸屏 + 点几下海面生成涟漪
await page.evaluate(() => document.querySelector('.l2card')?.click())
await new Promise((r) => setTimeout(r, 600))
const moonGone = await page.evaluate(() => !document.querySelector('.imm__moon') && !document.querySelector('.imm__orb'))
const seaBox = await page.evaluate(() => { const r = document.querySelector('.imm__sea').getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.55 } })
await page.mouse.click(seaBox.x, seaBox.y)
await page.mouse.click(seaBox.x - 30, seaBox.y + 20)
await new Promise((r) => setTimeout(r, 350))
await page.screenshot({ path: '/tmp/l2f_imm.png' })
console.log('IMM moonGone=' + moonGone)

// 心潮日记
await page.evaluate(() => [...document.querySelectorAll('.l2nav__b')].find((b) => b.dataset.t === 'diary')?.click())
await new Promise((r) => setTimeout(r, 800))
const diary = await page.evaluate(() => ({
  on: document.querySelector('[data-scr="diary"]')?.classList.contains('is-on'),
  entries: document.querySelectorAll('.dentry').length,
  bars: document.querySelectorAll('.l2strip__bar').length,
}))
await page.screenshot({ path: '/tmp/l2f_diary.png' })
console.log('DIARY ' + JSON.stringify(diary))

// 我的
await page.evaluate(() => [...document.querySelectorAll('.l2nav__b')].find((b) => b.dataset.t === 'me')?.click())
await new Promise((r) => setTimeout(r, 700))
const me = await page.evaluate(() => ({
  on: document.querySelector('[data-scr="me"]')?.classList.contains('is-on'),
  day: document.querySelector('.l2stat__day')?.textContent,
  sub: document.querySelector('.l2me__sb')?.textContent,
  items: document.querySelectorAll('.l2mi').length,
}))
await page.screenshot({ path: '/tmp/l2f_me.png' })
console.log('ME ' + JSON.stringify(me))

await browser.close()
console.log('SAVED /tmp/l2f_imm.png /tmp/l2f_diary.png /tmp/l2f_me.png')
