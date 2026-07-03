// 文本探针：确认 tab + 的配色 与 harc 播放钮里 play 图标居中（无 margin 偏移）。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 340, height: 736, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))
const r = await page.evaluate(() => {
  const plus = document.querySelector('.plus')
  const pcs = plus ? getComputedStyle(plus) : null
  // play 图标相对其圆形按钮是否水平居中
  const btn = document.querySelector('.harc__play')
  const ico = btn?.querySelector('.ico')
  let playCentering = null
  if (btn && ico) {
    const b = btn.getBoundingClientRect(); const i = ico.getBoundingClientRect()
    const leftGap = i.left - b.left
    const rightGap = b.right - i.right
    playCentering = { leftGap: +leftGap.toFixed(2), rightGap: +rightGap.toFixed(2), icoMarginLeft: getComputedStyle(ico).marginLeft }
  }
  return {
    plusBg: pcs?.backgroundColor,
    plusBoxShadow: pcs?.boxShadow,
    playCentering,
  }
})
console.log(JSON.stringify(r, null, 2))
await browser.close()
