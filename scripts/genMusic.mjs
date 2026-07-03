/**
 * 用 DMXAPI 的 MiniMax 音乐模型生成 4 段心境预设（默认 music-2.5，更强、更有歌曲感）。
 * 端点(已实测)：POST https://www.dmxapi.cn/v1/responses
 *   鉴权：Authorization: <api_key>   ← 不带 "Bearer "！
 *   body：{model, input(风格), lyrics(完整结构歌词), audio_setting, output_format:'hex'}
 *   返回：state:'completed'，output 内 type 'output_audio' 的 audio = hex 编码 mp3。
 *
 * 用法：
 *   DMX_KEY=sk-xxx node scripts/genMusic.mjs            # 全部 4 段（默认 2.5）
 *   DMX_KEY=sk-xxx node scripts/genMusic.mjs 1          # 只第 1 段
 *   DMX_KEY=sk-xxx MODEL=music-2.0 node ...             # 退回便宜的 2.0
 *
 * 让它“像歌不像循环”的关键：lyrics 给 [Intro][Verse][Chorus][Bridge][Outro] 完整结构，
 * 模型据此铺出起承转合；纯音乐由 is_instrumental + input 里“无人声”双重保证。
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { Buffer } from 'node:buffer'

const KEY = process.env.DMX_KEY
if (!KEY) {
  console.error('缺少 DMX_KEY 环境变量')
  process.exit(1)
}
const MODEL = process.env.MODEL || 'music-2.5'
const URL_ = 'https://www.dmxapi.cn/v1/responses'
const H = { Authorization: KEY, 'Content-Type': 'application/json' }
const OUT = new URL('../public/music/', import.meta.url)

const MOODS = [
  {
    i: 0,
    input: 'pure instrumental, no vocals, no singing, no lyrics, 失眠疗愈纯器乐, 钢琴独奏为主, 弦乐铺底, 远处海浪声, F小调, 慢板 60BPM, 温柔, 旋律层层推进有起伏不要简单重复',
    lyrics: '[intro]\n[piano solo]\n[strings swell]\n[piano theme develops]\n[bridge]\n[soft piano outro]',
  },
  {
    i: 1,
    input: 'pure instrumental, no vocals, no singing, no lyrics, 黄昏温暖治愈纯器乐, 钢琴加暖弦乐加柔和暖垫, C大调, 中速 68BPM, 温柔流动, 从低落里一点点透出光, 段落有起伏不要单调重复',
    lyrics: '[intro]\n[warm piano]\n[strings enter]\n[piano and strings build]\n[bridge]\n[gentle outro]',
  },
  {
    i: 2,
    input: 'pure instrumental, no vocals, no singing, no lyrics, 都市夜归 lo-fi 纯器乐, 电钢琴主奏, 柔和低音线条, 轻柔鼓刷律动, A小调, 75BPM, 放松不压抑, 段落有变化不要单调循环',
    lyrics: '[intro]\n[rhodes melody]\n[soft drums groove]\n[bassline]\n[chord change]\n[rhodes solo]\n[outro]',
  },
  {
    i: 3,
    input: '雨天思念纯音乐,慢板,D小调,钢琴加大提琴加真实雨声,忧伤但温柔,乐句层层推进而非重复,无人声,纯器乐',
    lyrics:
      '[Intro]\n雨敲着窗\n[Verse]\n那些没发出去的话\n都被雨收走了\n[Pre-Chorus]\n想念像潮 涨了又退\n[Chorus]\n听着听着 就睡着了\n梦里 没有再见\n[Bridge]\n雨停的时候 天会很干净\n[Outro]\n慢慢来\n',
  },
]

function findHex(o, d = 0) {
  if (d > 6 || !o || typeof o !== 'object') return ''
  for (const v of Object.values(o)) {
    if (typeof v === 'string' && v.length > 2000 && /^[0-9a-fA-F]+$/.test(v.slice(0, 64))) return v
    if (typeof v === 'object') {
      const h = findHex(v, d + 1)
      if (h) return h
    }
  }
  return ''
}

async function genOne(m) {
  const body = {
    model: MODEL,
    input: m.input,
    lyrics: m.lyrics,
    audio_setting: { sample_rate: 44100, bitrate: 128000, format: 'mp3' },
    stream: false,
    output_format: 'hex',
    is_instrumental: true,
  }
  const r = await fetch(URL_, { method: 'POST', headers: H, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 180)}`)
  const j = await r.json()
  if (j.state && j.state !== 'completed') throw new Error('state=' + j.state + ' ' + JSON.stringify(j).slice(0, 120))
  const hex = findHex(j)
  if (!hex) throw new Error('无音频: ' + JSON.stringify(j.base_resp || j.error || j).slice(0, 160))
  const buf = Buffer.from(hex, 'hex')
  if (buf.length < 2000) throw new Error('音频过小: ' + buf.length)
  await writeFile(new URL(`mood${m.i}.mp3`, OUT), buf)
  return buf.length
}

async function run() {
  await mkdir(OUT, { recursive: true })
  const only = process.argv[2] != null ? Number(process.argv[2]) : null
  const list = only != null ? MOODS.filter((m) => m.i === only) : MOODS
  console.log(`模型: ${MODEL}  端点: /v1/responses`)
  for (const m of list) {
    process.stdout.write(`▶ mood${m.i} 生成中… `)
    const t0 = Date.now()
    try {
      const bytes = await genOne(m)
      console.log(`✓ ${(bytes / 1024 / 1024).toFixed(2)}MB  (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
    } catch (e) {
      console.log(`✗ ${e.message}`)
    }
  }
  console.log('完成。')
}
run().catch((e) => {
  console.error('ERROR:', e.message)
  process.exit(1)
})
