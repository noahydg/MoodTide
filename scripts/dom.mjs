import puppeteer from 'puppeteer-core'
const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const b = await puppeteer.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox'] })
const p = await b.newPage()
await p.setViewport({ width: 900, height: 1000, deviceScaleFactor: 1 })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))
const d = await p.evaluate(() => {
  const t = (s) => document.querySelector(s)?.textContent?.trim() || '(无)'
  const has = (s) => !!document.querySelector(s)
  const rect = (s) => { const e = document.querySelector(s); if (!e) return '(无)'; const r = e.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.left)},${Math.round(r.top)}` }
  const bg = document.querySelector('.stage__bg')
  return {
    deviceFrame: rect('.device__frame'),
    screen: rect('.device__screen'),
    island: has('.device__island'),
    bgImage: bg ? getComputedStyle(bg).backgroundImage.slice(0, 50) : '(无bg)',
    statusTime: t('.statusbar__time'),
    navActive: t('.topnav__tabs .is-active'),
    title: t('.mcard__title'),
    stats: [...document.querySelectorAll('.stat')].map(s => s.querySelector('label').textContent + ':' + s.querySelector('b').textContent),
    quoteCount: document.querySelectorAll('.quote').length,
    ctas: [...document.querySelectorAll('.cta')].map(c => c.textContent.trim()),
    upHint: t('.mcard__up'),
    hasActionRail: has('.rail'),  // 应为 false（已删爱心栏）
  }
})
console.log(JSON.stringify(d, null, 2))
await b.close()
