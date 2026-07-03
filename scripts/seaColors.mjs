// 拍打后采样 canvas：确认画出了「暖金粒子」和「亮色涟漪」，而非空白/纯暗
import puppeteer from 'puppeteer-core'
const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader'] })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await p.waitForSelector('.card2')
await p.evaluate(() => { const t = document.querySelector('.pager__track'); t.scrollTo({ left: t.clientWidth, behavior: 'instant' }) })
await sleep(700)
const zone = await p.$('.sea__zone'); const box = await zone.boundingBox()
for (let i = 0; i < 3; i++) { await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5); await p.mouse.down(); await p.mouse.up(); await sleep(80) }
await sleep(60)
const r = await p.evaluate(() => {
  const cv = document.querySelector('.sea__cv'); const g = cv.getContext('2d')
  const d = g.getImageData(0, 0, cv.width, cv.height).data
  let gold = 0, bright = 0, drawn = 0
  for (let i = 0; i < d.length; i += 4) {
    const R = d[i], G = d[i + 1], B = d[i + 2], A = d[i + 3]
    if (A > 12) drawn++
    if (R > 200 && G > 170 && B < 190 && R > B) gold++       // 暖金(月光粒子)
    if (R > 180 && G > 200 && B > 200) bright++              // 亮青白(涟漪/浪光)
  }
  const total = d.length / 4
  return { drawnPct: +(drawn / total * 100).toFixed(1), goldPx: gold, brightPx: bright }
})
console.log(JSON.stringify(r))
await b.close()
