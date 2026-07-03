/**
 * 极简路由 —— 协调两层之间的切换。
 *   第一层 Feed（信息流，吸引进来） ⇄ 第二层 Detail（点进去，沉浸体验）
 *
 * 打开详情：信息流暂停（当前卡退潮）→ 详情页接管。
 * 关闭详情：详情页退潮 → 信息流恢复（当前卡重新起调）。
 */

import type { Feed } from '../feed/feed'
import type { DetailView } from '../detail/detailView'
import type { CardData } from '../feed/card'

export class Router {
  private feed: Feed
  private detail: DetailView

  constructor(feed: Feed, detail: DetailView) {
    this.feed = feed
    this.detail = detail
  }

  openDetail(data: CardData) {
    this.feed.pause()
    this.detail.open(data)
  }

  closeDetail() {
    this.feed.resume()
  }
}
