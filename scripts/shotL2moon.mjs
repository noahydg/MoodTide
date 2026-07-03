// 截：沉浸屏(月亮+歌声波，挑环最明显的一帧) + 哼唱「上滑取消」红色态。
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
await page.evaluate(() => [...document.querySelectorAll('button,span')].find((e) => e.textContent?.trim() === '查看详情')?.click())
await new Promise((r) => setTimeout(r, 400))
await page.evaluate(() => document.querySelector('.l2card')?.click())
await new Promise((r) => setTimeout(r, 600))

// 找环 opacity 较高的一帧再截，让歌声波更明显
for (let i = 0; i < 30; i++) {
  const maxO = await page.evaluate(() =>
    Math.max(...[...document.querySelectorAll('.imm__ring')].map((r) => +getComputedStyle(r).opacity)),
  )
  if (maxO > 0.4) break
  await new Promise((r) => setTimeout(r, 80))
}
await page.screenshot({ path: '/tmp/l2_moon.png' })
console.log('SAVED /tmp/l2_moon.png')

// 哼唱「上滑取消」红色态（按住+上滑，不松手时截图）
await page.evaluate(() => document.querySelector('.imm__tune')?.click())
await new Promise((r) => setTimeout(r, 400))
const b = await page.evaluate(() => {
  const r = document.querySelector('.drawer__hum').getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
})
await page.mouse.move(b.x, b.y)
await page.mouse.down()
await new Promise((r) => setTimeout(r, 120))
await page.mouse.move(b.x, b.y - 80, { steps: 6 })
await new Promise((r) => setTimeout(r, 160))
await page.screenshot({ path: '/tmp/l2_humcancel.png' })
await page.mouse.up()
console.log('SAVED /tmp/l2_humcancel.png')
await browser.close()
