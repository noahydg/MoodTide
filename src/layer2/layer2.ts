/**
 * 第二层 · MoodTide 小程序 —— 从第一层「查看详情/哼一曲/展开日记」点进来。
 *
 * 复用第一层的手机壳；浮层小程序：右上角小程序胶囊（··· ⊙），浅色油画感（海报色）。
 * 四屏：此刻 feed → 沉浸生成屏（暮色海面 + 涟漪 + 播放 + 微调抽屉）／心潮日记／我的。
 * 月亮已移除；涟漪即「乐是潮」。底部 tab：此刻 / 心潮 / 我的。
 */
import gsap from 'gsap'
import { moods, moodChips, type Mood } from './data'
import { WaterScene } from './waterScene'
import { mountTidePath, tideAdvice } from './tidePath'
import { buildTideDays, scoreColor, analyzeText, blendScore, CYCLE, type TideDay } from './tideData'
import { recoveryDay, cycleDays, setCycleDays, CYCLE_OPTIONS, resetRecovery } from '../store/recovery'
import { SeaAudio, buzz } from '../cards/seaAudio'
import { MoodMusic } from './moodMusic'

type MenuKey = 'fav' | 'map' | 'heal' | 'set'
const SHEET_TITLE: Record<MenuKey, string> = {
  fav: '我收下的曲子',
  map: '我的心潮地图',
  heal: '音乐治疗',
  set: '设置',
}

interface SavedEntry {
  day: string
  song: string
  mood: string
  color: string
  note: string
}

interface Layer2Handle {
  el: HTMLElement
  open: (entry?: { card?: number; from?: string }) => void
  close: () => void
}

export function mountLayer2(host: HTMLElement, opts: { onClose?: () => void } = {}): Layer2Handle {
  const el = document.createElement('div')
  el.className = 'l2'
  el.innerHTML = `
    <!-- 小程序胶囊（右上角 ··· ⊙），点 ⊙ 关闭回第一层 -->
    <div class="l2cap">
      <button class="l2cap__more" aria-label="更多"><i></i><i></i><i></i></button>
      <span class="l2cap__div"></span>
      <button class="l2cap__close" aria-label="关闭小程序，返回"><span class="l2cap__ring"></span></button>
    </div>

    <!-- ===== 此刻 feed ===== -->
    <section class="l2scr is-on" data-scr="feed">
      <div class="l2scroll">
        <div class="l2h">
          <div class="l2h__t">此刻</div>
          <div class="l2h__s">读心卡 · 为你此刻而生，点开就响</div>
        </div>
        <div class="l2feed"></div>
      </div>
    </section>

    <!-- ===== 沉浸生成屏 ===== -->
    <section class="l2scr" data-scr="imm">
      <div class="imm">
        <div class="imm__swirl"></div>
        <button class="imm__back" aria-label="返回此刻">‹</button>
        <div class="imm__top">
          <div class="imm__ctx"></div>
          <div class="imm__read"></div>
          <div class="imm__tide">
            <span class="imm__forme">为你此刻而生</span>
            <span class="imm__arr"></span>
          </div>
        </div>
        <div class="imm__sea">
          <canvas class="imm__water"></canvas>
          <div class="imm__beat">
            <div class="imm__bpm"><span class="imm__bpm-ic">${wave()}</span><b class="imm__bpm-n"></b><span class="imm__bpm-u">BPM</span></div>
            <div class="imm__bpm-sub">轻点海面 · 把此刻的节奏拍给这首歌</div>
          </div>
        </div>
        <div class="imm__controls">
          <div class="imm__regen">正在为你重新生成…</div>
          <div class="imm__row">
            <button class="cbtn cbtn--heart" aria-label="收下">${heart()}</button>
            <button class="cbtn cbtn--play" aria-label="播放/暂停">${pause()}</button>
            <button class="cbtn cbtn--share" aria-label="分享">${share()}</button>
          </div>
          <button class="imm__tune">${spark()} 微调这一刻</button>
        </div>

        <!-- 微调抽屉 -->
        <div class="drawer">
          <div class="drawer__grip"></div>
          <h4 class="drawer__h">情绪走向</h4>
          <div class="drawer__chips"></div>
          <div class="drawer__slabel"><span>慢</span><span>速度</span><span>快</span></div>
          <input class="drawer__range" type="range" min="0" max="100" value="40" />
          <button class="drawer__hum">
            <span class="drawer__humic">${wave()}</span>
            <span class="drawer__humtx">按住 · 哼一段，让旋律跟着你</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ===== 心潮日记 ===== -->
    <section class="l2scr" data-scr="diary">
      <div class="l2scroll">
        <div class="l2h">
          <div class="l2h__t">心潮日记</div>
          <div class="l2h__s">这些天，你的心潮正一点点涨回来</div>
        </div>
        <!-- 顶端：心潮路径（每日心情分折线，可悬停/点选每个点） -->
        <div class="tp">
          <div class="tp__head">
            <div class="tp__title">心潮路径</div>
            <div class="tp__sub">第 <b class="tp__day">1</b> / <span class="tp__total">14</span> 天 · <span class="tp__pct">0%</span></div>
          </div>
          <div class="tp__chart"></div>
          <div class="tp__cap">点一个点，看看那天的你 · 每天可记录 1–100 分</div>
        </div>

        <!-- 此刻建议（读趋势给一句引导）+ 三项洞察 -->
        <div class="tadv">
          <span class="tadv__ic">${spark()}</span>
          <div class="tadv__tx"><b class="tadv__t"></b><p class="tadv__b"></p></div>
        </div>
        <div class="tins"></div>

        <button class="trec">${penIcon()} 记录今天的心情</button>

        <div class="l2diary"></div>
      </div>
    </section>

    <!-- 记录今天：自评分 + 写字 → 大模型解析 → 综合分 -->
    <div class="rec">
      <div class="rec__panel">
        <div class="rec__grip"></div>
        <h4 class="rec__h">今天，心潮几分？</h4>
        <div class="rec__scorebar"><b class="rec__score">50</b><span>/ 100</span></div>
        <input class="rec__range" type="range" min="1" max="100" value="50" />
        <div class="rec__scale"><span>落潮</span><span>满潮</span></div>
        <textarea class="rec__text" rows="3" placeholder="想写点什么吗？哪怕一句也好——交给我来读懂。"></textarea>
        <div class="rec__ai"><span class="rec__ai-ic">${spark()}</span><span class="rec__ai-tx">写下后，我会读出今天的情绪，和你的打分合在一起。</span></div>
        <div class="rec__btns">
          <button class="rec__cancel">先不写</button>
          <button class="rec__save">收下今天</button>
        </div>
      </div>
    </div>

    <!-- 某一天的详情卡 -->
    <div class="dnd">
      <div class="dnd__panel">
        <div class="dnd__grip"></div>
        <div class="dnd__day"></div>
        <div class="dnd__score"><b class="dnd__num">0</b><span>心情分</span><span class="dnd__mood"></span></div>
        <div class="dnd__bar"><span class="dnd__fill"></span></div>
        <div class="dnd__song"></div>
        <div class="dnd__note"></div>
        <div class="dnd__ai"></div>
        <button class="dnd__close">好</button>
      </div>
    </div>

    <!-- ===== 我的 ===== -->
    <section class="l2scr" data-scr="me">
      <div class="l2scroll">
        <div class="l2me__head">
          <div class="l2av"></div>
          <div class="l2me__id">
            <div class="l2me__nm">直挂云帆</div>
            <div class="l2me__sb">Cloudward Sail</div>
            <div class="l2me__badge">慢慢走出来 · 第 <b class="l2me__day">1</b> 天</div>
          </div>
        </div>
        <div class="l2stats">
          <div class="l2stat"><b class="l2stat__save">0</b><span>收下的潮</span></div>
          <div class="l2stat"><b class="l2stat__day2">1</b><span>陪伴天数</span></div>
          <div class="l2stat"><b>5.2</b><span>聆听·小时</span></div>
        </div>
        <div class="l2mlist">
          <button class="l2mi" data-m="fav"><span class="l2mi__ic">${heart()}</span><span class="l2mi__tx">我收下的曲子</span><span class="l2mi__ar">›</span></button>
          <button class="l2mi" data-m="map"><span class="l2mi__ic">${icWave()}</span><span class="l2mi__tx">我的心潮地图</span><span class="l2mi__ar">›</span></button>
          <button class="l2mi" data-m="heal"><span class="l2mi__ic">${spark()}</span><span class="l2mi__tx">音乐治疗</span><span class="l2mi__beta">拓展</span><span class="l2mi__ar">›</span></button>
          <button class="l2mi" data-m="set"><span class="l2mi__ic">${gear()}</span><span class="l2mi__tx">设置</span><span class="l2mi__ar">›</span></button>
        </div>
        <div class="l2me__foot">心是月，乐是潮 · 你不必开口</div>
      </div>
    </section>

    <!-- ===== 二级子页（从「我的」菜单滑出） ===== -->
    <div class="sheet">
      <div class="sheet__bar">
        <button class="sheet__back" aria-label="返回">‹</button>
        <div class="sheet__title"></div>
        <span class="sheet__sp"></span>
      </div>
      <div class="sheet__body"></div>
    </div>

    <!-- ===== 底部 tab ===== -->
    <nav class="l2nav">
      <button class="l2nav__b is-on" data-t="feed">${icMoon()}<span>此刻</span></button>
      <button class="l2nav__b" data-t="diary">${icWave()}<span>心潮</span></button>
      <button class="l2nav__b" data-t="me">${icDot()}<span>我的</span></button>
    </nav>

    <div class="l2toast"></div>
  `

  // —— refs ——
  const scrs = {
    feed: el.querySelector('[data-scr="feed"]') as HTMLElement,
    imm: el.querySelector('[data-scr="imm"]') as HTMLElement,
    diary: el.querySelector('[data-scr="diary"]') as HTMLElement,
    me: el.querySelector('[data-scr="me"]') as HTMLElement,
  }
  const feedEl = el.querySelector('.l2feed') as HTMLElement
  const immCtx = el.querySelector('.imm__ctx') as HTMLElement
  const immRead = el.querySelector('.imm__read') as HTMLElement
  const immArr = el.querySelector('.imm__arr') as HTMLElement
  const sea = el.querySelector('.imm__sea') as HTMLElement
  const canvas = el.querySelector('.imm__water') as HTMLCanvasElement
  const beat = el.querySelector('.imm__beat') as HTMLElement
  const bpmN = el.querySelector('.imm__bpm-n') as HTMLElement
  const bpmSub = el.querySelector('.imm__bpm-sub') as HTMLElement
  const playBtn = el.querySelector('.cbtn--play') as HTMLButtonElement
  const heartBtn = el.querySelector('.cbtn--heart') as HTMLButtonElement
  const regen = el.querySelector('.imm__regen') as HTMLElement
  const drawer = el.querySelector('.drawer') as HTMLElement
  const chipsEl = el.querySelector('.drawer__chips') as HTMLElement
  const tuneBtn = el.querySelector('.imm__tune') as HTMLButtonElement
  const humBtn = el.querySelector('.drawer__hum') as HTMLButtonElement
  const humTx = el.querySelector('.drawer__humtx') as HTMLElement
  const humIc = el.querySelector('.drawer__humic') as HTMLElement
  const tempo = el.querySelector('.drawer__range') as HTMLInputElement
  const toastEl = el.querySelector('.l2toast') as HTMLElement
  const diaryEl = el.querySelector('.l2diary') as HTMLElement
  const meSave = el.querySelector('.l2stat__save') as HTMLElement
  const meDay = el.querySelector('.l2stat__day2') as HTMLElement

  const water = new WaterScene(canvas, sea)
  const seaAudio = new SeaAudio()
  const music = new MoodMusic() // 程序化实时音乐（零延迟、零体积）
  ;(el as unknown as { __music: MoodMusic }).__music = music // 验收探针用
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // 拍打节奏：平滑显示的 BPM —— 用 GSAP 让数字滑动着变化，避免每拍突然跳一下
  let seaTaps = 0
  let dispBpm = 0
  let bpmTween: ReturnType<typeof gsap.to> | null = null
  function glideBpm(target: number) {
    if (reduceMotion) {
      dispBpm = target
      bpmN.textContent = String(target)
      return
    }
    bpmTween?.kill()
    const obj = { v: dispBpm || target }
    dispBpm = target
    bpmTween = gsap.to(obj, {
      v: target,
      duration: 0.55,
      ease: 'power2.out',
      onUpdate: () => {
        bpmN.textContent = String(Math.round(obj.v))
      },
    })
  }
  function resetBeat() {
    seaTaps = 0
    dispBpm = 0
    bpmTween?.kill()
    bpmTween = null
    beat.classList.remove('is-live', 'has-bpm')
    bpmN.textContent = ''
    bpmSub.textContent = '轻点海面 · 把此刻的节奏拍给这首歌'
  }

  // —— state ——
  const state = { current: 0, playing: true, collected: false, chip: -1, saved: [] as SavedEntry[] }
  let cur: Mood = { ...moods[0] }
  let lastSaved: SavedEntry | null = null

  // —— feed ——
  feedEl.innerHTML = moods
    .map(
      (m, i) => `
      <button class="l2card" data-i="${i}" style="--accent:${m.accent}">
        <div class="l2card__ctx"><i></i>${m.ctx}</div>
        <div class="l2card__wave">${waveSVG(m.wave, m.amp)}</div>
        <div class="l2card__read">${m.read}</div>
        <div class="l2card__foot">
          <span class="l2card__tide">${m.arr.split(' · ').slice(0, 2).join(' · ')}</span>
          <span class="l2card__go">点开就响 →</span>
        </div>
      </button>`,
    )
    .join('')
  feedEl.querySelectorAll<HTMLButtonElement>('.l2card').forEach((c) => {
    c.addEventListener('click', () => openImm(Number(c.dataset.i)))
  })

  // —— immersive ——
  function hexA(hex: string, a: number) {
    const n = parseInt(hex.slice(1), 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
  }
  function applyMood(m: Mood) {
    el.style.setProperty('--accent', m.accent)
    el.style.setProperty('--wave', m.wave)
    // 沉浸屏顶部辉光随情绪着色
    el.style.setProperty('--swirl', hexA(m.accent, 0.34))
    water.setMood(m)
  }
  function setArr(text: string) {
    if (immArr.textContent === text) return
    immArr.style.opacity = '0'
    window.setTimeout(() => {
      immArr.textContent = text
      immArr.style.opacity = '1'
    }, 220)
  }
  function openImm(i: number) {
    state.current = i
    state.collected = false
    state.chip = -1
    cur = { ...moods[i] }
    immCtx.textContent = cur.ctx
    immRead.innerHTML = cur.read
    setArr(cur.arr)
    heartBtn.classList.remove('is-on')
    heartBtn.innerHTML = heart()
    seaAudio.reset()
    resetBeat()
    showScreen('imm')
    setNav(null)
    state.playing = true
    playBtn.innerHTML = pause()
    applyMood(cur)
    water.setPlaying(true)
    renderChips()
    requestAnimationFrame(() => {
      water.start()
      music.start(i) // 这首歌当场为此心境生成（零延迟）
    })
  }

  // 拍打海面：水滴音 + 震动 + 涟漪 + 实时 BPM/强度（与第一层「把它拍进海里」同款手感）
  let lastSeaTap = 0
  sea.addEventListener('pointerdown', (e) => {
    const rect = sea.getBoundingClientRect()
    const now = performance.now()
    const fast = now - lastSeaTap < 420
    lastSeaTap = now
    const strength = fast ? 1.7 : 1
    water.tap(e.clientX - rect.left, e.clientY - rect.top, strength)
    seaAudio.tap() // 水滴音 + 记节奏
    buzz(fast ? 22 : 14) // 安卓震动
    seaTaps++
    beat.classList.add('is-live')
    const bpm = seaAudio.bpm()
    // 前两拍不显示数字（样本太少会乱跳），先给「正在听」的提示
    if (bpm && seaTaps >= 3) {
      beat.classList.add('has-bpm')
      glideBpm(bpm) // 数字平滑滑动到新值，而非突然跳
      bpmSub.textContent =
        bpm > 110 ? '很用力 · 把情绪都拍出来' : bpm > 75 ? '一下一下 · 慢慢松开' : '轻轻的 · 像在叹气'
      cur.dur = +Math.max(3, Math.min(9, 9 - (bpm - 60) / 18)).toFixed(1)
      cur.amp = +Math.max(0.7, Math.min(1.6, bpm / 90)).toFixed(2)
      applyMood(cur)
      music.setBpm(bpm) // 你拍的节奏 → 这首歌的速度（不同频率实时生效）
      showRegen()
    } else {
      bpmSub.textContent = '正在听你的节奏 · 再拍几下'
    }
    // 只让图标轻轻弹一下（不再整块缩放），克制、不晃
    if (!reduceMotion) {
      const ic = beat.querySelector('.imm__bpm-ic') as HTMLElement | null
      ic?.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], {
        duration: 260,
        easing: 'cubic-bezier(0.34,1.56,0.64,1)',
      })
    }
  })

  playBtn.addEventListener('click', () => {
    state.playing = !state.playing
    playBtn.innerHTML = state.playing ? pause() : play()
    water.setPlaying(state.playing)
    if (state.playing) {
      water.resume()
      music.start()
    } else {
      water.pause()
      music.pause()
    }
  })

  // 爱心可反复收下/取消，并同步进心潮日记 + 我的计数
  heartBtn.addEventListener('click', () => {
    state.collected = !state.collected
    heartBtn.classList.toggle('is-on', state.collected)
    heartBtn.innerHTML = state.collected ? heartFull() : heart()
    if (state.collected) {
      lastSaved = {
        day: '今天 · 刚刚',
        song: readToTitle(cur.read),
        mood: cur.ctx,
        color: cur.accent,
        note: '',
      }
      state.saved.unshift(lastSaved)
      toast('已收进心潮日记')
    } else {
      if (lastSaved) state.saved = state.saved.filter((e) => e !== lastSaved)
      lastSaved = null
      toast('已从心潮日记移出')
    }
    refreshCounts()
  }) // —— heart
  ;(el.querySelector('.cbtn--share') as HTMLButtonElement).addEventListener('click', () =>
    toast('已生成分享卡片'),
  )

  let regenT = 0
  function showRegen() {
    regen.classList.add('is-on')
    clearTimeout(regenT)
    regenT = window.setTimeout(() => regen.classList.remove('is-on'), 1400)
  }

  // —— drawer ——
  function openDrawer() {
    drawer.classList.add('is-open')
  }
  function closeDrawer() {
    drawer.classList.remove('is-open')
  }
  tuneBtn.addEventListener('click', openDrawer)
  ;(el.querySelector('.drawer__grip') as HTMLElement).addEventListener('click', closeDrawer)

  function renderChips() {
    chipsEl.innerHTML = moodChips
      .map(
        (c, i) =>
          `<button class="chip${state.chip === i ? ' is-on' : ''}" data-i="${i}" style="${state.chip === i ? '--accent:' + c.accent : ''}">${c.t}</button>`,
      )
      .join('')
    chipsEl.querySelectorAll<HTMLButtonElement>('.chip').forEach((ch) => {
      ch.addEventListener('click', () => {
        const i = Number(ch.dataset.i)
        state.chip = i
        const c = moodChips[i]
        cur.accent = c.accent
        cur.wave = c.wave
        cur.amp = c.amp
        cur.dur = c.dur
        cur.arr = c.arr
        applyMood(cur)
        music.setTone(i) // 微调走向 → 实时换调式/音色/速度
        setArr(c.arr)
        renderChips()
        showRegen()
      })
    })
  }
  tempo.addEventListener('input', () => {
    cur.dur = +(10 - (Number(tempo.value) / 100) * 7).toFixed(1)
    applyMood(cur)
    music.setBpm(48 + (Number(tempo.value) / 100) * 92) // 滑杆 0..100 → 48..140 BPM
    showRegen()
  })

  // 哼唱：按住录、上滑取消（仿微信语音）
  let humResetT = 0
  let humming = false
  let humCancel = false
  let humY0 = 0
  const HUM_CANCEL_DY = 48
  function resetHum() {
    humBtn.classList.remove('is-live', 'is-cancel')
    humIc.innerHTML = wave()
    humTx.textContent = '按住 · 哼一段，让旋律跟着你'
  }
  function humDown(e: PointerEvent) {
    e.preventDefault()
    humming = true
    humCancel = false
    humY0 = e.clientY
    try {
      humBtn.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    humBtn.classList.add('is-live')
    humBtn.classList.remove('is-cancel')
    humIc.innerHTML = dotLive()
    humTx.textContent = '正在听你哼…   ↑ 上滑取消'
    cur.amp = 1.3
    applyMood(cur)
  }
  function humMove(e: PointerEvent) {
    if (!humming) return
    const c = humY0 - e.clientY > HUM_CANCEL_DY
    if (c !== humCancel) {
      humCancel = c
      humBtn.classList.toggle('is-cancel', c)
      humIc.innerHTML = c ? cross() : dotLive()
      humTx.textContent = c ? '松开手指 · 取消' : '正在听你哼…   ↑ 上滑取消'
    }
  }
  function humUp() {
    if (!humming) return
    humming = false
    if (humCancel) {
      humBtn.classList.remove('is-live', 'is-cancel')
      humIc.innerHTML = wave()
      humTx.textContent = '已取消 · 没关系，再来'
      clearTimeout(humResetT)
      humResetT = window.setTimeout(resetHum, 1200)
      return
    }
    humBtn.classList.remove('is-live')
    humTx.textContent = '已根据你的旋律重新生成'
    cur.arr = '人声哼鸣 · 钢琴 · 跟随你的旋律'
    setArr(cur.arr)
    showRegen()
    clearTimeout(humResetT)
    humResetT = window.setTimeout(resetHum, 1600)
  }
  humBtn.addEventListener('pointerdown', humDown)
  humBtn.addEventListener('pointermove', humMove)
  humBtn.addEventListener('pointerup', humUp)
  humBtn.addEventListener('pointercancel', humUp)

  // —— 心潮日记 ——
  function readToTitle(html: string) {
    const t = html
      .replace(/<[^>]+>/g, '')
      .replace(/[，。、？！]/g, ' ')
      .trim()
      .split(/\s+/)
    return t[0] || '此刻的潮'
  }
  // 心潮路径数据：到今天为止的每日心情分（含用户当天补记 tideOverride）
  let tideDays: TideDay[] = []
  function renderDiary() {
    const today = recoveryDay()
    tideDays = buildTideDays(today)
    // 用户在本次会话里补记/改写过的天数，覆盖进去
    for (const [d, ov] of tideOverride) {
      const idx = tideDays.findIndex((x) => x.day === d)
      if (idx >= 0) tideDays[idx] = { ...tideDays[idx], ...ov }
    }
    const cur = tideDays[tideDays.length - 1]

    const chart = el.querySelector('.tp__chart') as HTMLElement
    const path = mountTidePath(chart, tideDays, openDayDetail)
    ;(el.querySelector('.tp__day') as HTMLElement).textContent = String(today)
    ;(el.querySelector('.tp__total') as HTMLElement).textContent = String(CYCLE())
    ;(el.querySelector('.tp__pct') as HTMLElement).textContent = `${cur.score}%`

    // —— 此刻建议（读趋势）——
    const adv = tideAdvice(tideDays)
    ;(el.querySelector('.tadv__t') as HTMLElement).textContent = adv.title
    ;(el.querySelector('.tadv__b') as HTMLElement).textContent = adv.body
    ;(el.querySelector('.tadv') as HTMLElement).dataset.tone = adv.tone

    // —— 三项洞察 ——
    const scores = tideDays.map((d) => d.score)
    const weekAgo = tideDays.length >= 8 ? tideDays[tideDays.length - 8].score : scores[0]
    const deltaPct = Math.round(((cur.score - weekAgo) / Math.max(1, weekAgo)) * 100)
    const lowest = tideDays.reduce((a, b) => (b.score < a.score ? b : a))
    const climbs = tideDays.filter((d, i) => i > 0 && d.score > tideDays[i - 1].score).length
    ;(el.querySelector('.tins') as HTMLElement).innerHTML = `
      <div class="tins__c"><b>${deltaPct >= 0 ? '↑' : '↓'} ${Math.abs(deltaPct)}%</b><span>比一周前</span></div>
      <div class="tins__c"><b>第 ${lowest.day} 天</b><span>最低谷，已走过</span></div>
      <div class="tins__c"><b>${climbs} 次</b><span>往上的日子</span></div>`

    // —— 时间线（倒序：今天在上）——
    const tl = [...tideDays].reverse()
    diaryEl.innerHTML = tl
      .map(
        (d, i) => `
        <div class="dentry${i === 0 ? ' is-now' : ''}" data-day="${d.day}">
          <span class="dentry__dot" style="--c:${scoreColor(d.score)}"></span>
          <div class="dentry__body">
            <div class="dentry__day">第 ${d.day} 天 · <span class="dentry__sc" style="color:${scoreColor(d.score)}">${d.score} 分</span></div>
            <div class="dentry__song">${noteIcon()} ${d.song}</div>
            <div class="dentry__mood">${d.mood}</div>
            ${
              d.note
                ? `<div class="dentry__note">“${d.note}"</div>`
                : `<button class="dentry__add">${penIcon()} 写两句</button>`
            }
          </div>
        </div>`,
      )
      .join('')
    diaryEl.querySelectorAll<HTMLElement>('.dentry').forEach((row) => {
      row.addEventListener('click', () => {
        const d = tideDays.find((x) => x.day === Number(row.dataset.day))
        if (d) openDayDetail(d)
      })
    })

    if (!reduceMotion) {
      if (path.parts.line) {
        gsap.fromTo(
          path.parts.line,
          { strokeDashoffset: 1, strokeDasharray: 1 },
          { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out' },
        )
      }
      gsap.from(path.parts.nodes, {
        scale: 0,
        opacity: 0,
        transformOrigin: 'center',
        duration: 0.5,
        ease: 'back.out(2)',
        stagger: 0.08,
        delay: 0.45,
      })
      gsap.from([el.querySelector('.tadv'), ...el.querySelectorAll('.tins__c')], {
        opacity: 0,
        y: 14,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.06,
        delay: 0.4,
      })
      gsap.from(diaryEl.querySelectorAll('.dentry'), {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.07,
        delay: 0.5,
      })
    }
  }

  // —— 某一天详情卡 ——
  const dnd = el.querySelector('.dnd') as HTMLElement
  function openDayDetail(d: TideDay) {
    const c = scoreColor(d.score)
    ;(el.querySelector('.dnd__day') as HTMLElement).textContent = `第 ${d.day} / ${CYCLE()} 天`
    ;(el.querySelector('.dnd__num') as HTMLElement).textContent = String(d.score)
    ;(el.querySelector('.dnd__num') as HTMLElement).style.color = c
    ;(el.querySelector('.dnd__mood') as HTMLElement).textContent = d.mood
    const fill = el.querySelector('.dnd__fill') as HTMLElement
    ;(el.querySelector('.dnd__song') as HTMLElement).innerHTML = `${noteIcon()} 那天的潮：${d.song}`
    ;(el.querySelector('.dnd__note') as HTMLElement).textContent = d.note ? `“${d.note}”` : '那天没有留下文字。'
    const aiEl = el.querySelector('.dnd__ai') as HTMLElement
    aiEl.innerHTML = d.ai ? `${spark()} <span>${d.ai}</span>` : ''
    aiEl.style.display = d.ai ? '' : 'none'
    dnd.classList.add('is-on')
    if (!reduceMotion) {
      gsap.fromTo(fill, { width: '0%' }, { width: `${d.score}%`, duration: 0.7, ease: 'power2.out', delay: 0.1 })
      gsap.fromTo(
        dnd.querySelector('.dnd__panel'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
      )
    } else {
      fill.style.width = `${d.score}%`
    }
  }
  ;(el.querySelector('.dnd__close') as HTMLButtonElement).addEventListener('click', () =>
    dnd.classList.remove('is-on'),
  )
  dnd.addEventListener('click', (e) => {
    if (e.target === dnd) dnd.classList.remove('is-on')
  })

  // —— 记录今天：自评分 + 文字 → 大模型解析 → 综合分 ——
  const tideOverride = new Map<number, Partial<TideDay>>()
  const rec = el.querySelector('.rec') as HTMLElement
  const recRange = el.querySelector('.rec__range') as HTMLInputElement
  const recScore = el.querySelector('.rec__score') as HTMLElement
  const recText = el.querySelector('.rec__text') as HTMLTextAreaElement
  const recAiTx = el.querySelector('.rec__ai-tx') as HTMLElement
  function openRec() {
    recRange.value = '50'
    recScore.textContent = '50'
    recScore.style.color = scoreColor(50)
    recText.value = ''
    recAiTx.textContent = '写下后，我会读出今天的情绪，和你的打分合在一起。'
    rec.classList.add('is-on')
    if (!reduceMotion)
      gsap.fromTo(
        rec.querySelector('.rec__panel'),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.42, ease: 'power3.out' },
      )
  }
  function closeRec() {
    rec.classList.remove('is-on')
  }
  recRange.addEventListener('input', () => {
    recScore.textContent = recRange.value
    recScore.style.color = scoreColor(Number(recRange.value))
  })
  // 边写边解析（轻量去抖）
  let aiT = 0
  recText.addEventListener('input', () => {
    clearTimeout(aiT)
    aiT = window.setTimeout(() => {
      const t = recText.value.trim()
      if (!t) {
        recAiTx.textContent = '写下后，我会读出今天的情绪，和你的打分合在一起。'
        return
      }
      const ai = analyzeText(t)
      recAiTx.textContent = ai.label
    }, 280)
  })
  ;(el.querySelector('.rec__cancel') as HTMLButtonElement).addEventListener('click', closeRec)
  const moodFromScore = (s: number) =>
    s < 22 ? '低落' : s < 38 ? '钝痛 · 缓' : s < 55 ? '平静' : s < 70 ? '微亮' : '渐暖 · 好多了'
  ;(el.querySelector('.rec__save') as HTMLButtonElement).addEventListener('click', () => {
    const self = Number(recRange.value)
    const t = recText.value.trim()
    const ai = analyzeText(t)
    const score = blendScore(self, ai, !!t)
    const today = recoveryDay()
    tideOverride.set(today, {
      score,
      note: t,
      mood: moodFromScore(score),
      ai: t ? ai.label : undefined,
    })
    closeRec()
    renderDiary()
    toast(`已收下今天 · ${score} 分`)
  })
  ;(el.querySelector('.rec__grip') as HTMLElement).addEventListener('click', closeRec)
  ;(el.querySelector('.trec') as HTMLButtonElement).addEventListener('click', openRec)

  // —— 我的 ——
  function refreshCounts() {
    meSave.textContent = String(state.saved.length)
  }
  function renderMe() {
    const d = recoveryDay()
    ;(el.querySelector('.l2me__day') as HTMLElement).textContent = String(d)
    meDay.textContent = String(d)
    refreshCounts()
    if (!reduceMotion) {
      gsap.from(el.querySelectorAll('.l2me__head, .l2stat, .l2mi'), {
        opacity: 0,
        y: 12,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.05,
      })
    }
  }
  el.querySelectorAll<HTMLButtonElement>('.l2mi').forEach((b) => {
    b.addEventListener('click', () => openSheet(b.dataset.m as MenuKey))
  })

  // —— 二级子页（我收下的曲子 / 心潮地图 / 音乐治疗 / 设置） ——
  const sheet = el.querySelector('.sheet') as HTMLElement
  const sheetTitle = el.querySelector('.sheet__title') as HTMLElement
  const sheetBody = el.querySelector('.sheet__body') as HTMLElement
  function openSheet(key: MenuKey) {
    sheetTitle.textContent = SHEET_TITLE[key]
    sheetBody.innerHTML = sheetContent(key, state.saved)
    sheet.classList.add('is-open')
    // 子页内的交互
    sheetBody.querySelectorAll<HTMLButtonElement>('[data-toast]').forEach((b) =>
      b.addEventListener('click', () => toast(b.dataset.toast || '')),
    )
    sheetBody.querySelectorAll<HTMLInputElement>('.swc__sw').forEach((sw) =>
      sw.addEventListener('change', () =>
        toast(sw.checked ? '已开启 · ' + (sw.dataset.k || '') : '已关闭 · ' + (sw.dataset.k || '')),
      ),
    )
    // 疗愈周期切换：选中即生效、持久化，并刷新当前页（心潮路径随周期重画）
    sheetBody.querySelectorAll<HTMLButtonElement>('.cyc').forEach((c) =>
      c.addEventListener('click', () => {
        const n = Number(c.dataset.cyc)
        setCycleDays(n)
        sheetBody.querySelectorAll('.cyc').forEach((x) => x.classList.toggle('is-on', x === c))
        const v = sheetBody.querySelector('.setblk__v') as HTMLElement | null
        if (v) v.textContent = `${n} 天`
        toast(`疗愈周期 · ${n} 天`)
      }),
    )
    // 清空数据：重置周期起点 + 本次会话补记
    const resetBtn = sheetBody.querySelector('[data-reset]') as HTMLButtonElement | null
    resetBtn?.addEventListener('click', () => {
      resetRecovery()
      tideOverride.clear()
      toast('已清空 · 重新从第 1 天开始')
    })
    if (!reduceMotion) {
      gsap.from(sheetBody.children, {
        opacity: 0,
        y: 16,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.05,
        delay: 0.08,
      })
    }
  }
  function closeSheet() {
    sheet.classList.remove('is-open')
  }
  ;(el.querySelector('.sheet__back') as HTMLButtonElement).addEventListener('click', closeSheet)

  // —— screens / nav ——
  function showScreen(id: 'feed' | 'imm' | 'diary' | 'me') {
    ;(Object.keys(scrs) as Array<keyof typeof scrs>).forEach((k) =>
      scrs[k].classList.toggle('is-on', k === id),
    )
    el.classList.toggle('l2--imm', id === 'imm')
  }
  function setNav(t: string | null) {
    el.querySelectorAll<HTMLButtonElement>('.l2nav__b').forEach((b) =>
      b.classList.toggle('is-on', b.dataset.t === t),
    )
  }
  function go(t: 'feed' | 'diary' | 'me') {
    water.stop()
    music.stop()
    seaAudio.reset()
    closeDrawer()
    showScreen(t)
    setNav(t)
    if (t === 'diary') renderDiary()
    if (t === 'me') renderMe()
  }
  el.querySelectorAll<HTMLButtonElement>('.l2nav__b').forEach((b) => {
    b.addEventListener('click', () => go(b.dataset.t as 'feed' | 'diary' | 'me'))
  })
  ;(el.querySelector('.imm__back') as HTMLButtonElement).addEventListener('click', () => go('feed'))

  // —— capsule ——
  ;(el.querySelector('.l2cap__close') as HTMLButtonElement).addEventListener('click', () => close())
  ;(el.querySelector('.l2cap__more') as HTMLButtonElement).addEventListener('click', () =>
    toast('心是月，乐是潮 · 你不必开口'),
  )

  // —— toast ——
  let toastT = 0
  function toast(msg: string) {
    toastEl.textContent = msg
    toastEl.classList.add('is-on')
    clearTimeout(toastT)
    toastT = window.setTimeout(() => toastEl.classList.remove('is-on'), 1700)
  }

  // —— open / close ——
  function open(entry: { card?: number; from?: string } = {}) {
    el.classList.add('is-open')
    window.dispatchEvent(new Event('mt:pause-layer1')) // 先停第一层音乐，避免两轨叠加
    refreshCounts()
    if (typeof entry.card === 'number') {
      openImm(entry.card)
    } else if (entry.from === '展开海潮日记') {
      go('diary')
    } else {
      showScreen('feed')
      setNav('feed')
    }
  }
  function close() {
    water.stop()
    music.stop()
    closeDrawer()
    closeSheet()
    el.classList.remove('is-open')
    opts.onClose?.()
  }

  host.append(el)
  return { el, open, close }
}

/* ---------- 海报色波形（feed 卡缩略） ---------- */
function wavePath(amp: number, period: number, total: number, baseY: number, phase: number, close: boolean) {
  let d = 'M0 ' + baseY
  for (let x = 0; x <= total; x += 8) {
    const y = baseY - amp * Math.sin((x / period) * Math.PI * 2 + phase)
    d += ' L' + x + ' ' + y.toFixed(1)
  }
  if (close) d += ' L' + total + ' 120 L0 120 Z'
  return d
}
function waveSVG(wave: string, amp: number): string {
  const W = 900
  const layers = [
    { a: 18 * amp, p: 240, y: 62, o: 0.92, ph: 0 },
    { a: 13 * amp, p: 180, y: 74, o: 0.6, ph: 1.4 },
    { a: 9 * amp, p: 130, y: 84, o: 0.34, ph: 2.7 },
  ]
  const paths = layers
    .map((l, i) => {
      const fill = `<path d="${wavePath(l.a, l.p, W, l.y, l.ph, true)}" fill="${wave}" opacity="${l.o}" style="animation:l2flow ${7 - i * 1.2}s linear infinite"/>`
      const crest =
        i < 2
          ? `<path d="${wavePath(l.a, l.p, W, l.y, l.ph, false)}" fill="none" stroke="rgba(255,253,244,.7)" stroke-width="1.4" opacity="${(l.o * 0.55).toFixed(2)}" style="animation:l2flow ${7 - i * 1.2}s linear infinite"/>`
          : ''
      return fill + crest
    })
    .join('')
  return `<svg viewBox="0 0 ${W / 2} 120" preserveAspectRatio="none" width="100%" height="100%" style="position:absolute;inset:0">${paths}</svg>`
}

/* ---------- 内联图标 ---------- */
function play() {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
}
function pause() {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>`
}
function heart() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20s-7-4.6-9.3-9C1.2 8.3 2.6 5 5.8 5 8 5 9.4 6.6 12 9c2.6-2.4 4-4 6.2-4 3.2 0 4.6 3.3 3.1 6-2.3 4.4-9.3 9-9.3 9z"/></svg>`
}
function heartFull() {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.6-9.3-9C1.2 8.3 2.6 5 5.8 5 8 5 9.4 6.6 12 9c2.6-2.4 4-4 6.2-4 3.2 0 4.6 3.3 3.1 6-2.3 4.4-9.3 9-9.3 9z"/></svg>`
}
function share() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M8 8l4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>`
}
function spark() {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.6 5a3 3 0 0 0 1.8 1.8l5 1.6-5 1.6a3 3 0 0 0-1.8 1.8L12 21l-1.6-5a3 3 0 0 0-1.8-1.8L3.6 12l5-1.6A3 3 0 0 0 10.4 8z"/></svg>`
}
function wave() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 12h2M7 7v10M11 4v16M15 8v8M19 11v2M21 12h0"/></svg>`
}
function dotLive() {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>`
}
function cross() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`
}
function noteIcon() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="vertical-align:-1px"><path d="M9 17a3 3 0 1 1-2-2.8V5l11-2v9.2A3 3 0 1 1 16 11V6.5L9 7.9z"/></svg>`
}
function penIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="vertical-align:-1px"><path d="M4 20h4L18 10l-4-4L4 16zM14 6l4 4"/></svg>`
}

/* ---------- 二级子页内容（我收下的曲子 / 心潮地图 / 音乐治疗 / 设置） ---------- */
interface SavedEntryLite {
  song: string
  mood: string
  color: string
  day: string
}
function sheetContent(key: 'fav' | 'map' | 'heal' | 'set', saved: SavedEntryLite[]): string {
  if (key === 'fav') {
    const favs = saved.length
      ? saved
      : [
          { song: '雨停在窗外', mood: '安静 · 想念', color: '#6d8fc9', day: '第 10 天' },
          { song: '一个人也能走', mood: '平静 · 微亮', color: '#e2b35f', day: '第 8 天' },
          { song: '凌晨三点的潮', mood: '难过 · 失眠', color: '#d98f64', day: '第 3 天' },
        ]
    return (
      `<div class="sh__hint">${noteIcon()} 你在这些时刻，收下了它们的陪伴</div>` +
      favs
        .map(
          (e) => `
        <div class="favrow" data-toast="播放《${e.song}》">
          <span class="favrow__cv" style="--c:${e.color}">${noteIcon()}</span>
          <div class="favrow__tx">
            <b>${e.song}</b>
            <i>${e.mood} · ${e.day}</i>
          </div>
          <span class="favrow__play">${svgPlaySmall()}</span>
        </div>`,
        )
        .join('')
    )
  }
  if (key === 'map') {
    // 心潮地图：一周情绪分布的「潮位热区」+ 文案
    const cells = [
      { d: '一', v: 0.2, c: '#d98f64' },
      { d: '二', v: 0.3, c: '#cf9c45' },
      { d: '三', v: 0.35, c: '#9a86c6' },
      { d: '四', v: 0.5, c: '#6d8fc9' },
      { d: '五', v: 0.62, c: '#6d8fc9' },
      { d: '六', v: 0.78, c: '#e2b35f' },
      { d: '日', v: 0.9, c: '#e6c277' },
    ]
    return (
      `<div class="sh__hint">${'最近一周，你的心潮慢慢从落潮涨向满潮'}</div>` +
      `<div class="mapgrid">` +
      cells
        .map(
          (c) =>
            `<div class="mapcol"><span class="mapcol__bar" style="height:${Math.round(c.v * 100)}%;--c:${c.c}"></span><i>${c.d}</i></div>`,
        )
        .join('') +
      `</div>` +
      `<div class="sh__stats">
        <div class="sh__stat"><b>↑ 64%</b><span>比一周前更暖</span></div>
        <div class="sh__stat"><b>夜里</b><span>最常听的时段</span></div>
        <div class="sh__stat"><b>想念</b><span>出现最多的心境</span></div>
      </div>`
    )
  }
  if (key === 'heal') {
    // 音乐治疗：医学背景背书 + 疗愈方案（拓展）
    const courses = [
      { t: '14 天走出失恋', s: '每天一段，先接住、再托起', tag: '进行中' },
      { t: '失眠的夜', s: '入睡引导 · 渐慢的潮声', tag: '可开启' },
      { t: '稳住情绪', s: '焦虑来袭时的 4 分钟', tag: '可开启' },
    ]
    return (
      `<div class="sh__card sh__card--cred">
        <div class="sh__cred-ic">${svgShield()}</div>
        <div>
          <b>由有医学背景的团队打磨</b>
          <p>方案借鉴音乐治疗（Music Therapy）「先同频、再引导」的原则，只作情绪陪伴，不替代专业诊疗。</p>
        </div>
      </div>` +
      courses
        .map(
          (c) => `
        <div class="course" data-toast="${c.tag === '进行中' ? '继续：' : '开启：'}${c.t}">
          <div class="course__tx"><b>${c.t}</b><i>${c.s}</i></div>
          <span class="course__tag${c.tag === '进行中' ? ' is-on' : ''}">${c.tag}</span>
        </div>`,
        )
        .join('')
    )
  }
  // set
  const sw = (k: string, on: boolean) =>
    `<label class="swc"><span class="swc__k">${k}</span><span class="swc__t"><input class="swc__sw" type="checkbox" data-k="${k}"${on ? ' checked' : ''}/><span class="swc__sl"></span></span></label>`
  return (
    `<div class="sh__group">` +
    sw('每晚 23:00 提醒收一段潮', true) +
    sw('哼唱用麦克风', false) +
    sw('减少动态效果', false) +
    `</div>` +
    `<div class="sh__group">
      <div class="setblk">
        <div class="setblk__hd">疗愈周期<span class="setblk__v">${cycleDays()} 天</span></div>
        <div class="setblk__chips">${CYCLE_OPTIONS.map((n) => `<button class="cyc${n === cycleDays() ? ' is-on' : ''}" data-cyc="${n}">${n} 天</button>`).join('')}</div>
        <div class="setblk__note">陪你走过最难的一段，可按自己的节奏调整</div>
      </div>
    </div>` +
    `<div class="sh__group">
      <button class="setrow setrow--danger" data-reset="1">清空我的心潮数据<span class="setrow__v">›</span></button>
      <button class="setrow" data-toast="MoodTide v0.1 · 温州站黑客松">关于 MoodTide<span class="setrow__v">v0.1 ›</span></button>
    </div>` +
    `<div class="sh__sign">心是月，乐是潮 · 你不必开口</div>`
  )
}
function svgPlaySmall() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>`
}
function svgShield() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>`
}
function gear() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L16.2 2h-4l-.4 2.5a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.5h4l.4-2.5a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0 0 19 12z"/></svg>`
}
function icMoon() {
  return `<svg class="l2nav__i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10z"/></svg>`
}
function icWave() {
  return `<svg class="l2nav__i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 13c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 3 4"/></svg>`
}
function icDot() {
  return `<svg class="l2nav__i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>`
}
