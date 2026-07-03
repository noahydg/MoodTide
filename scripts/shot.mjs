import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const CANDIDATES = [
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
  process.env.CHROME_PATH,
].filter(Boolean)

const exe = CANDIDATES.find((p) => p && existsSync(p))
if (!exe) {
  console.error('NO_CHROME')
  process.exit(2)
}

const url = process.argv[2] || 'http://localhost:4173/'
const out = process.argv[3] || '/tmp/moodtide_card1.png'

const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 900))

// Probe the real computed style of the play button after a fresh build.
const probe = await page.evaluate(() => {
  const q = (s) => document.querySelector(s)
  const cs = (el) => (el ? getComputedStyle(el) : null)
  const hp = cs(q('.harc__play'))
  return {
    title: q('.c-title')?.textContent,
    hasHarc: !!q('.harc'),
    hasPlay: !!q('.harc__play'),
    playBg: hp ? hp.backgroundColor : null,
    playBorder: hp ? hp.border : null,
    playBackdrop: hp ? hp.backdropFilter || hp.webkitBackdropFilter : null,
    labels: [...document.querySelectorAll('.harc__lbl')].map((e) => e.textContent),
  }
})
console.log(JSON.stringify(probe))

await page.screenshot({ path: out })
await browser.close()
console.log('SAVED ' + out)
