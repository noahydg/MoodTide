// 客观测量卡1 关键元素的渲染尺寸/行数，避免靠肉眼判断比例。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 800))
const m = await page.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), t: Math.round(b.top), l: Math.round(b.left) } }
  const lines = (s) => { const e = document.querySelector(s); if (!e) return null; const lh = parseFloat(getComputedStyle(e).lineHeight); return Math.round(e.getBoundingClientRect().height / lh) }
  const titleEl = document.querySelector('.c-title')
  const peerRects = [...document.querySelectorAll('.peer')].map((e) => { const b = e.getBoundingClientRect(); return { t: Math.round(b.top), h: Math.round(b.height) } })
  return {
    title: titleEl?.textContent,
    titleWrapped: titleEl ? titleEl.scrollWidth > titleEl.clientWidth + 1 : null,
    desc: r('.combo__desc'), descLines: lines('.combo__desc'),
    thumb: r('.combo__thumb'), harc: r('.harc'),
    combo: r('.combo'), peers: r('.peers'), peerRects,
  }
})
console.log(JSON.stringify(m, null, 2))
await browser.close()
