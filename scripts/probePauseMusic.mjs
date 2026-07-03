// 验收：第一层卡1播放音乐 → 点「查看详情」进第二层 → 第一层音乐应停(is-playing 移除)，
// 同时第二层用预设文件播放(src:'file')。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const b = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage()
await p.setViewport({ width: 340, height: 736, deviceScaleFactor: 2 })
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 700))

// 1) 在第一层卡1点播放键，启动 HealPlayer
await p.evaluate(() => document.querySelector('.harc__play')?.click())
await new Promise((r) => setTimeout(r, 600))
const l1Before = await p.evaluate(() => !!document.querySelector('.card1')?.classList.contains('is-playing'))
console.log('第一层播放中(点播放后):', l1Before)

// 2) 点「查看详情」进第二层
await p.evaluate(() => [...document.querySelectorAll('button,span')].find((e) => e.textContent?.trim() === '查看详情')?.click())
await new Promise((r) => setTimeout(r, 500))
const l1After = await p.evaluate(() => !!document.querySelector('.card1')?.classList.contains('is-playing'))
console.log('第一层播放中(进第二层后):', l1After, l1After ? '✗ 没停!' : '✓ 已停')

// 3) 进沉浸屏，确认第二层播预设文件
await p.evaluate(() => document.querySelector('.l2card')?.click())
await new Promise((r) => setTimeout(r, 2600))
const l2 = await p.evaluate(() => {
  const m = document.querySelector('.l2').__music
  const a = m.audio
  return { src: m.state.src, file: a ? a.src.split('/').pop() : null, paused: a ? a.paused : null, dur: a ? Math.round(a.duration || 0) : null }
})
console.log('第二层音乐:', JSON.stringify(l2))
await b.close()
