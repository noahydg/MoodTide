/**
 * 音乐生成服务 —— “声音从哪来”的统一入口（四级降级链）。
 *
 * 团队决策：
 *   - 主路径：真实调用「豆包音乐生成模型」（火山引擎 Seed-Music / 豆包·音乐）当场生成。
 *   - 备路径：Suno 第三方代理（音质最高，注明 AI 生成）。
 *   - 兜底：预生成 mp3 情绪池（OSS/本地）→ 合成器 SynthEngine（永不挂）。
 *
 * 关键纪律（赛道三“刷到即成立”）：在线生成是**异步**的（提交→轮询，~10-40s）。
 * 因此“在线生成”只用于「点进去」的第二层（详情页里用户主动“重新生成专属曲”），
 * 第一层信息流卡片永远用**零延迟**来源（mp3 池 / 合成器），绝不让评委看到 loading。
 *
 * 安全：所有 API Key 只存在于后端 BFF（server/index.ts），前端只调 /api/* 。
 */

import type { Mood } from '../context/palette'
import { pickFile, hasFileFor } from '../audio/pool'

export type MusicSource = 'doubao' | 'suno' | 'file' | 'synth'

export interface MusicRequest {
  mood: Mood
  signature: string // 情境签名，参与“专属、不重复”
  sunoPrompt?: string // 豆包写好的作曲 prompt（可由 llm/doubao 生成）
  instrumental?: boolean
}

export interface MusicResult {
  source: MusicSource
  audioUrl?: string // file/doubao/suno 时有
  useSynth?: boolean // true 时由调用方改用 SynthEngine 实时合成
}

/** 在线引擎开关：默认走“离线零延迟”，详情页“真实生成”按钮才置 true */
export interface ResolveOptions {
  online?: boolean
  engine?: 'doubao' | 'suno'
  timeoutMs?: number
  onProgress?: (stage: string) => void
}

const MUSIC_ENDPOINT = '/api/music'

/**
 * 统一解析一段音乐来源。永远 resolve（不 reject）：任何失败都向下降级，
 * 最终至少返回 { source:'synth', useSynth:true }，保证现场必出声。
 */
export async function resolveMusic(req: MusicRequest, opts: ResolveOptions = {}): Promise<MusicResult> {
  const { online = false, engine = 'doubao', timeoutMs = 35000, onProgress } = opts

  if (online) {
    try {
      onProgress?.('提交生成任务…')
      const url = await generateOnline(req, engine, timeoutMs, onProgress)
      if (url) return { source: engine, audioUrl: url }
    } catch {
      /* 在线失败：继续向下降级 */
    }
  }

  // 离线零延迟来源
  if (hasFileFor(req.mood)) {
    const url = pickFile(req.mood)
    if (url) return { source: 'file', audioUrl: url }
  }
  return { source: 'synth', useSynth: true }
}

/**
 * 调 BFF 走异步生成：POST 提交拿 taskId → 轮询 GET 直到 SUCCESS 拿 audioUrl。
 * BFF 内部再决定打豆包音乐还是 Suno 代理（见 server/index.ts 计划）。
 */
async function generateOnline(
  req: MusicRequest,
  engine: 'doubao' | 'suno',
  timeoutMs: number,
  onProgress?: (s: string) => void,
): Promise<string | null> {
  const submit = await fetch(MUSIC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...req, engine }),
  })
  if (!submit.ok) return null
  const { taskId } = (await submit.json()) as { taskId?: string }
  if (!taskId) return null

  const deadline = performance.now() + timeoutMs
  while (performance.now() < deadline) {
    await sleep(2000)
    onProgress?.('生成中…')
    const res = await fetch(`${MUSIC_ENDPOINT}?taskId=${encodeURIComponent(taskId)}`)
    if (!res.ok) continue
    const data = (await res.json()) as { status?: string; audioUrl?: string }
    if (data.status === 'SUCCESS' && data.audioUrl) return data.audioUrl
    if (data.status === 'FAILED') return null
  }
  return null // 超时 → 交给调用方降级
}

function sleep(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms))
}
