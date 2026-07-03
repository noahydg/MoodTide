/**
 * 音乐池 —— 情绪 → 一段音乐 的来源抽象层。
 *
 * 设计目的：让“声音从哪来”可替换，而上层（卡片/可视化）完全不感知。
 *   - mode='synth'：用 SynthEngine 当场合成（零素材、Day1 即可跑、永不翻车）= 当前默认/兜底
 *   - mode='file' ：播放 public/audio 下的预生成情绪 mp3（音质更好）
 *   - mode='suno' ：调用 sunoapi.org 真生成（加分项，异步，需后端代理 key）
 *
 * 切换策略建议：优先 file（若该 mood 有曲），否则 synth；suno 仅在“真生成”演示桥段触发。
 */

import type { Mood } from '../context/palette'

export type PoolMode = 'synth' | 'file'

/** 预生成情绪音乐池清单：把 mp3 放进 public/audio 后在此登记即可启用 'file' 模式 */
export const FILE_POOL: Partial<Record<Mood, string[]>> = {
  // dawn_clear: ['/audio/dawn-clear-01.mp3'],
  // dusk_ease: ['/audio/dusk-ease-01.mp3', '/audio/dusk-ease-02.mp3'],
}

export function hasFileFor(mood: Mood): boolean {
  return !!FILE_POOL[mood]?.length
}

/** 为某情绪挑一条文件 url（随机，制造“每次不同”） */
export function pickFile(mood: Mood): string | null {
  const list = FILE_POOL[mood]
  if (!list || !list.length) return null
  return list[Math.floor(Math.random() * list.length)]
}

/** 当前该用哪种来源 */
export function resolveMode(mood: Mood): PoolMode {
  return hasFileFor(mood) ? 'file' : 'synth'
}
