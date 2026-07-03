// 验收：心潮日记(顶端心潮路径) + 我的(头部不换行) + 二级子页(音乐治疗/设置)。
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
if (!existsSync(exe)) { console.error('NO_CHROME'); process.exit(2) }
const url = process.argv[2] || 'http://localhost:4173/'
const browser = await puppeteer.launch({ executablePath: exe, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 340, height: 736, deviceScaleFactor: 3 })
await page.goto(url, { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))
await page.evaluate(() => [...document.querySelectorAll('button,span')].find((e) => e.textContent?.trim() === '查看详情')?.click())
await new Promise((r) => setTimeout(r, 400))

// 心潮日记
await page.evaluate(() => [...document.querySelectorAll('.l2nav__b')].find((b) => b.dataset.t === 'diary')?.click())
await new Promise((r) => setTimeout(r, 1800)) // 等路径画完
const diary = await page.evaluate(() => ({
  hasPath: !!document.querySelector('.tp__svg'),
  hasLine: !!document.querySelector('.tp__line'),
  nodes: document.querySelectorAll('.tp__node').length,
  day: document.querySelector('.tp__day')?.textContent,
  pct: document.querySelector('.tp__pct')?.textContent,
  entries: document.querySelectorAll('.dentry').length,
}))
await page.screenshot({ path: '/tmp/v2_diary.png' })
console.log('DIARY ' + JSON.stringify(diary))

// 我的：检查头部是否换行
await page.evaluate(() => [...document.querySelectorAll('.l2nav__b')].find((b) => b.dataset.t === 'me')?.click())
await new Promise((r) => setTimeout(r, 700))
const me = await page.evaluate(() => {
  const badge = document.querySelector('.l2me__badge')
  const lh = badge ? parseFloat(getComputedStyle(badge).lineHeight) : 0
  return {
    nmWrapped: (() => { const e = document.querySelector('.l2me__nm'); return e ? e.scrollHeight > e.clientHeight + 3 : null })(),
    badge: badge?.textContent,
    badgeWrapped: badge ? badge.scrollHeight > lh + 4 : null,
    items: document.querySelectorAll('.l2mi').length,
  }
})
await page.screenshot({ path: '/tmp/v2_me.png' })
console.log('ME ' + JSON.stringify(me))

// 二级子页：音乐治疗
await page.evaluate(() => document.querySelector('.l2mi[data-m="heal"]')?.click())
await new Promise((r) => setTimeout(r, 700))
const sheetHeal = await page.evaluate(() => ({
  open: document.querySelector('.sheet')?.classList.contains('is-open'),
  title: document.querySelector('.sheet__title')?.textContent,
  courses: document.querySelectorAll('.course').length,
  cred: !!document.querySelector('.sh__card--cred'),
}))
await page.screenshot({ path: '/tmp/v2_heal.png' })
console.log('HEAL ' + JSON.stringify(sheetHeal))

// 返回 → 设置
await page.evaluate(() => document.querySelector('.sheet__back')?.click())
await new Promise((r) => setTimeout(r, 450))
await page.evaluate(() => document.querySelector('.l2mi[data-m="set"]')?.click())
await new Promise((r) => setTimeout(r, 600))
const sheetSet = await page.evaluate(() => ({
  title: document.querySelector('.sheet__title')?.textContent,
  switches: document.querySelectorAll('.swc__sw').length,
  rows: document.querySelectorAll('.setrow').length,
}))
await page.screenshot({ path: '/tmp/v2_set.png' })
console.log('SET ' + JSON.stringify(sheetSet))

// 心潮地图
await page.evaluate(() => document.querySelector('.sheet__back')?.click())
await new Promise((r) => setTimeout(r, 450))
await page.evaluate(() => document.querySelector('.l2mi[data-m="map"]')?.click())
await new Promise((r) => setTimeout(r, 600))
await page.screenshot({ path: '/tmp/v2_map.png' })
console.log('MAP ' + JSON.stringify(await page.evaluate(() => ({ cols: document.querySelectorAll('.mapcol').length }))))

await browser.close()
console.log('SAVED /tmp/v2_diary.png /tmp/v2_me.png /tmp/v2_heal.png /tmp/v2_set.png /tmp/v2_map.png')
