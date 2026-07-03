// 检查 4 张卡在「下半部内容区」里是否溢出（scrollHeight > clientHeight）
import puppeteer from 'puppeteer-core'
const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const b = await puppeteer.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox'] })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await p.waitForSelector('.card1')
await new Promise((r) => setTimeout(r, 400))
const r = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('.card')]
  return cards.map((c) => ({
    cls: c.className.split(' ')[1],
    overflow: c.scrollHeight - c.clientHeight, // >4 表示溢出（需要滚动）
    h: c.clientHeight,
  }))
})
console.log(JSON.stringify(r, null, 2))
await b.close()
