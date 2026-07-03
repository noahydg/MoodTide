import puppeteer from 'puppeteer-core'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const b = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage()
await p.setViewport({ width: 340, height: 736, deviceScaleFactor: 2 })
const net = []
p.on('response', r => { if (r.url().includes('/music/')) net.push(r.status()+' '+r.url().split('/').pop()) })
p.on('requestfailed', r => { if (r.url().includes('/music/')) net.push('FAIL '+r.url().split('/').pop()) })
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle0' })
await new Promise(r=>setTimeout(r,500))
for (const idx of [0,1,3]) {
  await p.evaluate(()=>[...document.querySelectorAll('button,span')].find(e=>e.textContent?.trim()==='查看详情')?.click())
  await new Promise(r=>setTimeout(r,400))
  await p.evaluate((i)=>document.querySelectorAll('.l2card')[i]?.click(), idx)
  await new Promise(r=>setTimeout(r,2600))
  const info = await p.evaluate(()=>{ const m=document.querySelector('.l2').__music; const a=m.audio; return { src:m.state.src, file:a?a.src.split('/').pop():null, ready:a?a.readyState:null, dur:a?Math.round(a.duration||0):null, ct:a?+a.currentTime.toFixed(1):null, paused:a?a.paused:null } })
  console.log(`心境${idx} ->`, JSON.stringify(info))
  await p.evaluate(()=>document.querySelector('.imm__back')?.click())
  await new Promise(r=>setTimeout(r,500))
}
console.log('网络:', net.length?net:'⚠️ 没有任何 /music/ 请求')
await b.close()
