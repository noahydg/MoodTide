/**
 * 第一卡 · 此刻的潮 —— 1:1 对标获奖 Demo「莫干山攻略」首屏密度与排版。
 *
 * 结构（团队反馈定稿）：上方留海景视频，卡片内容沉到下半部；一屏装下、不滚动。
 *   大标题(不换行) + AI生成徽标
 *   ┌ 一张玻璃卡：四宫格(此刻/天气/节气/心境) ── 分隔 ── 左:AI文案 / 右:声波缩略图+时长
 *   此刻同潮的人（左评论(带引号) + 右可点播放小图，紧凑横排）
 * 「此刻」显示时段词(黄昏/深夜…)而非时间数字；风格融进 AI 文案，不单列标签。
 */
import { readContext } from '../context/contextEngine'
import { recoveryDay } from '../store/recovery'
import { icon } from '../ui/icons'
import type { PageCard } from './types'

// 情绪疗愈弧调性：先与你同频接住，再一点点托起透光。克制、不说教。
const AI_LINE: Record<string, string> = {
  dawn: '又一夜没睡好。这段钢琴先漫过你的累，再轻轻带你迎一点微光——不用急着好起来。',
  day: '白天强撑了一整天吧。这段先陪你沉一会儿，再悄悄涨起来透进一点光——不必逞强。',
  dusk: '天黑最容易想起谁。这段弦乐先陪你沉下去，再慢慢把你托起来。',
  night: '夜里最难熬。这段潮先陪你坐一会儿，再一点点把你往上托——你不必假装没事。',
}

interface Peer {
  name: string
  city: string
  line: string
  tint: string
}
// 同样在失恋里慢慢走出来的人（疗愈共鸣）
const PEERS: Peer[] = [
  { name: '阿野', city: '上海', line: '分手第三天，听着听着就睡着了', tint: '#3b5a76' },
  { name: '林一', city: '杭州', line: '原来不是只有我一个人，还没走出来', tint: '#5a4a7c' },
]

function peerRow(p: Peer): string {
  return `
    <div class="peer">
      <div class="peer__l">
        <div class="peer__line"><span class="peer__q">${icon('quote')}</span>${p.line}</div>
        <div class="peer__by"><span class="peer__ava">${icon('person')}</span>${p.name} · ${p.city}</div>
      </div>
      <button class="ptw" type="button" style="--t:${p.tint}" aria-label="播放 ${p.name} 的潮">
        <span class="ptw__bars">${Array.from({ length: 5 }, (_, i) => `<i style="--d:${i * 0.1}s"></i>`).join('')}</span>
        <span class="ptw__play">${icon('play')}</span>
      </button>
    </div>`
}

export function card1Now(): PageCard {
  const ctx = readContext()
  const day = recoveryDay()
  // 卡1 此刻的潮 = 深夜那首(mood0)真音乐；循环、可暂停。HealPlayer 合成已弃用。
  const player = new Audio('./music/mood0.mp3')
  player.loop = true
  player.preload = 'auto'

  const el = document.createElement('div')
  el.className = 'card card1'
  el.innerHTML = `
    <div class="c-head">
      <h1 class="c-title">此刻 · 为你涨起的潮</h1>
      <span class="c-ai">${icon('sparkle', 'ico ico--xs')}AI生成</span>
    </div>

    <section class="glass combo">
      <div class="grid4">
        <div class="g4"><label>此刻</label><b>${ctx.bandLabel}</b></div>
        <div class="g4"><label>天气</label><b>晴</b></div>
        <div class="g4"><label>节气</label><b>${ctx.solarTerm}</b></div>
        <div class="g4"><label>心境</label><b class="g4--mood">想念·偏低</b></div>
      </div>
      <div class="combo__div"></div>
      <div class="combo__body">
        <p class="combo__desc"><span class="combo__star">${icon('sparkle')}</span>${AI_LINE[ctx.timeBand] ?? AI_LINE.night}</p>
        <div class="combo__thumb">
          <div class="harc" aria-hidden="true">
            <span class="harc__wave"></span>
            <svg viewBox="0 0 100 46" preserveAspectRatio="none">
              <defs>
                <linearGradient id="hLine" x1="0" y1="1" x2="1" y2="0" gradientUnits="objectBoundingBox">
                  <stop offset="0" stop-color="#bfe0ef"/>
                  <stop offset="1" stop-color="#ffd6a0"/>
                </linearGradient>
                <linearGradient id="hFill" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                  <stop offset="0" stop-color="#bfe0ef" stop-opacity="0.4"/>
                  <stop offset="1" stop-color="#bfe0ef" stop-opacity="0.02"/>
                </linearGradient>
              </defs>
              <path d="M2,40 C18,39 30,37 46,31 C64,23 76,13 98,7 L98,46 L2,46 Z" fill="url(#hFill)"/>
              <path class="harc__line" d="M2,40 C18,39 30,37 46,31 C64,23 76,13 98,7" fill="none" stroke="url(#hLine)"/>
            </svg>
            <span class="harc__dot"></span>
            <span class="harc__lbl harc__lbl--l">落潮</span>
            <span class="harc__lbl harc__lbl--r">涨潮</span>
            <button class="harc__play" type="button" aria-label="播放/暂停此刻的潮">${icon('play')}</button>
          </div>
          <div class="combo__dur">陪伴你的第 ${day} 天</div>
        </div>
      </div>
    </section>

    <div class="c-label">同样在慢慢走出来的人</div>
    <section class="glass peers">
      ${PEERS.map(peerRow).join('')}
    </section>
  `

  // —— 弧线上的小播放/暂停标：真出声 + 全卡进入「播放中」氛围 ——
  const playBtn = el.querySelector('.harc__play') as HTMLButtonElement
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (player.paused) {
      void player.play().catch(() => {})
      el.classList.add('is-playing')
      playBtn.innerHTML = icon('pause')
    } else {
      player.pause()
      el.classList.remove('is-playing')
      playBtn.innerHTML = icon('play')
    }
  })

  // 同潮的人小图：点了切播放态视觉（示意，不抢主音轨）
  el.querySelectorAll<HTMLButtonElement>('.ptw').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const playing = btn.classList.toggle('is-playing')
      btn.querySelector('.ptw__play')!.innerHTML = playing ? icon('waveform') : icon('play')
    })
  })

  // 停掉本卡音乐 + 收起播放态（离开卡片 / 进入第二层 都调它）
  const stopAudio = () => {
    player.pause()
    player.currentTime = 0
    el.classList.remove('is-playing')
    playBtn.innerHTML = icon('play')
  }
  // 进入第二层小程序时，第一层音乐必须先停，避免两轨叠加
  window.addEventListener('mt:pause-layer1', stopAudio)

  return {
    el,
    enter() {
      el.classList.remove('is-in')
      void el.offsetWidth // 强制重排，重置入场动画
      el.classList.add('is-in')
    },
    leave() {
      stopAudio()
    },
  }
}
