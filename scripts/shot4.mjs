// 截图 4 卡（从预览/静态服务，无 HMR）。用法: node scripts/shot4.mjs [baseURL]
import puppeteer from 'puppeteer-core'
const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const BASE = process.argv[2] || 'http://localhost:4173/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })

// 桌面整机
const pd = await b.newPage()
await pd.setViewport({ width: 760, height: 920, deviceScaleFactor: 1.5 })
await pd.goto(BASE, { waitUntil: 'networkidle0' })
await pd.waitForSelector('.card1')
await sleep(600)
await pd.screenshot({ path: '/tmp/c_desktop.png' })

// 手机逐卡
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
await p.goto(BASE, { waitUntil: 'networkidle0' })
await p.waitForSelector('.card1')
await sleep(500)
for (let i = 0; i < 4; i++) {
  await p.evaluate((idx) => {
    const t = document.querySelector('.pager__track')
    t.scrollTo({ left: idx * t.clientWidth, behavior: 'instant' })
  }, i)
  await sleep(650)
  if (i === 1) {
    for (let k = 0; k < 4; k++) {
      await p.evaluate(() => {
        const z = document.querySelector('.sea__zone')
        const r = z.getBoundingClientRect()
        z.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true }))
      })
      await sleep(240)
    }
    await sleep(300)
  }
  await p.screenshot({ path: `/tmp/c${i + 1}.png` })
}
const info = await p.evaluate(() => ({
  cards: document.querySelectorAll('.card').length,
  pages: document.querySelectorAll('.pager__page').length,
  titles: [...document.querySelectorAll('.c-title')].map((t) => t.textContent),
  seaBpm: document.querySelector('.sea__bpm')?.textContent,
}))
console.log('INFO:', JSON.stringify(info))
console.log('ERRORS:', errs.length ? errs : 'none')
await b.close()
