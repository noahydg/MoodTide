// 抓「入场动效中途」一帧 + 「稳定后」一帧，验证动画与波形。
import puppeteer from 'puppeteer-core'
const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await p.waitForSelector('.card1')
// 入场中途
await sleep(280)
await p.screenshot({ path: '/tmp/anim_mid.png' })
// 稳定后
await sleep(900)
await p.screenshot({ path: '/tmp/anim_end.png' })
// 波形动画帧：隔 400ms 抓两张，scaleY 应不同
const wf = async () => p.evaluate(() => {
  const bars = [...document.querySelectorAll('.wf2 i')].slice(0, 6)
  return bars.map((b) => getComputedStyle(b).transform)
})
const f1 = await wf()
await sleep(400)
const f2 = await wf()
const moving = JSON.stringify(f1) !== JSON.stringify(f2)
console.log('waveform_animating:', moving)
console.log('pager_top:', await p.evaluate(() => { const r = document.querySelector('.pager').getBoundingClientRect(); return Math.round(r.top) + 'px (' + Math.round(r.top / 844 * 100) + '%)' }))
await b.close()
