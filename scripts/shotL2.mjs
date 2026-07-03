// 第二层验收：打开小程序(查看详情)→截 feed；再点第一张卡→截沉浸生成屏。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const w = parseInt(process.argv[3] || '340', 10)
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: w, height: Math.round((w * 844) / 390), deviceScaleFactor: 3 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 700))

// 打开第二层（点「查看详情」）
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.actbar__btn, button, span')].find((e) => e.textContent?.trim() === '查看详情')
  if (btn) btn.click()
})
await new Promise((r) => setTimeout(r, 800))
const probe1 = await page.evaluate(() => {
  const l2 = document.querySelector('.l2')
  return {
    open: l2?.classList.contains('is-open'),
    cards: document.querySelectorAll('.l2card').length,
    capMore: !!document.querySelector('.l2cap__more'),
    capClose: !!document.querySelector('.l2cap__close'),
    title: document.querySelector('.l2h__t')?.textContent,
  }
})
console.log('FEED ' + JSON.stringify(probe1))
await page.screenshot({ path: '/tmp/l2_feed.png' })

// 点第一张读心卡 → 沉浸生成屏
await page.evaluate(() => document.querySelector('.l2card')?.click())
await new Promise((r) => setTimeout(r, 1100))
const probe2 = await page.evaluate(() => {
  const cv = document.querySelector('.imm__water')
  return {
    immOn: document.querySelector('[data-scr="imm"]')?.classList.contains('is-on'),
    canvasPainted: cv ? cv.width > 0 && cv.height > 0 : false,
    ctx: document.querySelector('.imm__ctx')?.textContent,
    read: document.querySelector('.imm__read')?.textContent,
    navHidden: document.querySelector('.l2')?.classList.contains('l2--imm'),
  }
})
console.log('IMM ' + JSON.stringify(probe2))
await page.screenshot({ path: '/tmp/l2_imm.png' })

// 打开微调抽屉
await page.evaluate(() => document.querySelector('.imm__tune')?.click())
await new Promise((r) => setTimeout(r, 600))
await page.screenshot({ path: '/tmp/l2_drawer.png' })
console.log('DRAWER ' + JSON.stringify(await page.evaluate(() => ({ open: document.querySelector('.drawer')?.classList.contains('is-open'), chips: document.querySelectorAll('.chip').length }))))

await browser.close()
console.log('SAVED /tmp/l2_feed.png /tmp/l2_imm.png /tmp/l2_drawer.png')
