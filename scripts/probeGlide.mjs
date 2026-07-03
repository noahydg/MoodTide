// 验证 BPM 不再"突然跳"：拍几下后连续采样显示的数字，应平滑过渡（相邻帧差小）+ 字号恒定。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const b = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const p = await b.newPage()
await p.setViewport({ width: 340, height: 736, deviceScaleFactor: 2 })
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))
await p.evaluate(() => [...document.querySelectorAll('button,span')].find((e) => e.textContent?.trim() === '查看详情')?.click())
await new Promise((r) => setTimeout(r, 400))
await p.evaluate(() => document.querySelector('.l2card')?.click())
await new Promise((r) => setTimeout(r, 600))

const box = await p.evaluate(() => { const r = document.querySelector('.imm__sea').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.55 } })

// 第1、2拍：应不显示数字（只提示"正在听"）
async function tap() { await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.mouse.up() }
async function read() { return p.evaluate(() => ({ n: document.querySelector('.imm__bpm-n')?.textContent, fs: getComputedStyle(document.querySelector('.imm__bpm-n')).fontSize, hasBpm: document.querySelector('.imm__beat')?.classList.contains('has-bpm') })) }

await tap(); await new Promise(r=>setTimeout(r,150))
console.log('after tap1', JSON.stringify(await read()))
await tap(); await new Promise(r=>setTimeout(r,150))
console.log('after tap2', JSON.stringify(await read()))
await tap(); // 第3拍：开始显示并滑动
// 连续采样 8 帧看是否平滑滑动
const frames = []
for (let i = 0; i < 8; i++) { await new Promise(r=>setTimeout(r,70)); frames.push((await read()).n) }
console.log('glide frames (tap3):', JSON.stringify(frames))

// 再快拍两下，看数字是滑过去还是瞬跳
await tap(); await new Promise(r=>setTimeout(r,250)); await tap()
const f2 = []
for (let i = 0; i < 8; i++) { await new Promise(r=>setTimeout(r,60)); f2.push((await read()).n) }
console.log('glide frames (more taps):', JSON.stringify(f2))
console.log('final', JSON.stringify(await read()))

await p.screenshot({ path: '/tmp/glide.png' })
await b.close()
console.log('SAVED /tmp/glide.png')
