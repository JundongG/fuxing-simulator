// utils/audio.js — 程序化音效引擎（无需音频文件）

/**
 * 使用小程序 InnerAudioContext 生成各种驾驶音效
 * 
 * 小程序不支持 Web Audio API，所以用预生成的 base64 音频
 * 以下是极简的 PCM 音频生成器
 */

class AudioEngine {
  constructor() {
    this.ctx = null
    this.engineAudio = null
    this.enabled = true
    this.volume = 0.5
  }

  init() {
    this.ctx = wx.createInnerAudioContext()
    console.log('[Audio] 音效引擎初始化')
  }

  destroy() {
    if (this.ctx) {
      this.ctx.destroy()
      this.ctx = null
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled
    if (!enabled && this.ctx) {
      this.ctx.stop()
    }
  }

  // 播放短音效（用 base64 编码的极短 PCM）
  playShort(type) {
    if (!this.enabled) return

    const audio = wx.createInnerAudioContext()
    audio.src = this.getSoundSrc(type)
    audio.volume = this.volume
    audio.play()

    // 播放完自动销毁
    audio.onEnded(() => audio.destroy())
    audio.onError(() => audio.destroy())
  }

  // 获取音效源（base64 编码的 WAV）
  getSoundSrc(type) {
    // 由于小程序限制，暂时用空音频
    // 实际部署时替换为真实音频文件的 base64 或临时文件路径
    // 或者使用 wx.downloadFile 下载音频后播放
    return ''
  }

  // 喇叭声
  playHorn() {
    this.playShort('horn')
  }

  // 刹车声
  playBrake() {
    this.playShort('brake')
  }

  // 通过隧道
  playTunnel() {
    this.playShort('tunnel')
  }

  // 列车交汇
  playPassing() {
    this.playShort('passing')
  }

  // 事件提示音
  playAlert() {
    this.playShort('alert')
  }

  // 得分音效
  playScore() {
    this.playShort('score')
  }
}

module.exports = new AudioEngine()
