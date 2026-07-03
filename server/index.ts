/**
 * BFF（可选）—— 仅在需要“真生成/真读心”时启用。
 * 职责：持有 API Key（豆包 ARK / sunoapi.org），代理前端请求，避免 key 泄露到浏览器。
 *
 * 这是 stub：MVP 不依赖它也能完整演示（前端用合成器+本地文案池）。
 * 接入时建议用 Node 原生 http 或 express，部署在本机/任意 Node 环境，前端通过 /api/* 访问。
 *
 * 需要的环境变量（写进 .env，勿提交）：
 *   ARK_API_KEY=...            # 火山方舟豆包
 *   ARK_MODEL=doubao-pro-...   # 推理接入点或模型名
 *   SUNO_API_KEY=...           # sunoapi.org（可选）
 *
 * 计划提供的端点：
 *   POST /api/mind   { timeBand, solarTerm, weather, signature } -> { mind, sunoPrompt }
 *   POST /api/music  { sunoPrompt } -> { taskId }      // 异步提交
 *   GET  /api/music?taskId=... -> { status, audioUrl } // 轮询
 */

export {} // 占位，待实现
