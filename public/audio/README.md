# 预生成情绪音乐池

把高质量的情绪 mp3 放在此目录，然后到 `src/audio/pool.ts` 的 `FILE_POOL` 登记，
即可让对应情绪从“合成器兜底”升级为“真实音乐文件”。

命名建议：`<mood>-NN.mp3`，例如：
- `dawn_clear-01.mp3`（清晨·清醒）
- `dusk_ease-01.mp3` / `dusk_ease-02.mp3`（黄昏·松弛，多条做“每次不同”）
- `night_calm-01.mp3`（深夜·安静）
- `rain_melancholy-01.mp3`（雨天·微忧）
- `day_focus-01.mp3`（白日·专注）
- `tender-01.mp3`（此刻·温柔）

质量优先级 > 数量：宁可每档 1-2 条极好听、情绪区分明显，也不要一堆平庸雷同。
（来源：Suno / sunoapi.org 预先批量生成后下载放入，或自有素材。）
