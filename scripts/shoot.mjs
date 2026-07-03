// 用缓存的 Chromium 给 MoodTide 截图，验收视觉。
// 用法: node scripts/shoot.mjs
import puppeteer from 'puppeteer-core'

const EXEC =
  process.env.CHROME ||
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const URL = process.env.URL || 'http://localhost:5173/'
const OUT = process.env.OUT || '/tmp/mt'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: EXEC,
  headless: true,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader'],
})
const page = await browser.newPage()
await page.setViewport({ width: 414, height: 896, deviceScaleFactor: 2 })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle0' })
await sleep(600)
await page.screenshot({ path: `${OUT}_1_gate.png` })

// 解锁进入
await page.click('#enter')
await sleep(1500)
await page.screenshot({ path: `${OUT}_2_content0.png` }) // 首张内容卡(迷你信息流)

// 滚到“此刻·心潮卡”：内容卡有 4 张，心潮卡是第 5 屏
const feedInfo = await page.evaluate(() => {
  const feed = document.getElementById('feed')
  return {
    contents: feed.querySelectorAll('.content').length,
    cards: feed.querySelectorAll('.card').length,
    h: window.innerHeight,
  }
})

// 逐屏滚动，停在第一张心潮卡（= contents 张之后）
const target = feedInfo.contents
await page.evaluate((idx) => {
  const feed = document.getElementById('feed')
  feed.scrollTo({ top: idx * window.innerHeight, behavior: 'instant' })
}, target)
await sleep(2600) // 等 GSAP 入场 + canvas 渲染若干帧
await page.screenshot({ path: `${OUT}_3_nowcard.png` })

// 模拟“刷过一张雨夜内容”后再看心潮卡的推断（滚回内容卡2再回来）
await page.evaluate(() => {
  const feed = document.getElementById('feed')
  feed.scrollTo({ top: 0, behavior: 'instant' })
})
await sleep(500)
await page.evaluate(() => {
  const feed = document.getElementById('feed')
  feed.scrollTo({ top: 2 * window.innerHeight, behavior: 'instant' }) // 第3张内容卡:凌晨改方案
})
await sleep(900)
await page.evaluate((idx) => {
  const feed = document.getElementById('feed')
  feed.scrollTo({ top: idx * window.innerHeight, behavior: 'instant' })
}, target)
await sleep(2400)
await page.screenshot({ path: `${OUT}_4_nowcard_after_browsing.png` })

// 进详情页（轻点心潮卡中部）
await page.mouse.click(207, 300)
await sleep(900)
await page.screenshot({ path: `${OUT}_5_detail.png` })

// 抓取心潮卡四件套文本，确认渲染
const probe = await page.evaluate((idx) => {
  const card = document.querySelectorAll('#feed .card')[0]
  const t = (s) => card?.querySelector(s)?.textContent?.trim() || '(空)'
  return {
    label: t('.card__label'),
    why: t('.card__why'),
    resonance: t('.card__resonance'),
    mind: t('.card__mind'),
    detailOpen: document.querySelector('.detail')?.classList.contains('is-open'),
  }
}, target)

console.log('FEED:', JSON.stringify(feedInfo))
console.log('PROBE:', JSON.stringify(probe, null, 2))
console.log('ERRORS:', errors.length ? errors : 'none')
await browser.close()
