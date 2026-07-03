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
  const btn = document.querySelector('.harc__play')
  const ico = btn?.querySelector('.ico')
  const bcs = getComputedStyle(btn)
  const b = btn.getBoundingClientRect(); const i = ico.getBoundingClientRect()
  return {
    btnDisplay: bcs.display, justify: bcs.justifyContent, align: bcs.alignItems,
    boxSizing: bcs.boxSizing, padding: bcs.padding, border: bcs.borderWidth,
    btn: { w: +b.width.toFixed(2), x: +b.left.toFixed(2) },
    ico: { w: +i.width.toFixed(2), x: +i.left.toFixed(2) },
    leftGap: +(i.left - b.left).toFixed(2), rightGap: +(b.right - i.right).toFixed(2),
  }
})
console.log(JSON.stringify(r, null, 2))
await browser.close()
