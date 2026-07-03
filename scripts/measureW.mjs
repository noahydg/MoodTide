// 在多个视口宽度下测量 AI 文案行数，验证换行是否随宽度自适应。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
for (const w of [390, 360, 340, 320]) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: 844, deviceScaleFactor: 2 })
  await page.goto(url, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 500))
  const m = await page.evaluate(() => {
    const e = document.querySelector('.combo__desc')
    const lh = parseFloat(getComputedStyle(e).lineHeight)
    return { descW: Math.round(e.getBoundingClientRect().width), lines: Math.round(e.getBoundingClientRect().height / lh) }
  })
  console.log(`viewport ${w}px -> desc ${m.descW}px, ${m.lines} lines`)
  await page.close()
}
await browser.close()
