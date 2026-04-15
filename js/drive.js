// js/drive.js — 驾驶界面 v1.0（信号灯+限速曲线+简化操作）
var GW = require('./global')
var Renderer = require('./renderer')

var renderer = null
var touchAreas = []
var animFrameId = null
var gameTimer = null
var startTime = 0

// === 游戏状态 ===
var state = {
  speed: 0,
  mileage: 0,
  score: 0,
  maxSpeed: 0,
  targetMileage: 0,
  targetTime: 0,
  timeElapsed: 0,
  paused: false,
  gameOver: false,
  sceneConfig: null
}

var targetSpeed = 0

// === 信号灯系统 ===
var signals = []         // [{mileage, type:'green'|'yellow'|'red', handled:false, violated:false}]
var currentSignal = null // 当前最近的未处理信号
var signalWarning = ''   // 信号提示文字

// === 限速曲线 ===
var speedLimits = []     // [{startMile, endMile, limit, label}]
var currentLimit = 350
var limitWarning = ''
var limitWarningTimer = 0

// === 调度信息 ===
var dispatchInfo = '请加速至巡航速度'
var arrivalCountdown = ''

// === 三维评分追踪 ===
var scoreTrack = {
  // 准点
  arrived: false,
  punctuality: 100,    // 0-100
  // 节能
  accelCount: 0,       // 加速次数
  brakeCount: 0,       // 刹车次数
  energyScore: 100,    // 0-100
  // 乘客满意度
  harshAccel: 0,       // 急加速次数（速度差>60）
  harshBrake: 0,       // 急减速次数（速度差>60）
  signalViolations: 0, // 信号违规
  overSpeedCount: 0,   // 超速次数
  satisfaction: 100    // 0-100
}

// 上一帧速度（用于检测急加急减）
var lastSpeed = 0

// === 天气效果 ===
var weatherEffect = {
  raindrops: [],
  snowflakes: [],
  brakeMultiplier: 1.0  // 制动距离倍率
}

// === 初始化 ===
function init() {
  var scene = GW.currentScene
  state.sceneConfig = scene ? scene.config : {
    time: 'day', weather: 'clear', terrain: 'plain', speedLimit: 350, landmarks: []
  }

  // 根据线路距离设置目标里程（5-15分钟的游戏，均速200km/h）
  var routeDistance = scene && scene.distance ? scene.distance : 30
  state.targetMileage = Math.max(15, Math.min(routeDistance * 0.15, 50)) // 缩放到15-50km
  state.targetTime = Math.round(state.targetMileage / 200 * 3600 * 0.5) // 均速200，压缩到50%

  state.speed = 0
  state.mileage = 0
  state.score = 0
  state.maxSpeed = 0
  state.timeElapsed = 0
  state.paused = false
  state.gameOver = false
  targetSpeed = 0
  lastSpeed = 0

  currentLimit = state.sceneConfig.speedLimit || 350
  limitWarning = ''
  limitWarningTimer = 0
  signalWarning = ''
  dispatchInfo = '请加速至巡航速度'
  arrivalCountdown = ''

  // 重置评分
  scoreTrack = {
    arrived: false,
    punctuality: 100,
    accelCount: 0,
    brakeCount: 0,
    energyScore: 100,
    harshAccel: 0,
    harshBrake: 0,
    signalViolations: 0,
    overSpeedCount: 0,
    satisfaction: 100
  }

  // 生成信号灯
  generateSignals()

  // 生成限速曲线
  generateSpeedLimits()

  // 初始化天气效果
  initWeather()

  // 创建渲染器
  var w = GW.screenWidth
  var h = GW.screenHeight
  renderer = new Renderer(GW.ctx, w, h, state.sceneConfig)

  // 开始循环
  startTime = Date.now()
  startLoop()
}

// === 信号灯生成 ===
function generateSignals() {
  signals = []
  var totalDist = state.targetMileage
  var km = 3 + Math.random() * 2

  while (km < totalDist - 2) {
    // 越接近终点，出现黄灯/红灯概率越高
    var progress = km / totalDist
    var r = Math.random()
    var type = 'green'
    if (r < 0.15 + progress * 0.3) type = 'yellow'
    if (r < 0.05 + progress * 0.15) type = 'red'

    // 如果上一个是红/黄，这个大概率是绿
    var lastSignal = signals[signals.length - 1]
    if (lastSignal && lastSignal.type !== 'green' && Math.random() < 0.7) {
      type = 'green'
    }

    signals.push({
      mileage: km,
      type: type,
      handled: false,
      violated: false,
      active: true  // 信号灯是否还亮着（通过后变绿）
    })

    km += 3 + Math.random() * 5 // 信号间距3-8km
  }

  // 最后一个信号（接近终点）
  signals.push({
    mileage: totalDist - 2,
    type: 'red', // 终点前必须停车
    handled: false,
    violated: false,
    active: true
  })

  currentSignal = signals[0] || null
}

// === 限速曲线生成 ===
function generateSpeedLimits() {
  speedLimits = []
  var totalDist = state.targetMileage
  var maxSpd = state.sceneConfig.speedLimit || 350

  // 进站限速曲线（最后5km逐步降速）
  speedLimits.push({ startMile: 0, endMile: totalDist - 5, limit: maxSpd, label: '巡航' })
  speedLimits.push({ startMile: totalDist - 5, endMile: totalDist - 3, limit: Math.min(maxSpd, 250), label: '进站预告' })
  speedLimits.push({ startMile: totalDist - 3, endMile: totalDist - 1, limit: 160, label: '进站减速' })
  speedLimits.push({ startMile: totalDist - 1, endMile: totalDist, limit: 80, label: '站台接近' })

  // 隧道限速（随机插入1-2个）
  if (state.sceneConfig.terrain === 'tunnel' || state.sceneConfig.terrain === 'mountain') {
    var tunnelStart = 8 + Math.random() * 10
    var tunnelEnd = tunnelStart + 2 + Math.random() * 3
    if (tunnelEnd < totalDist - 6) {
      speedLimits.push({ startMile: tunnelStart, endMile: tunnelEnd, limit: 200, label: '隧道限速' })
    }
  }

  // 弯道限速
  var curveStart = 12 + Math.random() * 8
  if (curveStart < totalDist - 8) {
    speedLimits.push({ startMile: curveStart, endMile: curveStart + 1.5, limit: 250, label: '弯道限速' })
  }

  currentLimit = maxSpd
}

// === 天气初始化 ===
function initWeather() {
  var weather = state.sceneConfig.weather
  weatherEffect.raindrops = []
  weatherEffect.snowflakes = []

  if (weather === 'rain') {
    weatherEffect.brakeMultiplier = 1.4 // 雨天制动距离+40%
    for (var i = 0; i < 60; i++) {
      weatherEffect.raindrops.push({
        x: Math.random() * GW.screenWidth,
        y: Math.random() * GW.screenHeight,
        speed: 8 + Math.random() * 6,
        length: 10 + Math.random() * 15
      })
    }
  } else if (weather === 'snow') {
    weatherEffect.brakeMultiplier = 1.6 // 雪天制动距离+60%
    for (var i = 0; i < 40; i++) {
      weatherEffect.snowflakes.push({
        x: Math.random() * GW.screenWidth,
        y: Math.random() * GW.screenHeight,
        speed: 1.5 + Math.random() * 2,
        drift: Math.random() * 2 - 1,
        size: 1 + Math.random() * 3,
        opacity: 0.4 + Math.random() * 0.6
      })
    }
  } else {
    weatherEffect.brakeMultiplier = 1.0
  }
}

// === 游戏循环 ===
function startLoop() {
  if (animFrameId) clearTimeout(animFrameId)

  gameTimer = setInterval(function() {
    if (!state.paused) {
      state.timeElapsed = Math.floor((Date.now() - startTime) / 1000)
    }
  }, 1000)

  var loop = function() {
    if (!state.paused && !state.gameOver) {
      update()
    }
    animFrameId = setTimeout(loop, 16)
  }
  loop()
}

function stopLoop() {
  if (animFrameId) { clearTimeout(animFrameId); animFrameId = null }
  if (gameTimer) { clearInterval(gameTimer); gameTimer = null }
}

// === 物理更新 ===
function update() {
  var dt = 1 / 60
  var prevSpeed = state.speed

  // 里程增加
  state.mileage += (state.speed / 3600) * dt * 60

  // 最高速度
  if (state.speed > state.maxSpeed) state.maxSpeed = state.speed

  // 物理：加速和减速（受天气影响）
  if (targetSpeed < state.speed) {
    var baseDrag = state.speed > 200 ? 0.8 : 0.3
    var drag = baseDrag * weatherEffect.brakeMultiplier
    state.speed = Math.max(targetSpeed, state.speed - drag)
  } else if (targetSpeed > state.speed) {
    var acc = state.speed < 100 ? 1.5 : 0.8
    state.speed = Math.min(targetSpeed, state.speed + acc)
  }

  // 检测急加速/急减速（乘客满意度）
  var speedDelta = state.speed - prevSpeed
  if (speedDelta > 3) { // 急加速
    scoreTrack.accelCount++
    if (speedDelta > 4) scoreTrack.harshAccel++
  }
  if (speedDelta < -3) { // 急减速
    scoreTrack.brakeCount++
    if (speedDelta < -4) scoreTrack.harshBrake++
  }

  // 超速检测
  if (state.speed > currentLimit + 5) {
    scoreTrack.overSpeedCount++
    if (scoreTrack.overSpeedCount % 30 === 0) { // 每30帧扣一次
      scoreTrack.satisfaction = Math.max(0, scoreTrack.satisfaction - 2)
      limitWarning = '⚠️ 超速！限速' + currentLimit + 'km/h'
      limitWarningTimer = 120
    }
  }

  // 更新限速
  updateSpeedLimit()

  // 更新信号灯
  updateSignals()

  // 更新调度信息
  updateDispatchInfo()

  // 更新天气效果
  updateWeather()

  // 限速警告倒计时
  if (limitWarningTimer > 0) limitWarningTimer--
  if (limitWarningTimer <= 0) limitWarning = ''

  // 检查是否到达目标里程
  if (state.mileage >= state.targetMileage) {
    finishDrive(true)
  }

  // 检查超时
  if (state.timeElapsed > state.targetTime * 2) {
    finishDrive(false)
  }

  lastSpeed = state.speed
}

// === 限速更新 ===
function updateSpeedLimit() {
  var newLimit = state.sceneConfig.speedLimit || 350
  var newLabel = ''

  for (var i = 0; i < speedLimits.length; i++) {
    var sl = speedLimits[i]
    if (state.mileage >= sl.startMile && state.mileage < sl.endMile) {
      newLimit = sl.limit
      newLabel = sl.label
      break
    }
  }

  if (newLimit !== currentLimit) {
    if (newLimit < currentLimit) {
      limitWarning = '📉 ' + (newLabel || '限速') + '：' + newLimit + 'km/h'
      limitWarningTimer = 180
    }
    currentLimit = newLimit
    // 自动限制目标速度
    if (targetSpeed > currentLimit) {
      targetSpeed = currentLimit
    }
  }
}

// === 信号灯更新 ===
function updateSignals() {
  if (!currentSignal) return

  var distToSignal = currentSignal.mileage - state.mileage

  // 更新当前最近的未处理信号
  for (var i = 0; i < signals.length; i++) {
    if (!signals[i].handled) {
      currentSignal = signals[i]
      break
    }
  }

  if (!currentSignal || currentSignal.handled) {
    currentSignal = null
    signalWarning = ''
    return
  }

  distToSignal = currentSignal.mileage - state.mileage

  // 信号灯提示（距离2km内开始提醒）
  if (distToSignal > 0 && distToSignal < 2) {
    var typeText = { green: '🟢 绿灯通过', yellow: '🟡 黄灯减速至200', red: '🔴 红灯停车' }
    signalWarning = typeText[currentSignal.type] + ' | ' + distToSignal.toFixed(1) + 'km'
  }

  // 到达信号灯位置
  if (distToSignal <= 0.05 && !currentSignal.handled) {
    checkSignalViolation(currentSignal)
    currentSignal.handled = true

    // 通过后信号变绿
    currentSignal.active = false
  }
}

// === 信号违规检测 ===
function checkSignalViolation(signal) {
  if (signal.type === 'green') {
    // 绿灯：正常通过
    state.score += 20
    dispatchInfo = '信号正常，继续行驶'
  } else if (signal.type === 'yellow') {
    // 黄灯：速度必须降到200以下
    if (state.speed > 220) {
      scoreTrack.signalViolations++
      scoreTrack.satisfaction = Math.max(0, scoreTrack.satisfaction - 10)
      state.score = Math.max(0, state.score - 50)
      dispatchInfo = '❌ 黄灯未减速！扣分'
      limitWarning = '❌ 冒进黄灯！当前' + Math.round(state.speed) + 'km/h'
      limitWarningTimer = 180
    } else {
      state.score += 40
      dispatchInfo = '✅ 黄灯减速正确'
    }
  } else if (signal.type === 'red') {
    // 红灯：必须停车（速度<10）
    if (state.speed > 30) {
      scoreTrack.signalViolations++
      scoreTrack.satisfaction = Math.max(0, scoreTrack.satisfaction - 20)
      state.score = Math.max(0, state.score - 100)
      dispatchInfo = '❌ 冒进红灯！紧急制动！'
      limitWarning = '🚨 冒进红灯！！'
      limitWarningTimer = 240
      // 紧急制动
      targetSpeed = 0
    } else {
      state.score += 80
      dispatchInfo = '✅ 红灯停车正确，等待信号...'
      // 模拟等待后信号变绿
      setTimeout(function() {
        if (!state.gameOver) {
          dispatchInfo = '🟢 信号变绿，可以出发'
          signalWarning = ''
        }
      }, 2000)
    }
  }
}

// === 调度信息更新 ===
function updateDispatchInfo() {
  var remaining = state.targetMileage - state.mileage

  if (remaining > 0) {
    arrivalCountdown = remaining.toFixed(1) + 'km'
  }

  // 根据当前限速给建议
  if (state.speed < 50 && state.mileage > 2 && remaining > 3) {
    if (dispatchInfo.indexOf('❌') === -1 && dispatchInfo.indexOf('✅') === -1) {
      dispatchInfo = '调度：请加速行驶'
    }
  } else if (remaining < 3 && state.speed > 200) {
    dispatchInfo = '调度：前方即将到站，请减速'
  } else if (remaining < 1 && state.speed > 80) {
    dispatchInfo = '调度：已接近站台，请制动停车'
  } else if (remaining < 0.3 && state.speed < 20) {
    dispatchInfo = '调度：列车即将到站'
  }
}

// === 天气效果更新 ===
function updateWeather() {
  var w = GW.screenWidth
  var h = GW.screenHeight
  var speedFactor = state.speed / 350

  // 雨滴
  for (var i = 0; i < weatherEffect.raindrops.length; i++) {
    var drop = weatherEffect.raindrops[i]
    drop.y += drop.speed + speedFactor * 4
    drop.x -= 1 + speedFactor * 2
    if (drop.y > h) { drop.y = -20; drop.x = Math.random() * w }
    if (drop.x < 0) drop.x = w
  }

  // 雪花
  for (var i = 0; i < weatherEffect.snowflakes.length; i++) {
    var flake = weatherEffect.snowflakes[i]
    flake.y += flake.speed + speedFactor * 2
    flake.x += Math.sin(Date.now() / 1000 + i) * flake.drift
    if (flake.y > h) { flake.y = -10; flake.x = Math.random() * w }
    if (flake.x > w) flake.x = 0
    if (flake.x < 0) flake.x = w
  }
}

// === 绘制 ===
function draw(ctx, w, h) {
  touchAreas = []

  // 渲染场景
  if (renderer) {
    renderer.draw(state.speed, state.mileage)
  }

  // 天气效果叠加
  drawWeatherOverlay(ctx, w, h)

  // 顶部HUD
  drawHUD(ctx, w, h)

  // 信号灯显示
  drawSignalDisplay(ctx, w)

  // 限速警告
  if (limitWarningTimer > 0) {
    drawLimitWarning(ctx, w)
  }

  // 调度信息条
  drawDispatchBar(ctx, w)

  // 底部操作区
  drawControls(ctx, w, h)
}

// === 天气叠加层 ===
function drawWeatherOverlay(ctx, w, h) {
  var weather = state.sceneConfig.weather

  if (weather === 'rain') {
    ctx.strokeStyle = 'rgba(180, 210, 255, 0.3)'
    ctx.lineWidth = 1.5
    for (var i = 0; i < weatherEffect.raindrops.length; i++) {
      var drop = weatherEffect.raindrops[i]
      ctx.beginPath()
      ctx.moveTo(drop.x, drop.y)
      ctx.lineTo(drop.x - 3, drop.y + drop.length)
      ctx.stroke()
    }
    // 雨天模糊效果
    ctx.fillStyle = 'rgba(100, 130, 180, 0.08)'
    ctx.fillRect(0, 0, w, h)
  } else if (weather === 'snow') {
    ctx.fillStyle = '#fff'
    for (var i = 0; i < weatherEffect.snowflakes.length; i++) {
      var flake = weatherEffect.snowflakes[i]
      ctx.globalAlpha = flake.opacity
      ctx.beginPath()
      ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    // 雪天微白雾
    ctx.fillStyle = 'rgba(220, 230, 255, 0.05)'
    ctx.fillRect(0, 0, w, h)
  }
}

// === HUD ===
function drawHUD(ctx, w, h) {
  // 速度（大号居中）
  var speedColor = state.speed > currentLimit ? '#ef5350' : '#fff'
  ctx.fillStyle = speedColor
  ctx.font = 'bold 52px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(Math.round(state.speed), w / 2, 52)

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '12px sans-serif'
  ctx.fillText('km/h', w / 2, 68)

  // 里程（左上）
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '11px sans-serif'
  ctx.fillText(state.mileage.toFixed(1) + '/' + state.targetMileage.toFixed(0) + 'km', 12, 28)

  // 倒计时（右上）
  ctx.textAlign = 'right'
  var timeLeft = Math.max(0, state.targetTime - state.timeElapsed)
  var timeColor = timeLeft < 20 ? '#ef5350' : '#fff'
  ctx.fillStyle = timeColor
  ctx.fillText(timeLeft + 's', w - 12, 28)

  // 得分
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '11px sans-serif'
  ctx.fillText('得分 ' + state.score, w / 2, 82)

  // 用时
  var min = Math.floor(state.timeElapsed / 60)
  var sec = state.timeElapsed % 60
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillText((min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec, w / 2, 95)
  ctx.textAlign = 'left'
}

// === 信号灯显示 ===
function drawSignalDisplay(ctx, w) {
  if (!currentSignal || currentSignal.handled) return

  var distToSignal = currentSignal.mileage - state.mileage
  if (distToSignal > 3) return // 3km外不显示

  var barY = 102
  var barH = 32

  // 背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  roundRect(ctx, 10, barY, w - 20, barH, 8)
  ctx.fill()

  // 信号灯圆形
  var lightX = 28
  var lightY = barY + barH / 2
  var colors = { green: '#4caf50', yellow: '#ff9800', red: '#f44336' }
  var glowColors = { green: 'rgba(76,175,80,0.3)', yellow: 'rgba(255,152,0,0.3)', red: 'rgba(244,67,54,0.3)' }

  // 光晕
  ctx.fillStyle = glowColors[currentSignal.type]
  ctx.beginPath()
  ctx.arc(lightX, lightY, 12, 0, Math.PI * 2)
  ctx.fill()

  // 灯
  ctx.fillStyle = colors[currentSignal.type]
  ctx.beginPath()
  ctx.arc(lightX, lightY, 7, 0, Math.PI * 2)
  ctx.fill()

  // 信息文字
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'left'
  var typeNames = { green: '绿灯', yellow: '黄灯', red: '红灯' }
  ctx.fillText(typeNames[currentSignal.type] + ' | ' + distToSignal.toFixed(1) + 'km', 46, barY + 20)

  // 右侧提示
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  var hints = { green: '正常通过', yellow: '减速至200', red: '需停车' }
  ctx.fillText(hints[currentSignal.type], w - 20, barY + 20)
  ctx.textAlign = 'left'
}

// === 限速警告 ===
function drawLimitWarning(ctx, w) {
  var warningH = 36
  var warningY = 140

  // 闪烁效果
  var alpha = 0.6 + Math.sin(Date.now() / 150) * 0.3
  ctx.fillStyle = 'rgba(244, 67, 54, ' + (alpha * 0.8) + ')'
  roundRect(ctx, 10, warningY, w - 20, warningH, 8)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 13px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(limitWarning, w / 2, warningY + 23)
  ctx.textAlign = 'left'
}

// === 调度信息条 ===
function drawDispatchBar(ctx, w) {
  var barY = 180
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  roundRect(ctx, 10, barY, w - 20, 24, 12)
  ctx.fill()

  ctx.fillStyle = '#4fc3f7'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(dispatchInfo, w / 2, barY + 16)
  ctx.textAlign = 'left'

  // 进度条
  var progY = barY + 28
  var progW = w - 20
  var progress = Math.min(1, state.mileage / state.targetMileage)
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  roundRect(ctx, 10, progY, progW, 4, 2)
  ctx.fill()
  ctx.fillStyle = '#4fc3f7'
  roundRect(ctx, 10, progY, progW * progress, 4, 2)
  ctx.fill()
}

// === 操作控件 ===
function drawControls(ctx, w, h) {
  // 限速指示条
  var barY = h - 200
  var barW = w - 40
  var barH = 6
  var fillW = barW * (state.speed / 350)
  var fillColor = state.speed > currentLimit ? '#ef5350' : state.speed > 200 ? '#ffa726' : '#4fc3f7'

  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  roundRect(ctx, 20, barY, barW, barH, 3)
  ctx.fill()
  ctx.fillStyle = fillColor
  roundRect(ctx, 20, barY, Math.min(fillW, barW), barH, 3)
  ctx.fill()

  // 限速标记线
  var limitX = 20 + barW * (currentLimit / 350)
  if (limitX < 20 + barW) {
    ctx.strokeStyle = '#ef5350'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(limitX, barY - 4)
    ctx.lineTo(limitX, barY + barH + 4)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#ef5350'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(currentLimit + '', limitX, barY - 6)
    ctx.textAlign = 'left'
  }

  // === 左右分区操作 ===
  var btnY = h - 170
  var btnH = 80
  var halfW = (w - 48) / 2
  var gap = 16

  // 左侧：减速/刹车
  var brakeAlpha = targetSpeed < state.speed ? 0.5 : 0.2
  ctx.fillStyle = 'rgba(239, 83, 80, ' + brakeAlpha + ')'
  roundRect(ctx, 16, btnY, halfW, btnH, 16)
  ctx.fill()
  ctx.strokeStyle = '#ef5350'
  ctx.lineWidth = 1.5
  roundRect(ctx, 16, btnY, halfW, btnH, 16)
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.font = '28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🛑', 16 + halfW / 2, btnY + 35)
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText('减速', 16 + halfW / 2, btnY + 58)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '10px sans-serif'
  ctx.fillText('-60 km/h', 16 + halfW / 2, btnY + 73)

  // 右侧：加速
  var accelAlpha = targetSpeed > state.speed ? 0.5 : 0.2
  ctx.fillStyle = 'rgba(79, 195, 247, ' + accelAlpha + ')'
  roundRect(ctx, 32 + halfW, btnY, halfW, btnH, 16)
  ctx.fill()
  ctx.strokeStyle = '#4fc3f7'
  ctx.lineWidth = 1.5
  roundRect(ctx, 32 + halfW, btnY, halfW, btnH, 16)
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.font = '28px sans-serif'
  ctx.fillText('⚡', 32 + halfW + halfW / 2, btnY + 35)
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText('加速', 32 + halfW + halfW / 2, btnY + 58)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '10px sans-serif'
  ctx.fillText('+40 km/h', 32 + halfW + halfW / 2, btnY + 73)
  ctx.textAlign = 'left'

  touchAreas.push({ x: 16, y: btnY, w: halfW, h: btnH, type: 'brake' })
  touchAreas.push({ x: 32 + halfW, y: btnY, w: halfW, h: btnH, type: 'accel' })

  // === 底部操作栏 ===
  var barBottom = h - 65
  var smallBtnW = (w - 48) / 2

  // 暂停/继续
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, 16, barBottom, smallBtnW, 36, 8)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '13px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(state.paused ? '▶ 继续' : '⏸ 暂停', 16 + smallBtnW / 2, barBottom + 23)

  // 结束驾驶
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, 32 + smallBtnW, barBottom, smallBtnW, 36, 8)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillText('🏁 到站', 32 + smallBtnW + smallBtnW / 2, barBottom + 23)
  ctx.textAlign = 'left'

  touchAreas.push({ x: 16, y: barBottom, w: smallBtnW, h: 36, type: 'pause' })
  touchAreas.push({ x: 32 + smallBtnW, y: barBottom, w: smallBtnW, h: 36, type: 'finish' })
}

// === 辅助绘制函数 ===
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

// === 触摸处理 ===
function handleTouch(x, y) {
  for (var i = 0; i < touchAreas.length; i++) {
    var a = touchAreas[i]
    if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) {
      if (a.type === 'brake') {
        var step = 60 * weatherEffect.brakeMultiplier
        targetSpeed = Math.max(0, targetSpeed - step)
        scoreTrack.brakeCount++
        return
      }
      if (a.type === 'accel') {
        var limit = Math.min(currentLimit, state.sceneConfig.speedLimit || 350)
        targetSpeed = Math.min(limit, targetSpeed + 40)
        targetSpeed = Math.min(380, targetSpeed)
        scoreTrack.accelCount++
        return
      }
      if (a.type === 'pause') {
        state.paused = !state.paused
        return
      }
      if (a.type === 'finish') {
        finishDrive(state.mileage >= state.targetMileage * 0.8)
        return
      }
    }
  }
}

// === 结束驾驶 ===
function finishDrive(arrived) {
  state.gameOver = true
  stopLoop()
  scoreTrack.arrived = arrived

  // 计算三维评分

  // 1. 准点率
  if (arrived) {
    var timeLeft = state.targetTime - state.timeElapsed
    if (timeLeft >= 0) {
      scoreTrack.punctuality = Math.min(100, 80 + Math.round(timeLeft / state.targetTime * 20))
    } else {
      scoreTrack.punctuality = Math.max(0, 80 - Math.round((-timeLeft) / state.targetTime * 80))
    }
  } else {
    scoreTrack.punctuality = Math.max(0, 50 - Math.round(state.timeElapsed / state.targetTime * 50))
  }

  // 2. 节能率（操作越少越节能）
  var totalOps = scoreTrack.accelCount + scoreTrack.brakeCount
  var optimalOps = state.targetMileage * 3 // 理想操作次数
  if (totalOps <= optimalOps) {
    scoreTrack.energyScore = Math.min(100, 70 + Math.round((1 - totalOps / optimalOps / 2) * 30))
  } else {
    scoreTrack.energyScore = Math.max(10, 70 - Math.round((totalOps / optimalOps - 1) * 60))
  }

  // 3. 乘客满意度（已实时计算）
  // satisfaction 已在 update 中扣减

  // 综合得分
  var totalScore = Math.round(
    scoreTrack.punctuality * 3 +   // 准点权重最高
    scoreTrack.energyScore * 2 +    // 节能次之
    scoreTrack.satisfaction * 2      // 满意度
  )

  GW.lastResult = {
    mileage: state.mileage.toFixed(1),
    targetMileage: state.targetMileage.toFixed(1),
    maxSpeed: Math.round(state.maxSpeed),
    score: totalScore,
    duration: state.timeElapsed,
    targetTime: state.targetTime,
    arrived: arrived,
    sceneTitle: GW.currentScene ? GW.currentScene.title : '自由驾驶',

    // 三维评分
    punctuality: scoreTrack.punctuality,
    energyScore: scoreTrack.energyScore,
    satisfaction: scoreTrack.satisfaction,

    // 统计
    accelCount: scoreTrack.accelCount,
    brakeCount: scoreTrack.brakeCount,
    harshAccel: scoreTrack.harshAccel,
    harshBrake: scoreTrack.harshBrake,
    signalViolations: scoreTrack.signalViolations
  }

  GW.currentScreen = 'result'
}

module.exports = {
  init: init,
  update: update,
  draw: draw,
  handleTouch: handleTouch,
  stopLoop: stopLoop
}
