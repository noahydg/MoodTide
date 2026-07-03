import puppeteer from 'puppeteer-core'
const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader'] })
const p = await b.newPage()
await p.setViewport({ width: 414, height: 896, deviceScaleFactor: 2 })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await p.click('#enter'); await sleep(700)
const n = await p.evaluate(() => document.querySelectorAll('#feed .content').length)
await p.evaluate((i) => document.getElementById('feed').scrollTo({ top: i * innerHeight, behavior: 'instant' }), n)
await sleep(2200)
await p.mouse.click(207, 320); await sleep(1100)
const d = await p.evaluate(() => {
  const det = document.querySelector('.detail')
  const t = (s) => det?.querySelector(s)?.textContent?.trim() || '(空)'
  return {
    open: det?.classList.contains('is-open'),
    sig: t('.detail__sig'), mind: t('.detail__mind'),
    wheelDots: det?.querySelectorAll('.wheel__dot').length,
    actions: [...det.querySelectorAll('.act')].map(a => a.textContent.trim()),
  }
})
console.log(JSON.stringify(d, null, 2))
await p.screenshot({ path: '/tmp/mt_detail2.png' })
await b.close()
