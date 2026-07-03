import puppeteer from 'puppeteer-core'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const b = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required'] })
const p = await b.newPage()
await p.setViewport({ width: 340, height: 736, deviceScaleFactor: 2 })
const net=[]
p.on('response', r => { if(r.url().includes('/music/')) net.push(r.status()+' '+r.url().split('/').pop()) })
await p.goto('http://localhost:4173/', { waitUntil:'networkidle0' })
await new Promise(r=>setTimeout(r,600))
// 1) 第一层卡1 播放键 → 应放 mood0(深夜)
await p.evaluate(()=>document.querySelector('.harc__play')?.click())
await new Promise(r=>setTimeout(r,1500))
const l1 = await p.evaluate(()=>{ const a=[...document.querySelectorAll('audio')].find(x=>x.src.includes('mood')); return a?{file:a.src.split('/').pop(),paused:a.paused}:'无audio' })
console.log('卡1音乐:', JSON.stringify(l1))
// 2) 进第二层 → 第一层应停
await p.evaluate(()=>[...document.querySelectorAll('button,span')].find(e=>e.textContent?.trim()==='查看详情')?.click())
await new Promise(r=>setTimeout(r,700))
const l1after = await p.evaluate(()=>{ const a=[...document.querySelectorAll('audio')].find(x=>x.src.includes('mood0')); return a?a.paused:'已移除' })
console.log('进第二层后卡1:', l1after===true||l1after==='已移除'?'✓已停':'✗还在响 '+l1after)
// 3) 第二层黄昏(card index1) → mood1
await p.evaluate(()=>document.querySelectorAll('.l2card')[1]?.click())
await new Promise(r=>setTimeout(r,2600))
const l2 = await p.evaluate(()=>{ const m=document.querySelector('.l2').__music; const a=m.audio; return {src:m.state.src,file:a?a.src.split('/').pop():null,dur:a?Math.round(a.duration||0):null} })
console.log('第二层黄昏:', JSON.stringify(l2))
console.log('网络:', net)
await b.close()
