import puppeteer from 'puppeteer-core'
const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const BASE = process.argv[2] || 'http://localhost:4173/'
const b = await puppeteer.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox'] })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
await p.goto(BASE, { waitUntil: 'networkidle0' })
await p.waitForSelector('.card1')
await new Promise((r) => setTimeout(r, 500))
const r = await p.evaluate(() => {
  const has = (s) => !!document.querySelector(s)
  const rect = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), t: Math.round(b.top) } }
  const titleEl = document.querySelector('.c-title')
  // 标题是否换行：scrollHeight 约等于单行高度即未换行
  const titleWrapped = titleEl ? titleEl.scrollHeight > titleEl.clientHeight + 4 : null
  const cs = (s, p) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[p] : null }
  return {
    combo_merged: has('.combo .grid4') && has('.combo .nowplay'),
    quote_block: has('.quote .quote__q'),
    peers_layout: has('.peer .peer__l') && has('.peer .ptw'),
    peer_thumbs: document.querySelectorAll('.ptw').length,
    actionbar: has('.actbar__btns') && [...document.querySelectorAll('.actbar__btn')].map(b=>b.textContent),
    actionbar_up: document.querySelector('.actbar__up')?.textContent?.trim(),
    tabbar_present: has('.tabbar'),
    title_text: titleEl?.textContent,
    title_fontSize: cs('.c-title', 'fontSize'),
    title_whiteSpace: cs('.c-title', 'whiteSpace'),
    title_wrapped: titleWrapped,
    title_rect: rect('.c-title'),
    actbar_rect: rect('.actbar'),
    tab_rect: rect('.tabbar'),
    pager_rect: rect('.pager'),
    emoji_left: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(document.body.innerText),
  }
})
console.log(JSON.stringify(r, null, 2))
await b.close()
