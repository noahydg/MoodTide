/**
 * 第三卡 · 给此刻的你 —— suggestion for us to adjust our current emotion。
 * 基于推断的当下心境，给几个"把情绪往哪带"的轻建议；点一下即预览那种走向。
 */
import { readContext } from '../context/contextEngine'
import { icon } from '../ui/icons'
import type { PageCard } from './types'

interface Suggestion {
  key: string
  chip: string
  line: string
}

const SUGGESTIONS: Suggestion[] = [
  { key: 'cry', chip: '想哭一会儿', line: '那就哭吧，哭出来不丢人。这段潮会调得更轻，陪着你，不催你停。' },
  { key: 'sleep', chip: '今晚早点睡', line: '今晚先别想了，早点睡。潮会放得很慢很慢，像有人替你把灯关上。' },
  { key: 'hold', chip: '先别发消息', line: '想发的那条消息，先存成草稿吧。这段潮替你把话收着，等你不那么冲动的时候。' },
]

export function card3Suggest(): PageCard {
  const ctx = readContext()
  const opener =
    ctx.timeBand === 'night'
      ? '夜里最容易绷不住。现在的你，想先怎么办？'
      : ctx.timeBand === 'dusk'
        ? '天黑下来，情绪又上来了。现在的你，想先怎么办？'
        : '装了一天，也累了吧。现在的你，想先怎么办？'

  const el = document.createElement('div')
  el.className = 'card card3'
  el.innerHTML = `
    <div class="c-head">
      <h1 class="c-title">给此刻的你</h1>
      <span class="c-ai">${icon('bulb', 'ico ico--xs')}AI建议</span>
    </div>

    <div class="c-label">现在的你，想先怎么办</div>
    <section class="glass sug">
      <p class="sug__opener">${opener}</p>
      <div class="sug__chips">
        ${SUGGESTIONS.map((s, i) => `<button class="sug__chip${i === 0 ? ' is-on' : ''}" data-k="${s.key}">${s.chip}</button>`).join('')}
      </div>
      <p class="sug__line">${SUGGESTIONS[0].line}</p>
    </section>

    <div class="c-label">为什么这样建议</div>
    <section class="glass sug__why">
      <div class="sw__row"><span class="sw__k">此刻情境</span><span class="sw__v">${ctx.solarTerm} · ${ctx.bandLabel} · ${ctx.clock}</span></div>
      <div class="sw__row"><span class="sw__k">推断心境</span><span class="sw__v" style="color:var(--dy-cyan)">想念 · 偏低落</span></div>
      <div class="sw__row"><span class="sw__k">建议依据</span><span class="sw__v">音乐治疗·先稳情绪再引导</span></div>
    </section>

    <section class="glass sug__note">
      <span>${icon('drop')}</span>
      <p>源自音乐治疗，由医学背景团队打磨——只是轻轻一推，怎么走你说了算。</p>
    </section>
  `

  const lineEl = el.querySelector('.sug__line') as HTMLElement
  el.querySelectorAll<HTMLButtonElement>('.sug__chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      el.querySelectorAll('.sug__chip').forEach((c) => c.classList.remove('is-on'))
      chip.classList.add('is-on')
      const s = SUGGESTIONS.find((x) => x.key === chip.dataset.k)!
      lineEl.style.opacity = '0'
      window.setTimeout(() => {
        lineEl.textContent = s.line
        lineEl.style.opacity = '1'
      }, 180)
    })
  })

  return { el }
}
