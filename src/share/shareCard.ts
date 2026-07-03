/**
 * 分享卡 —— 把一段心潮导出成带情境水印的竖屏图（传播引擎）。
 * 文案示例：“2026 小满黄昏 · 此段全网仅你一份”。
 *
 * MVP 占位：先用 Canvas 合成静态分享图；进阶可录屏成竖屏短视频，天生抖音素材。
 * 当前为 stub，待 UI 联调时实现（不阻塞核心闭环）。
 */

import type { KeptTide } from '../store/tideJar'

export async function exportShareImage(_tide: KeptTide): Promise<Blob | null> {
  // TODO: 用离屏 Canvas 绘制：海面快照 + 情境签名 + slogan + 二维码占位
  // 返回 Blob，再走 navigator.share / 下载。
  return null
}
