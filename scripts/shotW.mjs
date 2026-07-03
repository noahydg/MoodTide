// 在指定真机宽度下整屏截图。用法: node scripts/shotW.mjs <url> <out> <width>
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const out = process.argv[3] || '/tmp/shotw.png'
const w = parseInt(process.argv[4] || '340', 10)
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: w, height: Math.round((w * 844) / 390), deviceScaleFactor: 3 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 900))
await page.screenshot({ path: out })
console.log('SAVED ' + out + ' @' + w + 'px')
await browser.close()
