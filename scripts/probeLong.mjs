import puppeteer from 'puppeteer-core'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const b = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage()
await p.setViewport({ width: 340, height: 736, deviceScaleFactor: 2 })
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 500))
await p.evaluate(() => [...document.querySelectorAll('button,span')].find((e) => e.textContent?.trim() === '查看详情')?.click())
await new Promise((r) => setTimeout(r, 400))
await p.evaluate(() => document.querySelector('.l2card')?.click())
const st = () => p.evaluate(() => document.querySelector('.l2').__music.state)
for (let i = 0; i < 5; i++) {
  await new Promise((r) => setTimeout(r, 1500))
  const s = await st()
  console.log('t+' + ((i + 1) * 1.5).toFixed(1) + 's  notes=' + s.notes + ' bpm=' + s.bpm)
}
await b.close()
