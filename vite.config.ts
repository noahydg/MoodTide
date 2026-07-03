import { defineConfig } from 'vite'

// 移动端竖屏 H5。host 暴露到局域网，方便手机真机扫码体验；
// 演示时可用 `npm run dev -- --host` 后用手机访问，或部署到静态托管。
//
// base: './' —— 关键！抖音虚拟创作平台把 ZIP 解到任意沙箱目录运行，
// 资源必须用相对路径，否则 /assets/... 绝对路径会 404。
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 100000, // 小资源内联进 JS，减少 zip 内文件数与路径风险
  },
})
