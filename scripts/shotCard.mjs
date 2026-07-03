// 横滑到第 N 张卡并整屏截图。用法: node scripts/shotCard.mjs <url> <index 0..3> <out> <width>
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const idx = parseInt(process.argv[3] || '2', 10)
const out = process.argv[4] || '/tmp/card.png'
const w = parseInt(process.argv[5] || '340', 10)
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: w, height: Math.round((w * 844) / 390), deviceScaleFactor: 3 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))
await page.evaluate((idx) => {
  const track = document.querySelector('.pager__track')
  track.scrollTo({ left: track.clientWidth * idx, behavior: 'instant' })
}, idx)
await new Promise((r) => setTimeout(r, 700))
await page.screenshot({ path: out })
console.log('SAVED ' + out + ' card#' + idx)
await browser.close()
