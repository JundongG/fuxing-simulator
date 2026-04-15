// js/global.js — 全局状态管理器
var GW = {
  // 系统信息
  screenWidth: 375,
  screenHeight: 812,
  pixelRatio: 2,
  
  // 游戏状态
  selectedChar: null,
  currentScene: null,
  lastResult: null,
  
  // 当前场景名
  currentScreen: 'home',
  
  // Canvas 和 ctx
  canvas: null,
  ctx: null,
  
  // 场景实例
  scene: null,
  
  // 初始化系统信息
  init: function() {
    try {
      var info = wx.getSystemInfoSync()
      this.screenWidth = info.screenWidth || 375
      this.screenHeight = info.screenHeight || 812
      this.pixelRatio = info.pixelRatio || 2
      console.log('[GW] 系统:', info.model || 'unknown', this.screenWidth + 'x' + this.screenHeight)
    } catch (e) {
      console.warn('[GW] getSystemInfoSync失败，使用默认值:', e.message)
    }
  }
}

module.exports = GW
