import puppeteer from 'puppeteer-core'
const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const b = await puppeteer.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox'] })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await p.waitForSelector('.card1')
await new Promise((r) => setTimeout(r, 400))
const r = await p.evaluate(() => {
  const bot = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return Math.round(b.bottom) }
  const top = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return Math.round(b.top) }
  const peersBottom = bot('.card1 .peers')
  const pagerBottom = bot('.pager')
  const actbarTop = top('.actbar')
  return {
    winH: window.innerHeight,
    lastContentBottom: peersBottom,         // 卡1 最后一块内容的底
    pagerBottom,                            // 横滑区底
    gap_content_to_actionbar: actbarTop - peersBottom,  // 内容底 → 操作栏顶 的空隙
    actbarTop,
    tabBottom: bot('.tabbar'),
  }
})
console.log(JSON.stringify(r, null, 2))
await b.close()
