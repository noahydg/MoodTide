/**
 * MoodTide 入口。
 * 【当前步】第一层 4 卡横滑 demo：此刻的潮 / 拍打海面 / 给你的建议 / 海潮日记。
 * 套精致手机模型 + 抖音外壳。第二层（哼唱/微调/日记拓展）后续接入。
 */
import './styles/global.css'
import './styles/shell.css'
import './styles/cards.css'
import './styles/layer2.css'
import { mountShell } from './shell/appShell'

mountShell(document.getElementById('app')!)
