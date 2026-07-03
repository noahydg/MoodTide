# MoodTide 项目结构

> 核心心智模型：**两层**。
> 第一层 = 信息流卡片（被刷到那一刻，**怎样吸引你进来**）。
> 第二层 = 点进去的详情（进来之后，**怎样把你留住、给你更深的体验**）。

```
MoodTide/
├── index.html              入口：进入门(解锁音频) + 信息流容器
├── src/
│   ├── main.ts             ★总装：解锁 → 读情境 → 建信息流 → 接两层路由
│   │
│   ├── context/            【环境信号 + 情绪档配置】
│   │   ├── contextEngine.ts   时间/节气/天气 → 情境签名(Context)
│   │   ├── palette.ts         情绪档(含坐标anchor)+配色+合成参/nearestMood/moodLabel
│   │   └── solarTerms.ts      二十四节气近似算法
│   │
│   ├── sense/            【★情绪推断引擎 MoodSense】客观→主观坐标
│   │   ├── types.ts           MoodVector / SignalContribution / MoodInference
│   │   ├── signals.ts         环境层信号采集(时间/天气/季节)
│   │   └── moodSense.ts       加权融合→坐标→snap档→标签/为什么/共鸣
│   │
│   ├── feed/              【第一层 · 信息流】吸引你进来
│   │   ├── slide.ts           Slide 统一接口(内容卡/心潮卡共用)
│   │   ├── feed.ts            竖向滚动 + IntersectionObserver(同时只一屏激活)
│   │   ├── prerollFeed.ts     迷你信息流数据 + BrowsingTracker(处境层信号)
│   │   ├── contentCard.ts     内容卡:"你刚刷过的视频"(进视口即记入Tracker)
│   │   └── card.ts            心潮卡:刷到即响 + 四件套 + 轻点进详情/长按收下
│   │
│   ├── detail/           【第二层 · 详情】点进去的沉浸体验
│   │   └── detailView.ts      情绪轮微调 / 真实生成专属曲 / 收下 / 分享
│   │
│   ├── app/
│   │   └── router.ts         协调两层切换(进详情→信息流挂起；返回→恢复)
│   │
│   ├── audio/            【声音底座】
│   │   ├── synthEngine.ts     Web Audio 实时合成(零素材兜底+亮点) + 外部音频接入
│   │   └── pool.ts            预生成 mp3 情绪池(放进 public/audio 即启用)
│   │
│   ├── music/
│   │   └── musicService.ts    ★音乐四级降级链：豆包音乐→Suno代理→mp3池→合成器
│   │
│   ├── visual/
│   │   └── waveSea.ts         声波海面：AnalyserNode 实时驱动 Canvas(技术铁证)
│   │
│   ├── mood/
│   │   └── moodWheel.ts       情绪轮(第二层的"轻轻一拨"微调)
│   │
│   ├── interaction/
│   │   └── holdToKeep.ts      手势消歧：轻点进详情 / 长按收下 / 拖动滚动
│   │
│   ├── store/
│   │   └── tideJar.ts         潮汐瓶本地持久化 + "记得你"(连续叙事)
│   │
│   ├── llm/
│   │   └── doubao.ts          豆包 ARK：读心文案/作曲 prompt(走 BFF，可选)
│   │
│   ├── share/
│   │   └── shareCard.ts       分享卡导出(传播引擎，待实现)
│   │
│   └── styles/global.css      抖音暗色沉浸视觉(品牌色 + 运行时情境配色变量)
│
├── server/index.ts          BFF(可选)：持 API Key 代理豆包/Suno，前端只调 /api/*
├── public/audio/            预生成情绪 mp3 池(Suno 生成，注明 AI)
└── docs/
    ├── PLAN.md               完整方案 / 评分策略 / 48h 计划
    └── STRUCTURE.md          本文件
```

## 数据流（一次完整体验）

```
[进入门] 轻触解锁音频(浏览器 autoplay 策略)
   │
   ▼
[contextEngine] 读此刻 ── 时间/节气/天气 ──▶ 情境签名「5月30日·小满·黄昏」
   │                                          + 情绪档位 mood(dusk_ease)
   ▼
[main.buildFeed] 首张卡 = 真实当下；后续 = 其它情绪变体
   │
   ▼
┌─────────────── 第一层 Feed ───────────────┐
│  刷到卡片 → card.enter()                    │
│    ├ synthEngine.play(mood)  零延迟起调      │   ← 信息流永远走零延迟来源
│    ├ waveSea  声波随音律实时起伏             │     (合成器/mp3池)，绝不 loading
│    └ 浮出读心文案(palette.minds)            │
│                                            │
│  手势(holdToKeep):                          │
│    ├ 轻点 ─────────────────▶ router.openDetail()
│    └ 长按 ─▶ tideJar.keep() 飞入潮汐瓶       │
└────────────────────────────────────────────┘
   │ 轻点进入
   ▼
┌─────────────── 第二层 Detail ──────────────┐
│  detailView.open(data)                      │
│    ├ 情绪轮 moodWheel ─▶ 当场换 mood/旋律     │
│    ├ ✨真实生成 ─▶ musicService.resolveMusic │   ← 这里才允许异步在线生成
│    │     online: 豆包音乐(主) → Suno(备)      │     (有进度提示，永远有兜底)
│    │     失败/超时 → mp3池 → 合成器(永不挂)    │
│    ├ 收下 ─▶ tideJar.keep()                  │
│    └ 分享 ─▶ shareCard(竖屏卡+水印+二维码)    │
└────────────────────────────────────────────┘
```

## 关键设计纪律

1. **第一层零延迟**：信息流卡片只用合成器/mp3 池，刷到即响，**绝不出现 loading**。
   真实在线生成(豆包音乐/Suno)只发生在第二层用户**主动点「真实生成」**时，且带兜底。
2. **声波必须真实驱动**：`waveSea` 读 `AnalyserNode` 时域数据，合成器与外部 mp3 都接入同一
   analyser → 切歌时海面随之变(演示可现场证明"不是贴的循环动画")。
3. **音乐来源可替换**：`musicService` + `pool` 把"声音从哪来"与 UI 解耦。
   现在默认合成器；放 mp3 进 `public/audio` 即升级；接好 BFF 即真生成。**上层代码不用改**。
4. **Key 不进前端**：豆包/Suno 的 key 只在 `server/index.ts`，前端走 `/api/*`。
5. **版权**：mp3 池用 Suno 生成，分享物注明 "AI 生成" + MoodTide 水印。

## 团队分工建议（对应目录）

| 角色 | 负责目录 |
|---|---|
| 前端 A（信息流/手势） | `feed/`、`interaction/`、`visual/` |
| 前端 B（详情/音乐/情绪轮） | `detail/`、`music/`、`mood/`、`app/` |
| 音频/算法 | `audio/`、`context/`、`public/audio/`(Suno 批量生成 mp3) |
| 后端（可选，接真生成） | `server/`、`llm/` |
| 美术 | `styles/`、`share/`、Poster |
