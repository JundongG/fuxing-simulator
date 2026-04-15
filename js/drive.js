// js/drive.js — 驾驶界面 v1.1（仪表盘+高品质天气）
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
var signals = []
var currentSignal = null
var signalWarning = ''

// === 限速曲线 ===
var speedLimits = []
var currentLimit = 350
var limitWarning = ''
var limitWarningTimer = 0

// === 调度信息 ===
var dispatchInfo = '请加速至巡航速度'
var arrivalCountdown = ''

// === 三维评分追踪 ===
var scoreTrack = {
  arrived: false, punctuality: 100, energyScore: 100, satisfaction: 100,
  accelCount: 0, brakeCount: 0, harshAccel: 0, harshBrake: 0,
  signalViolations: 0, overSpeedCount: 0
}
var lastSpeed = 0

// === 天气效果 ===
var weather = {
  raindrops: [],
  splashes: [],       // 水花
  waterTrails: [],    // 玻璃水痕
  snowflakes: [],
  fogAlpha: 0,
  brakeMultiplier: 1.0,
  visibility: 1.0     // 能见度 0-1
}

// === 手柄状态 ===
var handleState = {
  throttle: 0,  // 0-100 牵引手柄位置
  brake: 0      // 0-100 制动手柄位置
}

// === 初始化 ===
function init() {
  var scene = GW.currentScene
  state.sceneConfig = scene ? scene.config : {
    time: 'day', weather: 'clear', terrain: 'plain', speedLimit: 350, landmarks: []
  }

  var routeDistance = scene && scene.distance ? scene.distance : 30
  state.targetMileage = Math.max(15, Math.min(routeDistance * 0.15, 50))
  state.targetTime = Math.round(state.targetMileage / 200 * 3600 * 0.5)

  state.speed = 0; state.mileage = 0; state.score = 0; state.maxSpeed = 0
  state.timeElapsed = 0; state.paused = false; state.gameOver = false
  targetSpeed = 0; lastSpeed = 0

  currentLimit = state.sceneConfig.speedLimit || 350
  limitWarning = ''; limitWarningTimer = 0; signalWarning = ''
  dispatchInfo = '请加速至巡航速度'; arrivalCountdown = ''
  handleState.throttle = 0; handleState.brake = 0

  scoreTrack = {
    arrived: false, punctuality: 100, energyScore: 100, satisfaction: 100,
    accelCount: 0, brakeCount: 0, harshAccel: 0, harshBrake: 0,
    signalViolations: 0, overSpeedCount: 0
  }

  generateSignals()
  generateSpeedLimits()
  initWeather()

  var w = GW.screenWidth; var h = GW.screenHeight
  renderer = new Renderer(GW.ctx, w, h, state.sceneConfig)

  startTime = Date.now()
  startLoop()
}

// === 信号灯生成 ===
function generateSignals() {
  signals = []
  var totalDist = state.targetMileage
  var km = 3 + Math.random() * 2

  while (km < totalDist - 2) {
    var progress = km / totalDist
    var r = Math.random()
    var type = 'green'
    if (r < 0.15 + progress * 0.3) type = 'yellow'
    if (r < 0.05 + progress * 0.15) type = 'red'
    var lastSignal = signals[signals.length - 1]
    if (lastSignal && lastSignal.type !== 'green' && Math.random() < 0.7) type = 'green'
    signals.push({ mileage: km, type: type, handled: false, violated: false, active: true })
    km += 3 + Math.random() * 5
  }
  signals.push({ mileage: totalDist - 2, type: 'red', handled: false, violated: false, active: true })
  currentSignal = signals[0] || null
}

// === 限速曲线生成 ===
function generateSpeedLimits() {
  speedLimits = []
  var totalDist = state.targetMileage
  var maxSpd = state.sceneConfig.speedLimit || 350
  speedLimits.push({ startMile: 0, endMile: totalDist - 5, limit: maxSpd, label: '巡航' })
  speedLimits.push({ startMile: totalDist - 5, endMile: totalDist - 3, limit: Math.min(maxSpd, 250), label: '进站预告' })
  speedLimits.push({ startMile: totalDist - 3, endMile: totalDist - 1, limit: 160, label: '进站减速' })
  speedLimits.push({ startMile: totalDist - 1, endMile: totalDist, limit: 80, label: '站台接近' })
  if (state.sceneConfig.terrain === 'tunnel' || state.sceneConfig.terrain === 'mountain') {
    var tunnelStart = 8 + Math.random() * 10
    var tunnelEnd = tunnelStart + 2 + Math.random() * 3
    if (tunnelEnd < totalDist - 6) speedLimits.push({ startMile: tunnelStart, endMile: tunnelEnd, limit: 200, label: '隧道限速' })
  }
  var curveStart = 12 + Math.random() * 8
  if (curveStart < totalDist - 8) speedLimits.push({ startMile: curveStart, endMile: curveStart + 1.5, limit: 250, label: '弯道限速' })
  currentLimit = maxSpd
}

// === 天气初始化 ===
function initWeather() {
  var w = GW.screenWidth; var h = GW.screenHeight
  var wtype = state.sceneConfig.weather
  weather.raindrops = []; weather.splashes = []; weather.waterTrails = []
  weather.snowflakes = []; weather.fogAlpha = 0

  if (wtype === 'rain') {
    weather.brakeMultiplier = 1.4; weather.visibility = 0.7
    // 雨滴（斜线）
    for (var i = 0; i < 80; i++) {
      weather.raindrops.push({
        x: Math.random() * w * 1.5, y: Math.random() * h,
        speed: 10 + Math.random() * 8, length: 12 + Math.random() * 20,
        angle: 0.15 + Math.random() * 0.1, // 倾斜角度
        opacity: 0.2 + Math.random() * 0.4, width: 0.5 + Math.random() * 1.5
      })
    }
    // 玻璃水痕（粘在玻璃上的水珠轨迹）
    for (var i = 0; i < 8; i++) {
      weather.waterTrails.push({
        x: 30 + Math.random() * (w - 60), y: 20 + Math.random() * (h * 0.5),
        length: 20 + Math.random() * 40, width: 1 + Math.random() * 2,
        opacity: 0.15 + Math.random() * 0.2, drip: Math.random() * 10
      })
    }
    // 水花（打在玻璃上的溅射）
    for (var i = 0; i < 15; i++) {
      weather.splashes.push({
        x: Math.random() * w, y: Math.random() * h * 0.6,
        radius: 1 + Math.random() * 3, life: Math.random(), maxLife: 0.3 + Math.random() * 0.5
      })
    }
  } else if (wtype === 'snow') {
    weather.brakeMultiplier = 1.6; weather.visibility = 0.5; weather.fogAlpha = 0.15
    // 多层雪花（近景大、远景小）
    for (var layer = 0; layer < 3; layer++) {
      var count = layer === 0 ? 15 : layer === 1 ? 25 : 20
      for (var i = 0; i < count; i++) {
        weather.snowflakes.push({
          x: Math.random() * w, y: Math.random() * h,
          speed: (0.5 + layer * 0.8) + Math.random() * (1 + layer),
          drift: Math.random() * 2 - 1, driftSpeed: 0.5 + Math.random(),
          size: (1 + layer * 1.5) + Math.random() * (1 + layer),
          opacity: 0.3 + layer * 0.2 + Math.random() * 0.3,
          layer: layer, wobble: Math.random() * Math.PI * 2
        })
      }
    }
  } else {
    weather.brakeMultiplier = 1.0; weather.visibility = 1.0
  }
}

// === 游戏循环 ===
function startLoop() {
  if (animFrameId) clearTimeout(animFrameId)
  gameTimer = setInterval(function() {
    if (!state.paused) state.timeElapsed = Math.floor((Date.now() - startTime) / 1000)
  }, 1000)
  var loop = function() {
    if (!state.paused && !state.gameOver) update()
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
  var dt = 1 / 60; var prevSpeed = state.speed
  state.mileage += (state.speed / 3600) * dt * 60
  if (state.speed > state.maxSpeed) state.maxSpeed = state.speed

  // 物理
  if (targetSpeed < state.speed) {
    var drag = (state.speed > 200 ? 0.8 : 0.3) * weather.brakeMultiplier
    state.speed = Math.max(targetSpeed, state.speed - drag)
  } else if (targetSpeed > state.speed) {
    var acc = state.speed < 100 ? 1.5 : 0.8
    state.speed = Math.min(targetSpeed, state.speed + acc)
  }

  // 手柄位置跟随
  var targetThrottle = targetSpeed > state.speed ? Math.min(100, (targetSpeed - state.speed) / 3) : 0
  var targetBrake = targetSpeed < state.speed ? Math.min(100, (state.speed - targetSpeed) / 5) : 0
  handleState.throttle += (targetThrottle - handleState.throttle) * 0.1
  handleState.brake += (targetBrake - handleState.brake) * 0.15

  // 评分追踪
  var speedDelta = state.speed - prevSpeed
  if (speedDelta > 3) { scoreTrack.accelCount++; if (speedDelta > 4) scoreTrack.harshAccel++ }
  if (speedDelta < -3) { scoreTrack.brakeCount++; if (speedDelta < -4) scoreTrack.harshBrake++ }
  if (state.speed > currentLimit + 5) {
    scoreTrack.overSpeedCount++
    if (scoreTrack.overSpeedCount % 30 === 0) {
      scoreTrack.satisfaction = Math.max(0, scoreTrack.satisfaction - 2)
      limitWarning = '⚠️ 超速！限速' + currentLimit + 'km/h'; limitWarningTimer = 120
    }
  }

  updateSpeedLimit(); updateSignals(); updateDispatchInfo(); updateWeather()
  if (limitWarningTimer > 0) limitWarningTimer--
  if (limitWarningTimer <= 0) limitWarning = ''
  if (state.mileage >= state.targetMileage) finishDrive(true)
  if (state.timeElapsed > state.targetTime * 2) finishDrive(false)
  lastSpeed = state.speed
}

function updateSpeedLimit() {
  var newLimit = state.sceneConfig.speedLimit || 350; var newLabel = ''
  for (var i = 0; i < speedLimits.length; i++) {
    var sl = speedLimits[i]
    if (state.mileage >= sl.startMile && state.mileage < sl.endMile) { newLimit = sl.limit; newLabel = sl.label; break }
  }
  if (newLimit !== currentLimit) {
    if (newLimit < currentLimit) { limitWarning = '📉 ' + (newLabel || '限速') + '：' + newLimit + 'km/h'; limitWarningTimer = 180 }
    currentLimit = newLimit
    if (targetSpeed > currentLimit) targetSpeed = currentLimit
  }
}

function updateSignals() {
  if (!currentSignal) return
  for (var i = 0; i < signals.length; i++) { if (!signals[i].handled) { currentSignal = signals[i]; break } }
  if (!currentSignal || currentSignal.handled) { currentSignal = null; signalWarning = ''; return }
  var distToSignal = currentSignal.mileage - state.mileage
  if (distToSignal > 0 && distToSignal < 2) {
    var typeText = { green: '🟢 绿灯通过', yellow: '🟡 黄灯减速至200', red: '🔴 红灯停车' }
    signalWarning = typeText[currentSignal.type] + ' | ' + distToSignal.toFixed(1) + 'km'
  }
  if (distToSignal <= 0.05 && !currentSignal.handled) { checkSignalViolation(currentSignal); currentSignal.handled = true; currentSignal.active = false }
}

function checkSignalViolation(signal) {
  if (signal.type === 'green') { state.score += 20; dispatchInfo = '信号正常，继续行驶' }
  else if (signal.type === 'yellow') {
    if (state.speed > 220) {
      scoreTrack.signalViolations++; scoreTrack.satisfaction = Math.max(0, scoreTrack.satisfaction - 10)
      state.score = Math.max(0, state.score - 50); dispatchInfo = '❌ 黄灯未减速！扣分'
      limitWarning = '❌ 冒进黄灯！当前' + Math.round(state.speed) + 'km/h'; limitWarningTimer = 180
    } else { state.score += 40; dispatchInfo = '✅ 黄灯减速正确' }
  } else if (signal.type === 'red') {
    if (state.speed > 30) {
      scoreTrack.signalViolations++; scoreTrack.satisfaction = Math.max(0, scoreTrack.satisfaction - 20)
      state.score = Math.max(0, state.score - 100); dispatchInfo = '❌ 冒进红灯！紧急制动！'
      limitWarning = '🚨 冒进红灯！！'; limitWarningTimer = 240; targetSpeed = 0
    } else {
      state.score += 80; dispatchInfo = '✅ 红灯停车正确，等待信号...'
      setTimeout(function() { if (!state.gameOver) { dispatchInfo = '🟢 信号变绿，可以出发'; signalWarning = '' } }, 2000)
    }
  }
}

function updateDispatchInfo() {
  var remaining = state.targetMileage - state.mileage
  if (remaining > 0) arrivalCountdown = remaining.toFixed(1) + 'km'
  if (state.speed < 50 && state.mileage > 2 && remaining > 3 && dispatchInfo.indexOf('❌') === -1 && dispatchInfo.indexOf('✅') === -1) dispatchInfo = '调度：请加速行驶'
  else if (remaining < 3 && state.speed > 200) dispatchInfo = '调度：前方即将到站，请减速'
  else if (remaining < 1 && state.speed > 80) dispatchInfo = '调度：已接近站台，请制动停车'
  else if (remaining < 0.3 && state.speed < 20) dispatchInfo = '调度：列车即将到站'
}

function updateWeather() {
  var w = GW.screenWidth; var h = GW.screenHeight; var sf = state.speed / 350
  var wtype = state.sceneConfig.weather

  if (wtype === 'rain') {
    for (var i = 0; i < weather.raindrops.length; i++) {
      var d = weather.raindrops[i]
      d.y += d.speed + sf * 6; d.x -= (d.speed * d.angle + sf * 3)
      if (d.y > h) { d.y = -d.length; d.x = Math.random() * w * 1.3 }
      if (d.x < -20) d.x = w + 20
    }
    // 水痕流动
    for (var i = 0; i < weather.waterTrails.length; i++) {
      var t = weather.waterTrails[i]
      t.drip += 0.02 + sf * 0.05
      if (t.drip > 1) { t.y += 5 + Math.random() * 10; t.drip = 0; t.opacity *= 0.95 }
    }
    // 水花生命周期
    for (var i = 0; i < weather.splashes.length; i++) {
      var s = weather.splashes[i]
      s.life += 0.02
      if (s.life > s.maxLife) {
        s.life = 0; s.x = Math.random() * w; s.y = Math.random() * h * 0.6
        s.radius = 1 + Math.random() * 3; s.maxLife = 0.3 + Math.random() * 0.5
      }
    }
  } else if (wtype === 'snow') {
    for (var i = 0; i < weather.snowflakes.length; i++) {
      var f = weather.snowflakes[i]
      f.y += f.speed + sf * (1 + f.layer)
      f.wobble += 0.02 * f.driftSpeed
      f.x += Math.sin(f.wobble) * f.drift + sf * f.layer * 0.5
      if (f.y > h + 10) { f.y = -10; f.x = Math.random() * w }
      if (f.x > w + 10) f.x = -10
      if (f.x < -10) f.x = w + 10
    }
  }
}

// === 绘制 ===
function draw(ctx, w, h) {
  touchAreas = []
  if (renderer) renderer.draw(state.speed, state.mileage)
  drawWeatherOverlay(ctx, w, h)
  drawInstruments(ctx, w, h)
  drawTopHUD(ctx, w)
  if (limitWarningTimer > 0) drawLimitWarning(ctx, w)
  drawDispatchBar(ctx, w)
  drawControls(ctx, w, h)
}

// === 天气叠加层（高质量） ===
function drawWeatherOverlay(ctx, w, h) {
  var wtype = state.sceneConfig.weather

  if (wtype === 'rain') {
    // 1. 雨滴斜线
    ctx.lineCap = 'round'
    for (var i = 0; i < weather.raindrops.length; i++) {
      var d = weather.raindrops[i]
      ctx.strokeStyle = 'rgba(180, 210, 255, ' + d.opacity + ')'
      ctx.lineWidth = d.width
      ctx.beginPath()
      ctx.moveTo(d.x, d.y)
      ctx.lineTo(d.x - d.length * d.angle, d.y + d.length)
      ctx.stroke()
    }

    // 2. 玻璃水痕
    for (var i = 0; i < weather.waterTrails.length; i++) {
      var t = weather.waterTrails[i]
      ctx.fillStyle = 'rgba(160, 200, 240, ' + t.opacity + ')'
      ctx.beginPath()
      ctx.ellipse(t.x, t.y + t.drip, t.width, t.length * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
      // 水痕尾迹
      ctx.strokeStyle = 'rgba(160, 200, 240, ' + (t.opacity * 0.5) + ')'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(t.x, t.y + t.drip + t.length * 0.3)
      ctx.lineTo(t.x + Math.sin(t.drip) * 3, t.y + t.drip + t.length)
      ctx.stroke()
    }

    // 3. 水花溅射
    for (var i = 0; i < weather.splashes.length; i++) {
      var s = weather.splashes[i]
      var progress = s.life / s.maxLife
      var alpha = (1 - progress) * 0.3
      ctx.fillStyle = 'rgba(200, 220, 255, ' + alpha + ')'
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.radius * (1 + progress * 3), 0, Math.PI * 2)
      ctx.fill()
    }

    // 4. 雨天色调（微蓝）
    ctx.fillStyle = 'rgba(80, 110, 160, 0.06)'
    ctx.fillRect(0, 0, w, h)

    // 5. 挡风玻璃边缘雾气
    var edgeGrad = ctx.createRadialGradient(w / 2, h * 0.3, h * 0.3, w / 2, h * 0.3, h * 0.8)
    edgeGrad.addColorStop(0, 'rgba(0,0,0,0)')
    edgeGrad.addColorStop(1, 'rgba(60, 80, 120, 0.12)')
    ctx.fillStyle = edgeGrad
    ctx.fillRect(0, 0, w, h)

  } else if (wtype === 'snow') {
    // 1. 多层雪花
    for (var i = 0; i < weather.snowflakes.length; i++) {
      var f = weather.snowflakes[i]
      ctx.globalAlpha = f.opacity
      if (f.layer === 2) {
        // 近景雪花：模糊大雪花
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2)
        ctx.fill()
        // 光晕
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.size * 2.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1

    // 2. 白雾层
    ctx.fillStyle = 'rgba(200, 215, 235, ' + weather.fogAlpha + ')'
    ctx.fillRect(0, 0, w, h)

    // 3. 能见度降低（从边缘向中心渐变雾）
    var fogGrad = ctx.createRadialGradient(w / 2, h * 0.4, h * 0.2, w / 2, h * 0.4, h * 0.7)
    fogGrad.addColorStop(0, 'rgba(220, 230, 245, 0)')
    fogGrad.addColorStop(1, 'rgba(200, 215, 235, 0.2)')
    ctx.fillStyle = fogGrad
    ctx.fillRect(0, 0, w, h)

    // 4. 地面积雪效果（底部）
    var snowGround = ctx.createLinearGradient(0, h * 0.85, 0, h)
    snowGround.addColorStop(0, 'rgba(255, 255, 255, 0)')
    snowGround.addColorStop(1, 'rgba(255, 255, 255, 0.08)')
    ctx.fillStyle = snowGround
    ctx.fillRect(0, h * 0.85, w, h * 0.15)
  }
}

// === 仪表盘 ===
function drawInstruments(ctx, w, h) {
  // 仪表盘区域在底部
  var panelY = h - 210
  var panelH = 140

  // 半透明仪表台背景
  ctx.fillStyle = 'rgba(10, 10, 20, 0.85)'
  roundRect(ctx, 0, panelY, w, panelH + 10, 0)
  ctx.fill()

  // 上沿发光条
  var topGrad = ctx.createLinearGradient(0, panelY, w, panelY)
  topGrad.addColorStop(0, 'rgba(79, 195, 247, 0)')
  topGrad.addColorStop(0.3, 'rgba(79, 195, 247, 0.3)')
  topGrad.addColorStop(0.7, 'rgba(79, 195, 247, 0.3)')
  topGrad.addColorStop(1, 'rgba(79, 195, 247, 0)')
  ctx.fillStyle = topGrad
  ctx.fillRect(0, panelY, w, 2)

  // === 左侧：信号灯指示 ===
  drawSignalLamps(ctx, 16, panelY + 12)

  // === 中间：圆形速度表 ===
  drawSpeedometer(ctx, w / 2, panelY + 75)

  // === 右侧：限速信息 + 手柄 ===
  drawLimitInfo(ctx, w - 110, panelY + 12)
  drawHandles(ctx, w - 55, panelY + 12)
}

// === 信号灯指示灯 ===
function drawSignalLamps(ctx, x, y) {
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = 'bold 9px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('信号', x + 35, y + 10)

  var colors = ['green', 'yellow', 'red']
  var activeColors = { green: '#4caf50', yellow: '#ff9800', red: '#f44336' }
  var inactiveColor = 'rgba(255,255,255,0.12)'
  var glowColors = { green: 'rgba(76,175,80,0.4)', yellow: 'rgba(255,152,0,0.4)', red: 'rgba(244,67,54,0.4)' }

  for (var i = 0; i < 3; i++) {
    var cx = x + 12 + i * 24
    var cy = y + 32
    var isActive = currentSignal && currentSignal.type === colors[i] && !currentSignal.handled

    // 灯座
    ctx.fillStyle = 'rgba(40,40,50,0.8)'
    ctx.beginPath()
    ctx.arc(cx, cy, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.stroke()

    if (isActive) {
      // 光晕
      ctx.fillStyle = glowColors[colors[i]]
      ctx.beginPath()
      ctx.arc(cx, cy, 14, 0, Math.PI * 2)
      ctx.fill()
      // 亮灯
      ctx.fillStyle = activeColors[colors[i]]
      ctx.beginPath()
      ctx.arc(cx, cy, 7, 0, Math.PI * 2)
      ctx.fill()
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      ctx.arc(cx - 2, cy - 2, 2.5, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // 灭灯
      ctx.fillStyle = inactiveColor
      ctx.beginPath()
      ctx.arc(cx, cy, 6, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // 标签
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = '8px sans-serif'
  ctx.fillText('绿 黄 红', x + 35, y + 52)
  ctx.textAlign = 'left'
}

// === 圆形速度表 ===
function drawSpeedometer(ctx, cx, cy) {
  var radius = 50

  // 外圈
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()

  // 刻度弧（270度弧，从135°到405°）
  var startAngle = Math.PI * 0.75
  var endAngle = Math.PI * 2.25
  var arcRange = endAngle - startAngle

  // 背景弧
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(cx, cy, radius - 8, startAngle, endAngle)
  ctx.stroke()

  // 速度弧（彩色）
  var speedRatio = Math.min(1, state.speed / 350)
  var speedAngle = startAngle + arcRange * speedRatio
  var arcColor = state.speed > currentLimit ? '#ef5350' : state.speed > 250 ? '#ffa726' : '#4fc3f7'
  ctx.strokeStyle = arcColor
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, radius - 8, startAngle, speedAngle)
  ctx.stroke()
  ctx.lineCap = 'butt'

  // 限速标记
  var limitRatio = currentLimit / 350
  var limitAngle = startAngle + arcRange * limitRatio
  var lx = cx + Math.cos(limitAngle) * (radius - 8)
  var ly = cy + Math.sin(limitAngle) * (radius - 8)
  ctx.fillStyle = '#ef5350'
  ctx.beginPath()
  ctx.arc(lx, ly, 3, 0, Math.PI * 2)
  ctx.fill()

  // 刻度线
  for (var i = 0; i <= 7; i++) {
    var ratio = i / 7
    var angle = startAngle + arcRange * ratio
    var outerR = radius - 2
    var innerR = radius - (i % 2 === 0 ? 12 : 8)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = i % 2 === 0 ? 1.5 : 0.8
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR)
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR)
    ctx.stroke()

    // 数字标签
    if (i % 2 === 0) {
      var labelR = radius - 18
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(Math.round(ratio * 350) + '', cx + Math.cos(angle) * labelR, cy + Math.sin(angle) * labelR)
    }
  }

  // 指针
  var needleAngle = startAngle + arcRange * speedRatio
  var needleLen = radius - 15
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(needleAngle) * needleLen, cy + Math.sin(needleAngle) * needleLen)
  ctx.stroke()

  // 中心圆
  ctx.fillStyle = 'rgba(30,30,40,0.9)'
  ctx.beginPath()
  ctx.arc(cx, cy, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = arcColor
  ctx.beginPath()
  ctx.arc(cx, cy, 4, 0, Math.PI * 2)
  ctx.fill()

  // 速度数字
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 22px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(Math.round(state.speed), cx, cy + 22)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '9px sans-serif'
  ctx.fillText('km/h', cx, cy + 34)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

// === 限速信息 ===
function drawLimitInfo(ctx, x, y) {
  // 限速标志牌（模仿真实圆形限速牌）
  var bx = x + 30; var by = y + 22
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(bx, by, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ef5350'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(bx, by, 16, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(bx, by, 12, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = '#333'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(currentLimit, bx, by)
  ctx.textBaseline = 'alphabetic'

  // 当前是否超速
  var isOver = state.speed > currentLimit + 5
  ctx.fillStyle = isOver ? '#ef5350' : 'rgba(255,255,255,0.5)'
  ctx.font = '9px sans-serif'
  ctx.fillText(isOver ? '超速!' : '限速', bx, by + 24)
  ctx.textAlign = 'left'
}

// === 牵引/制动手柄 ===
function drawHandles(ctx, x, y) {
  var barW = 12; var barH = 65

  // 牵引手柄
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  roundRect(ctx, x, y + 8, barW, barH, 4)
  ctx.fill()
  var throttleH = barH * (handleState.throttle / 100)
  if (throttleH > 0) {
    var tGrad = ctx.createLinearGradient(x, y + 8 + barH - throttleH, x, y + 8 + barH)
    tGrad.addColorStop(0, '#4fc3f7')
    tGrad.addColorStop(1, 'rgba(79,195,247,0.3)')
    ctx.fillStyle = tGrad
    roundRect(ctx, x, y + 8 + barH - throttleH, barW, throttleH, 4)
    ctx.fill()
  }
  // 手柄滑块
  var throttleY = y + 8 + barH - throttleH
  ctx.fillStyle = '#4fc3f7'
  roundRect(ctx, x - 2, throttleY - 3, barW + 4, 6, 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '7px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('牵引', x + barW / 2, y + 4)

  // 制动手柄
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  roundRect(ctx, x, y + barH + 20, barW, barH, 4)
  ctx.fill()
  var brakeH = barH * (handleState.brake / 100)
  if (brakeH > 0) {
    var bGrad = ctx.createLinearGradient(x, y + barH + 20 + barH - brakeH, x, y + barH + 20 + barH)
    bGrad.addColorStop(0, '#ef5350')
    bGrad.addColorStop(1, 'rgba(239,83,80,0.3)')
    ctx.fillStyle = bGrad
    roundRect(ctx, x, y + barH + 20 + barH - brakeH, barW, brakeH, 4)
    ctx.fill()
  }
  var brakeY = y + barH + 20 + barH - brakeH
  ctx.fillStyle = '#ef5350'
  roundRect(ctx, x - 2, brakeY - 3, barW + 4, 6, 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText('制动', x + barW / 2, y + barH + 16)
  ctx.textAlign = 'left'
}

// === 顶部HUD ===
function drawTopHUD(ctx, w) {
  // 里程
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '11px sans-serif'
  ctx.fillText('📍 ' + state.mileage.toFixed(1) + '/' + state.targetMileage.toFixed(0) + 'km', 12, 25)

  // 倒计时
  ctx.textAlign = 'right'
  var timeLeft = Math.max(0, state.targetTime - state.timeElapsed)
  ctx.fillStyle = timeLeft < 20 ? '#ef5350' : 'rgba(255,255,255,0.7)'
  ctx.fillText('⏱ ' + timeLeft + 's', w - 12, 25)

  // 得分
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '10px sans-serif'
  ctx.fillText('得分 ' + state.score, w / 2, 18)

  // 用时
  var min = Math.floor(state.timeElapsed / 60)
  var sec = state.timeElapsed % 60
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillText((min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec, w / 2, 32)
  ctx.textAlign = 'left'
}

// === 限速警告 ===
function drawLimitWarning(ctx, w) {
  var alpha = 0.6 + Math.sin(Date.now() / 150) * 0.3
  ctx.fillStyle = 'rgba(244, 67, 54, ' + (alpha * 0.8) + ')'
  roundRect(ctx, 10, 40, w - 20, 30, 8)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(limitWarning, w / 2, 60)
  ctx.textAlign = 'left'
}

// === 调度信息条 ===
function drawDispatchBar(ctx, w) {
  var barY = 75
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  roundRect(ctx, 10, barY, w - 20, 22, 11)
  ctx.fill()
  ctx.fillStyle = '#4fc3f7'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(dispatchInfo, w / 2, barY + 15)
  ctx.textAlign = 'left'

  // 进度条
  var progY = barY + 26
  var progW = w - 20
  var progress = Math.min(1, state.mileage / state.targetMileage)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  roundRect(ctx, 10, progY, progW, 3, 1.5)
  ctx.fill()
  ctx.fillStyle = '#4fc3f7'
  roundRect(ctx, 10, progY, progW * progress, 3, 1.5)
  ctx.fill()
}

// === 操作控件 ===
function drawControls(ctx, w, h) {
  // 操作按钮在仪表盘上方
  var btnY = h - 70
  var btnH = 44
  var halfW = (w - 40) / 2

  // 减速
  var brakeAlpha = targetSpeed < state.speed ? 0.45 : 0.15
  ctx.fillStyle = 'rgba(239, 83, 80, ' + brakeAlpha + ')'
  roundRect(ctx, 10, btnY, halfW, btnH, 12)
  ctx.fill()
  ctx.strokeStyle = '#ef5350'
  ctx.lineWidth = 1
  roundRect(ctx, 10, btnY, halfW, btnH, 12)
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🛑', 10 + halfW / 2, btnY + 22)
  ctx.font = 'bold 11px sans-serif'
  ctx.fillText('减速 -60', 10 + halfW / 2, btnY + 38)

  // 加速
  var accelAlpha = targetSpeed > state.speed ? 0.45 : 0.15
  ctx.fillStyle = 'rgba(79, 195, 247, ' + accelAlpha + ')'
  roundRect(ctx, 30 + halfW, btnY, halfW, btnH, 12)
  ctx.fill()
  ctx.strokeStyle = '#4fc3f7'
  ctx.lineWidth = 1
  roundRect(ctx, 30 + halfW, btnY, halfW, btnH, 12)
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = '20px sans-serif'
  ctx.fillText('⚡', 30 + halfW + halfW / 2, btnY + 22)
  ctx.font = 'bold 11px sans-serif'
  ctx.fillText('加速 +40', 30 + halfW + halfW / 2, btnY + 38)
  ctx.textAlign = 'left'

  touchAreas.push({ x: 10, y: btnY, w: halfW, h: btnH, type: 'brake' })
  touchAreas.push({ x: 30 + halfW, y: btnY, w: halfW, h: btnH, type: 'accel' })
}

// === 辅助函数 ===
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
        targetSpeed = Math.max(0, targetSpeed - 60 * weather.brakeMultiplier)
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
    }
  }
}

// === 结束驾驶 ===
function finishDrive(arrived) {
  state.gameOver = true; stopLoop(); scoreTrack.arrived = arrived
  if (arrived) {
    var timeLeft = state.targetTime - state.timeElapsed
    scoreTrack.punctuality = timeLeft >= 0 ? Math.min(100, 80 + Math.round(timeLeft / state.targetTime * 20)) : Math.max(0, 80 - Math.round((-timeLeft) / state.targetTime * 80))
  } else {
    scoreTrack.punctuality = Math.max(0, 50 - Math.round(state.timeElapsed / state.targetTime * 50))
  }
  var totalOps = scoreTrack.accelCount + scoreTrack.brakeCount
  var optimalOps = state.targetMileage * 3
  scoreTrack.energyScore = totalOps <= optimalOps ? Math.min(100, 70 + Math.round((1 - totalOps / optimalOps / 2) * 30)) : Math.max(10, 70 - Math.round((totalOps / optimalOps - 1) * 60))

  var totalScore = Math.round(scoreTrack.punctuality * 3 + scoreTrack.energyScore * 2 + scoreTrack.satisfaction * 2)
  GW.lastResult = {
    mileage: state.mileage.toFixed(1), targetMileage: state.targetMileage.toFixed(1),
    maxSpeed: Math.round(state.maxSpeed), score: totalScore,
    duration: state.timeElapsed, targetTime: state.targetTime,
    arrived: arrived, sceneTitle: GW.currentScene ? GW.currentScene.title : '自由驾驶',
    punctuality: scoreTrack.punctuality, energyScore: scoreTrack.energyScore, satisfaction: scoreTrack.satisfaction,
    accelCount: scoreTrack.accelCount, brakeCount: scoreTrack.brakeCount,
    harshAccel: scoreTrack.harshAccel, harshBrake: scoreTrack.harshBrake, signalViolations: scoreTrack.signalViolations
  }
  GW.currentScreen = 'result'
}

module.exports = { init: init, update: update, draw: draw, handleTouch: handleTouch, stopLoop: stopLoop }
