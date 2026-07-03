// 验证：月亮歌声波(GSAP)真在动 + 哼唱上滑取消 + 爱心可反复切换。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 340, height: 736, deviceScaleFactor: 3 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))

// 进入沉浸屏
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button,span')].find((e) => e.textContent?.trim() === '查看详情')
  b?.click()
})
await new Promise((r) => setTimeout(r, 500))
await page.evaluate(() => document.querySelector('.l2card')?.click())
await new Promise((r) => setTimeout(r, 800))

// 采样歌声波的 transform/opacity 两帧，确认在动
async function ringSample() {
  return page.evaluate(() =>
    [...document.querySelectorAll('.imm__ring')].map((r) => {
      const cs = getComputedStyle(r)
      return { t: cs.transform, o: +(+cs.opacity).toFixed(2) }
    }),
  )
}
const s1 = await ringSample()
await new Promise((r) => setTimeout(r, 700))
const s2 = await ringSample()
const ringsMoving = JSON.stringify(s1) !== JSON.stringify(s2)
console.log('RINGS moving=' + ringsMoving)
console.log('  f1=' + JSON.stringify(s1))
console.log('  f2=' + JSON.stringify(s2))

// 爱心：连点两次应 on→off
async function heartState() {
  return page.evaluate(() => document.querySelector('.cbtn--heart')?.classList.contains('is-on'))
}
await page.evaluate(() => document.querySelector('.cbtn--heart')?.click())
const h1 = await heartState()
await page.evaluate(() => document.querySelector('.cbtn--heart')?.click())
const h2 = await heartState()
console.log('HEART tap1=' + h1 + ' tap2=' + h2 + ' (期望 true,false)')

// 暂停：点 play → 月亮进入 paused 态 + 波停
await page.evaluate(() => document.querySelector('.cbtn--play')?.click())
await new Promise((r) => setTimeout(r, 200))
const paused = await page.evaluate(() => document.querySelector('.l2')?.classList.contains('l2--paused'))
console.log('PAUSED class=' + paused + ' (期望 true)')
await page.evaluate(() => document.querySelector('.cbtn--play')?.click()) // 恢复播放

// 哼唱：打开抽屉，模拟 按住→上滑→松开 = 取消
await page.evaluate(() => document.querySelector('.imm__tune')?.click())
await new Promise((r) => setTimeout(r, 400))
const humBox = await page.evaluate(() => {
  const b = document.querySelector('.drawer__hum')
  const r = b.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
})
// 按住
await page.mouse.move(humBox.x, humBox.y)
await page.mouse.down()
await new Promise((r) => setTimeout(r, 150))
const humHold = await page.evaluate(() => document.querySelector('.drawer__humtx')?.textContent)
// 上滑 80px 到取消区
await page.mouse.move(humBox.x, humBox.y - 80, { steps: 6 })
await new Promise((r) => setTimeout(r, 120))
const humCancelZone = await page.evaluate(() => ({
  cls: document.querySelector('.drawer__hum')?.classList.contains('is-cancel'),
  tx: document.querySelector('.drawer__humtx')?.textContent,
}))
await page.mouse.up()
await new Promise((r) => setTimeout(r, 150))
const humAfter = await page.evaluate(() => document.querySelector('.drawer__humtx')?.textContent)
console.log('HUM hold="' + humHold + '"')
console.log('HUM cancelZone=' + JSON.stringify(humCancelZone))
console.log('HUM afterRelease="' + humAfter + '"')

await browser.close()
