/**
 * 豆包大模型（火山方舟 ARK）接入层 —— 可选增强。
 *
 * 用途：把“此刻情境”交给豆包，生成更灵动的「读心文案」或「作曲 prompt」。
 * 中国境内最稳的一环（OpenAI 兼容协议）。
 *
 * 安全：API Key 绝不放前端！本文件只定义客户端调用约定，真正的请求应打到
 *   自己的 BFF（见 server/index.ts），由后端持 key 调 ARK，再把结果返回前端。
 *
 * MVP 不依赖它也能完整跑（读心文案来自 palette 的模板池）。接通后替换即可。
 */

import type { Context } from '../context/contextEngine'

export interface MindResult {
  mind: string // 一句不超过 12 字的读心文案
  sunoPrompt?: string // 给音乐生成用的英文/中文作曲提示
}

const BFF_ENDPOINT = '/api/mind' // 由 server/index.ts 提供

/**
 * 向 BFF 请求读心文案/作曲 prompt。失败时返回 null，调用方应回退到本地模板。
 */
export async function fetchMind(ctx: Context): Promise<MindResult | null> {
  try {
    const res = await fetch(BFF_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeBand: ctx.timeBand,
        solarTerm: ctx.solarTerm,
        weather: ctx.weather,
        signature: ctx.signature,
      }),
    })
    if (!res.ok) return null
    return (await res.json()) as MindResult
  } catch {
    return null // 离线/未接 BFF：回退到 palette 模板
  }
}
