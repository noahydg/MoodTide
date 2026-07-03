/**
 * 第四卡 · 海潮日记 —— 失恋恢复时间轴（专精后的「深度」所在）。
 * 把每天收下的「潮」连成一条线：从第 1 天的崩溃，到今天的好一点——潮一天比一天亮。
 * 把「走出来」这件事可视化，呼应原规划的音乐治疗愿景。
 * 本步用示例数据展示视觉；后续接潮汐瓶真实记录 + 大模型情绪分析。
 */
import { recoveryDay, recoveryProgress, CYCLE_DAYS } from '../store/recovery'
import { icon } from '../ui/icons'
import type { PageCard } from './types'

interface Entry {
  day: string
  mood: string
  color: string // 越往后越亮 = 越走出来
  wave: string // mini SVG path：越往后起伏越舒展
  kept: string
}

const WAVES = [
  'M0,12 C5,11 10,13 16,12 C22,11 27,13 32,12', // 几乎平 = 沉在谷底
  'M0,10 C6,7 10,12 16,9 C22,6 27,11 32,9', // 缓缓起伏
  'M0,9 C6,3 10,12 16,7 C22,2 27,11 32,6', // 舒展明亮 = 缓过来了
]

export function card4Diary(onMore?: () => void): PageCard {
  const day = recoveryDay()
  const pct = Math.round(recoveryProgress() * 100)
  const totalKept = 5 // 已收下的总段数（示例）
  // 只展示「第1天崩溃」与「今天好多了」首尾两条 —— 对比最强；其余进第二层看
  const entries: Entry[] = [
    { day: '第 1 天', mood: '崩溃 · 几乎没睡', color: '#5d6b82', wave: WAVES[0], kept: '收下了《假装没事》' },
    { day: `第 ${day} 天 · 今天`, mood: '想念 · 但好多了', color: '#7fd6e8', wave: WAVES[2], kept: '今天的潮，比第一天亮了' },
  ]

  const el = document.createElement('div')
  el.className = 'card card4'
  el.innerHTML = `
    <div class="c-head">
      <h1 class="c-title">海潮日记</h1>
      <span class="c-ai">${icon('book', 'ico ico--xs')}潮汐周期</span>
    </div>
    <div class="c-sig">这一段感情的潮，正一天天涨回来</div>

    <section class="glass tide">
      <div class="tide__hd">
        <div class="tide__day">陪伴你的第 <b>${day}</b> 天</div>
        <div class="tide__total">共 ${CYCLE_DAYS} 天</div>
      </div>
      <div class="tide__track">
        <div class="tide__fill" style="width:${pct}%"></div>
        <span class="tide__goal"></span>
        <span class="tide__moon" style="left:${pct}%"></span>
      </div>
      <div class="tide__marks"><span>落潮</span><span>满潮</span></div>
    </section>

    <div class="c-label">从那天，到今天</div>
    <section class="glass diary">
      <div class="tl">
        ${entries
          .map(
            (e, i) => `
          <div class="tl__item${i === entries.length - 1 ? ' is-now' : ''}">
            <div class="tl__node" style="--c:${e.color}"></div>
            <div class="tl__body">
              <div class="tl__top"><b>${e.day}</b><span class="tl__mood" style="color:${e.color}">${e.mood}</span></div>
              <div class="tl__kept">${e.kept}</div>
            </div>
          </div>`,
          )
          .join('')}
      </div>
      <button class="diary__more" type="button">
        <span>展开这 ${totalKept} 天，每一段收下的潮</span>
        ${icon('chevronRight')}
      </button>
    </section>
  `

  el.querySelector('.diary__more')!.addEventListener('click', (e) => {
    e.stopPropagation()
    onMore?.()
  })

  return { el }
}
