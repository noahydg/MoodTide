// 测量每张卡是否一屏装下(是否溢出 .pager 高度) + card2 哼曲标题是否截断 + card3 各段高度。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const w = parseInt(process.argv[3] || '340', 10)
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: w, height: Math.round((w * 844) / 390), deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 700))
const res = await page.evaluate(() => {
  const out = {}
  const pager = document.querySelector('.pager').getBoundingClientRect()
  out.pagerH = Math.round(pager.height)
  // 逐卡：scrollHeight vs clientHeight => 溢出量
  const cards = [...document.querySelectorAll('.card')]
  out.cards = cards.map((c) => ({
    cls: c.className.replace('card ', ''),
    overflow: Math.round(c.scrollHeight - c.clientHeight),
    scrollH: c.scrollHeight,
    clientH: c.clientHeight,
  }))
  // card2 哼曲标题是否截断
  const b = document.querySelector('.sea__deep-tx b')
  if (b) out.humTitle = { text: b.textContent, truncated: b.scrollWidth > b.clientWidth + 1, scrollW: b.scrollWidth, clientW: b.clientWidth }
  return out
})
console.log(JSON.stringify(res, null, 2))
await browser.close()
