// 验证卡2水面：导航到卡2 → 拍几下 → 抓涟漪/粒子动画帧
import puppeteer from 'puppeteer-core'
const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader'] })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await p.waitForSelector('.card2')
// 滑到卡2
await p.evaluate(() => { const t = document.querySelector('.pager__track'); t.scrollTo({ left: t.clientWidth, behavior: 'instant' }) })
await sleep(800)
await p.screenshot({ path: '/tmp/sea_idle.png' }) // 常驻水面

// 拍 4 下不同位置（pointerdown）
const zone = await p.$('.sea__zone')
const box = await zone.boundingBox()
const pts = [[0.5, 0.45], [0.35, 0.6], [0.65, 0.55], [0.5, 0.4]]
for (const [fx, fy] of pts) {
  await p.mouse.move(box.x + box.width * fx, box.y + box.height * fy)
  await p.mouse.down()
  await p.mouse.up()
  await sleep(120)
}
await sleep(120)
await p.screenshot({ path: '/tmp/sea_tap.png' }) // 涟漪+粒子飞溅中

// canvas 是否真在动：隔 200ms 抓两次像素哈希
const grab = () => p.evaluate(() => {
  const cv = document.querySelector('.sea__cv')
  const g = cv.getContext('2d')
  const d = g.getImageData(0, 0, cv.width, cv.height).data
  let h = 0, nonEmpty = 0
  for (let i = 0; i < d.length; i += 4 * 137) { h = (h * 31 + d[i] + d[i + 1] + d[i + 2]) | 0; if (d[i + 3] > 8) nonEmpty++ }
  return { h, nonEmpty }
})
const a = await grab(); await sleep(220); const c = await grab()
console.log('canvas_animating:', a.h !== c.h, '| painting:', c.nonEmpty > 0)
const info = await p.evaluate(() => ({ bpm: document.querySelector('.sea__bpm')?.textContent?.trim(), sub: document.querySelector('.sea__bpmsub')?.textContent?.trim() }))
console.log('after taps:', JSON.stringify(info))
console.log('errors:', errs.length ? errs : 'none')
await b.close()
