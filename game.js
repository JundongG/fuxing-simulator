// game.js — 高铁五七班 入口（纯Canvas小游戏）v1.0
try {
  var GW = require('./js/global')
  var homeScene = require('./js/home')
  var sceneScene = require('./js/scene')
  var driveScene = require('./js/drive')
  var resultScene = require('./js/result')
  console.log('[Game] 模块加载成功')
} catch (e) {
  console.error('[Game] 模块加载失败:', e.message, e.stack)
}

// 初始化全局状态
try {
  GW.init()
  console.log('[Game] 全局初始化成功')
} catch (e) {
  console.error('[Game] 全局初始化失败:', e.message)
}

// 创建Canvas
var canvas, ctx
try {
  canvas = wx.createCanvas()
  ctx = canvas.getContext('2d')
  canvas.width = GW.screenWidth * GW.pixelRatio
  canvas.height = GW.screenHeight * GW.pixelRatio
  ctx.scale(GW.pixelRatio, GW.pixelRatio)
  GW.canvas = canvas
  GW.ctx = ctx
  console.log('[Game] Canvas创建成功:', canvas.width, 'x', canvas.height)
} catch (e) {
  console.error('[Game] Canvas创建失败:', e.message)
}

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
try {
  homeScene.init()
  GW.currentScreen = 'home'
  console.log('[Game] 首页初始化成功')
} catch (e) {
  console.error('[Game] 首页初始化失败:', e.message, e.stack)
}

// === 主循环 ===
var frameCount = 0
var hasDrawnOnce = false

function gameLoop() {
  try {
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

      if (!hasDrawnOnce) {
        hasDrawnOnce = true
        console.log('[Game] 首次绘制完成!')
      }
    }

    frameCount++
    if (frameCount === 1) {
      console.log('[Game] 游戏循环启动，第一帧完成')
    }
  } catch (e) {
    console.error('[Game] 游戏循环错误:', e.message, e.stack)
  }

  requestAnimationFrame(gameLoop)
}

// === 触摸事件（小游戏API） ===
try {
  wx.onTouchStart(function(e) {
    try {
      var touch = e.changedTouches[0]
      var x = touch.clientX
      var y = touch.clientY

      var scene = scenes[currentSceneName]
      if (scene && scene.handleTouch) {
        scene.handleTouch(x, y)
      }
    } catch (err) {
      console.error('[Game] 触摸处理错误:', err.message)
    }
  })
  console.log('[Game] 触摸事件注册成功')
} catch (e) {
  console.error('[Game] 触摸事件注册失败:', e.message)
}

// 启动游戏循环
requestAnimationFrame(gameLoop)

console.log('[Game] 高铁五七班 v1.0 启动!')
console.log('[Game] 屏幕:', GW.screenWidth, 'x', GW.screenHeight, '@' + GW.pixelRatio + 'x')
