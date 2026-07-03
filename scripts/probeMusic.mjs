// 验收程序化音乐：进沉浸屏→引擎运行且排出音符；微调换调式;拍海/滑杆改 BPM;暂停停。
// 注：headless Chrome 默认静音设备，但 AudioContext 仍会 running 并调度音符(notes 计数)，
// 故用 __music.state 验证"在生成/速度在变/暂停停"，而非真去录声音。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const b = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage()
await p.setViewport({ width: 340, height: 736, deviceScaleFactor: 2 })
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))

const st = () => p.evaluate(() => document.querySelector('.l2')?.__music?.state ?? null)

// 进第二层 → 点第1张卡进沉浸屏（深夜·F小调·~54bpm）
await p.evaluate(() => [...document.querySelectorAll('button,span')].find((e) => e.textContent?.trim() === '查看详情')?.click())
await new Promise((r) => setTimeout(r, 400))
await p.evaluate(() => document.querySelector('.l2card')?.click())
await new Promise((r) => setTimeout(r, 1600)) // 让调度器排几小节
console.log('ENTER ', JSON.stringify(await st()))

// 微调「更暖一点」(index 1) → 应换 preset/速度
await p.evaluate(() => document.querySelector('.imm__tune')?.click())
await new Promise((r) => setTimeout(r, 300))
await p.evaluate(() => document.querySelectorAll('.chip')[1]?.click())
await new Promise((r) => setTimeout(r, 600))
console.log('TONE+ ', JSON.stringify(await st()))

// 速度滑杆拉到 100 → BPM 应升到 ~140
await p.evaluate(() => { const r = document.querySelector('.drawer__range'); r.value = '100'; r.dispatchEvent(new Event('input', { bubbles: true })) })
await new Promise((r) => setTimeout(r, 300))
console.log('TEMPO ', JSON.stringify(await st()))

// 关抽屉，拍海 4 下 → BPM 跟随拍速
await p.evaluate(() => document.querySelector('.drawer__grip')?.click())
await new Promise((r) => setTimeout(r, 300))
const box = await p.evaluate(() => { const r = document.querySelector('.imm__sea').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.55 } })
for (let i = 0; i < 4; i++) { await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.mouse.up(); await new Promise((r) => setTimeout(r, 280)) }
await new Promise((r) => setTimeout(r, 200))
console.log('TAP   ', JSON.stringify(await st()))

// 暂停 → playing:false
await p.evaluate(() => document.querySelector('.cbtn--play')?.click())
await new Promise((r) => setTimeout(r, 300))
console.log('PAUSE ', JSON.stringify(await st()))

// 切到「心潮」tab → 引擎应 stop（playing:false, ctx 仍在但不排音）
await p.evaluate(() => [...document.querySelectorAll('.l2nav__b')].find((x) => x.dataset.t === 'diary')?.click())
await new Promise((r) => setTimeout(r, 400))
console.log('LEAVE ', JSON.stringify(await st()))

await b.close()
