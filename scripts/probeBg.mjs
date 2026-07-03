// 客观验证实拍背景渲染：采样心潮卡顶部(天空)与中部(海面)像素，
// 实拍图应有明显的明亮/彩色像素，而非纯深色渐变。
import puppeteer from 'puppeteer-core'
const EXEC = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: EXEC, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader'] })
const p = await b.newPage()
await p.setViewport({ width: 414, height: 896, deviceScaleFactor: 1 })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })
await p.click('#enter'); await sleep(700)
const n = await p.evaluate(() => document.querySelectorAll('#feed .content').length)
await p.evaluate((i) => document.getElementById('feed').scrollTo({ top: i * innerHeight, behavior: 'instant' }), n)
await sleep(2400)

// 截图后用 canvas 采样多点
const png = await p.screenshot({ encoding: 'base64' })
const probe = await p.evaluate(async (b64) => {
  const img = new Image()
  await new Promise((res) => { img.onload = res; img.src = 'data:image/png;base64,' + b64 })
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height
  const g = cv.getContext('2d'); g.drawImage(img, 0, 0)
  const at = (xf, yf) => {
    const d = g.getImageData(Math.floor(img.width * xf), Math.floor(img.height * yf), 1, 1).data
    return `rgb(${d[0]},${d[1]},${d[2]})`
  }
  // 全图亮度分布
  const all = g.getImageData(0, 0, img.width, img.height).data
  let bright = 0, total = 0
  for (let i = 0; i < all.length; i += 4 * 200) { total++; if (all[i] + all[i+1] + all[i+2] > 360) bright++ }
  return {
    sky_center: at(0.5, 0.12),
    sky_left: at(0.2, 0.2),
    sea_mid: at(0.5, 0.7),
    brightRatio: +(bright / total).toFixed(3),
    cardBgImg: getComputedStyle(document.querySelector('#feed .card .card__bg')).backgroundImage.slice(0, 60),
  }
}, png)
console.log(JSON.stringify(probe, null, 2))
await b.close()
