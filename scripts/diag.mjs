import puppeteer from 'puppeteer-core'
const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const b = await puppeteer.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox'] })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await p.waitForSelector('.card1')
await new Promise((r) => setTimeout(r, 800))
const r = await p.evaluate(() => {
  const rect = (s) => { const e = document.querySelector(s); if (!e) return 'MISSING'; const b = e.getBoundingClientRect(); return `${Math.round(b.width)}x${Math.round(b.height)}@${Math.round(b.left)},${Math.round(b.top)}` }
  return {
    device: rect('.device'),
    screen: rect('.device__screen'),
    stage: rect('.stage'),
    pager: rect('.pager'),
    track: rect('.pager__track'),
    page0: rect('.pager__page'),
    card1: rect('.card1'),
    head: rect('.card1 .c-head'),
    title: rect('.card1 .c-title'),
    grid4: rect('.card1 .grid4'),
  }
})
console.log(JSON.stringify(r, null, 2))
await b.close()
