// game.js — 高铁五七班 入口（纯Canvas小游戏）
var GW = require('./js/global')
var homeScene = require('./js/home')
var sceneScene = require('./js/scene')
var driveScene = require('./js/drive')
var resultScene = require('./js/result')

// 初始化全局状态
GW.init()

// 创建Canvas
var canvas = wx.createCanvas()
var ctx = canvas.getContext('2d')
canvas.width = GW.screenWidth * GW.pixelRatio
canvas.height = GW.screenHeight * GW.pixelRatio
ctx.scale(GW.pixelRatio, GW.pixelRatio)

GW.canvas = canvas
GW.ctx = ctx

// 场景映射
var scenes = {
  home: homeScene,
  scene: sceneScene,
  drive: driveScene,
  result: resultScene
}

var currentSceneName = 'home'
var lastSceneName = ''

// 初始化首页
homeScene.init()
GW.currentScreen = 'home'

// === 主循环 ===
function gameLoop() {
  var screenName = GW.currentScreen

  // 场景切换
  if (screenName !== lastSceneName) {
    console.log('[Game] 切换场景:', lastSceneName, '->', screenName)

    // 退出旧场景
    if (lastSceneName === 'drive' && driveScene.stopLoop) {
      driveScene.stopLoop()
    }

    // 进入新场景
    var scene = scenes[screenName]
    if (scene && scene.init) {
      scene.init()
    }
    lastSceneName = screenName
    currentSceneName = screenName
  }

  // 更新
  var scene = scenes[currentSceneName]
  if (scene && scene.update) {
    scene.update()
  }

  // 绘制
  ctx.clearRect(0, 0, GW.screenWidth, GW.screenHeight)
  if (scene && scene.draw) {
    scene.draw(ctx, GW.screenWidth, GW.screenHeight)
  }

  requestAnimationFrame(gameLoop)
}

// === 触摸事件（小游戏API） ===
wx.onTouchStart(function(e) {
  var touch = e.changedTouches[0]
  var x = touch.clientX
  var y = touch.clientY

  var scene = scenes[currentSceneName]
  if (scene && scene.handleTouch) {
    scene.handleTouch(x, y)
  }
})

// 启动游戏循环
requestAnimationFrame(gameLoop)

console.log('[Game] 高铁五七班启动完成!')
console.log('[Game] 屏幕:', GW.screenWidth, 'x', GW.screenHeight)
