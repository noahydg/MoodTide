// 截取单个元素的高清裁剪图，用于细看某个组件。
// 用法: node scripts/crop.mjs <url> <selector> <out>
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }

const url = process.argv[2] || 'http://localhost:4173/'
const sel = process.argv[3] || '.combo__thumb'
const out = process.argv[4] || '/tmp/crop.png'

const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 1000))

const el = await page.$(sel)
if (!el) { console.error('NO_EL ' + sel); await browser.close(); process.exit(3) }
await el.screenshot({ path: out })
console.log('SAVED ' + out)
await browser.close()
