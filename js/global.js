// js/global.js — 全局状态管理器

// === 通用辅助函数（消除多文件重复定义） ===
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

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

// 导出共享工具
GW.roundRect = roundRect

module.exports = GW
