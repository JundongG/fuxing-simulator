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
    var info = wx.getSystemInfoSync()
    this.screenWidth = info.screenWidth
    this.screenHeight = info.screenHeight
    this.pixelRatio = info.pixelRatio || 2
    console.log('[GW] 系统:', info.model, info.screenWidth + 'x' + info.screenHeight)
  }
}

module.exports = GW
