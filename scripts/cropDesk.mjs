// 在桌面视图(手机模型缩小居中)下裁剪某元素 —— 复现用户截图 #32 的语境。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const sel = process.argv[3] || '.combo'
const out = process.argv[4] || '/tmp/desk_crop.png'
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 900, height: 1000, deviceScaleFactor: 3 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 900))
const m = await page.evaluate((sel) => {
  const e = document.querySelector('.combo__desc')
  const lh = parseFloat(getComputedStyle(e).lineHeight)
  const lines = Math.round(e.getBoundingClientRect().height / lh)
  const dw = Math.round(e.getBoundingClientRect().width)
  const tw = Math.round(document.querySelector('.combo__thumb').getBoundingClientRect().width)
  return { lines, descW: dw, thumbW: tw }
}, sel)
console.log('desktop-mockup: desc ' + m.descW + 'px, thumb ' + m.thumbW + 'px, ' + m.lines + ' lines')
const el = await page.$(sel)
if (el) { await el.screenshot({ path: out }); console.log('SAVED ' + out) }
else console.error('NO_EL ' + sel)
await browser.close()
