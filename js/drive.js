// js/drive.js — 驾驶界面（纯Canvas）
var GW = require('./global')
var Renderer = require('./renderer')

var renderer = null
var touchAreas = []
var animFrameId = null
var gameTimer = null
var startTime = 0

// 游戏状态
var state = {
  speed: 0,
  mileage: 0,
  score: 0,
  maxSpeed: 0,
  crossings: 0,
  eventsPassed: 0,
  eventsTotal: 0,
  paused: false,
  gameOver: false,
  sceneConfig: null
}

var targetSpeed = 0
var eventQueue = []
var nextEventMileage = 2
var eventVisible = false
var eventText = ''
var eventType = ''
var signalStatus = 'green'
var signalText = '前方畅通'
var timeElapsed = 0

function init() {
  var scene = GW.currentScene
  state.sceneConfig = scene ? scene.config : {
    time: 'day', weather: 'clear', terrain: 'plain', speedLimit: 350, landmarks: []
  }
  state.speed = 0
  state.mileage = 0
  state.score = 0
  state.maxSpeed = 0
  state.crossings = 0
  state.eventsPassed = 0
  state.eventsTotal = 0
  state.paused = false
  state.gameOver = false
  targetSpeed = 0
  eventVisible = false
  eventText = ''
  eventType = ''
  signalStatus = 'green'
  signalText = '前方畅通'
  timeElapsed = 0

  // 创建渲染器
  var w = GW.screenWidth
  var h = GW.screenHeight
  renderer = new Renderer(GW.ctx, w, h, state.sceneConfig)

  // 生成事件
  generateEvents()

  // 开始循环
  startTime = Date.now()
  startLoop()
}

function generateEvents() {
  var events = []
  var km = 3 + Math.random() * 3
  while (km < 50) {
    var types = ['speed_limit', 'signal_yellow', 'signal_red', 'crossing', 'tunnel']
    var type = types[Math.floor(Math.random() * types.length)]
    events.push({ mileage: km, type: type, handled: false })
    km += 2 + Math.random() * 4
  }
  eventQueue = events
  nextEventMileage = events.length > 0 ? events[0].mileage : 999
  state.eventsTotal = events.length
}

function startLoop() {
  if (animFrameId) clearTimeout(animFrameId)

  gameTimer = setInterval(function() {
    if (!state.paused) {
      timeElapsed = Math.floor((Date.now() - startTime) / 1000)
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

function update() {
  var dt = 1 / 60

  // 里程
  state.mileage += (state.speed / 3600) * dt * 60

  // 最高速度
  if (state.speed > state.maxSpeed) state.maxSpeed = state.speed

  // 物理
  if (targetSpeed < state.speed) {
    var drag = state.speed > 200 ? 0.8 : 0.3
    state.speed = Math.max(targetSpeed, state.speed - drag)
  } else if (targetSpeed > state.speed) {
    var acc = state.speed < 100 ? 1.2 : 0.6
    state.speed = Math.min(targetSpeed, state.speed + acc)
  }

  // 检查事件
  checkEvents()
}

function checkEvents() {
  if (state.mileage >= nextEventMileage) {
    var event = null
    for (var i = 0; i < eventQueue.length; i++) {
      if (!eventQueue[i].handled) { event = eventQueue[i]; break }
    }
    if (event) {
      event.handled = true
      triggerEvent(event)
      var next = null
      for (var i = 0; i < eventQueue.length; i++) {
        if (!eventQueue[i].handled) { next = eventQueue[i]; break }
      }
      nextEventMileage = next ? next.mileage : 999
    }
  }
}

function triggerEvent(event) {
  var infos = {
    speed_limit: { text: '前方施工，限速 200km/h', signalText: '限速200' },
    signal_yellow: { text: '前方信号灯变黄，注意减速', signalText: '注意减速' },
    signal_red: { text: '前方红灯，请立即停车！', signalText: '紧急停车' },
    crossing: { text: '前方有对向列车交汇！', signalText: '注意交汇' },
    tunnel: { text: '即将进入隧道', signalText: '进入隧道' }
  }
  var info = infos[event.type] || { text: '未知事件', signalText: '' }

  eventVisible = true
  eventText = info.text
  eventType = event.type

  if (event.type.startsWith('signal_')) {
    signalStatus = event.type === 'signal_yellow' ? 'yellow' : 'red'
    signalText = info.signalText
  }

  // 超时扣分
  setTimeout(function() {
    if (eventVisible) {
      state.score = Math.max(0, state.score - 100)
      eventVisible = false
    }
  }, 12000)
}

function draw(ctx, w, h) {
  touchAreas = []

  // 渲染场景
  if (renderer) {
    renderer.draw(state.speed, state.mileage)
  }

  // 顶部HUD
  drawHUD(ctx, w, h)

  // 信号灯
  if (signalText) {
    drawSignalBar(ctx, w)
  }

  // 事件弹窗
  if (eventVisible) {
    drawEventOverlay(ctx, w, h)
  }

  // 底部控制
  if (!eventVisible) {
    drawControls(ctx, w, h)
  }
}

function drawHUD(ctx, w, h) {
  // 速度数字
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(Math.round(state.speed), w / 2, 50)

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '12px sans-serif'
  ctx.fillText('km/h', w / 2, 66)

  // 里程和得分
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText('里程 ' + state.mileage.toFixed(1) + 'km', 12, 30)

  ctx.textAlign = 'right'
  ctx.fillText('得分 ' + state.score, w - 12, 30)
  ctx.textAlign = 'left'

  // 用时
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '11px sans-serif'
  var min = Math.floor(timeElapsed / 60)
  var sec = timeElapsed % 60
  ctx.fillText((min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec, w / 2, 80)
  ctx.textAlign = 'left'

  // 小司机头像
  var char = GW.selectedChar
  if (char) {
    var cx = w - 40
    var cy = 75
    ctx.fillStyle = char.bgColor
    ctx.beginPath()
    ctx.arc(cx, cy, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = char.skinColor
    ctx.beginPath()
    ctx.arc(cx, cy, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(cx - 3, cy - 1, 1.5, 0, Math.PI * 2)
    ctx.arc(cx + 3, cy - 1, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawSignalBar(ctx, w) {
  var barY = 90
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  roundRect(ctx, w / 2 - 70, barY, 140, 28, 14)
  ctx.fill()

  // 信号灯点
  var dotColors = { green: '#4caf50', yellow: '#ffc107', red: '#f44336' }
  ctx.fillStyle = dotColors[signalStatus] || '#4caf50'
  ctx.beginPath()
  ctx.arc(w / 2 - 52, barY + 14, 5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(signalText, w / 2 + 5, barY + 18)
  ctx.textAlign = 'left'
}

function drawEventOverlay(ctx, w, h) {
  // 半透明遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, 0, w, h)

  // 事件卡片
  var cardW = w * 0.8
  var cardH = 150
  var cardX = (w - cardW) / 2
  var cardY = h * 0.3

  ctx.fillStyle = 'rgba(30, 30, 50, 0.95)'
  roundRect(ctx, cardX, cardY, cardW, cardH, 16)
  ctx.fill()

  ctx.strokeStyle = 'rgba(79, 195, 247, 0.3)'
  ctx.lineWidth = 1
  roundRect(ctx, cardX, cardY, cardW, cardH, 16)
  ctx.stroke()

  // 事件文字
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(eventText, w / 2, cardY + 45)

  // 当前速度提示
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '12px sans-serif'
  ctx.fillText('当前速度: ' + Math.round(state.speed) + ' km/h', w / 2, cardY + 70)

  // 确认按钮
  var btnW = cardW * 0.6
  var btnH = 44
  var btnX = (w - btnW) / 2
  var btnY = cardY + cardH - 60

  ctx.fillStyle = '#4fc3f7'
  roundRect(ctx, btnX, btnY, btnW, btnH, 22)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 15px sans-serif'
  ctx.fillText('确认处理', w / 2, btnY + 28)
  ctx.textAlign = 'left'

  touchAreas.push({ x: btnX, y: btnY, w: btnW, h: btnH, type: 'handle_event' })
}

function drawControls(ctx, w, h) {
  // 速度条
  var barY = h - 170
  var barW = w - 40
  var barH = 6
  var fillW = barW * (state.speed / 350)
  var fillColor = state.speed > 300 ? '#ef5350' : state.speed > 200 ? '#ffa726' : '#4fc3f7'

  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  roundRect(ctx, 20, barY, barW, barH, 3)
  ctx.fill()
  ctx.fillStyle = fillColor
  roundRect(ctx, 20, barY, Math.min(fillW, barW), barH, 3)
  ctx.fill()

  // 控制按钮
  var btnY = h - 140
  var btnW = (w - 52) / 2
  var btnH = 60

  // 刹车
  ctx.fillStyle = 'rgba(239, 83, 80, 0.3)'
  roundRect(ctx, 16, btnY, btnW, btnH, 12)
  ctx.fill()
  ctx.strokeStyle = '#ef5350'
  ctx.lineWidth = 1.5
  roundRect(ctx, 16, btnY, btnW, btnH, 12)
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🛑', 16 + btnW / 2, btnY + 28)
  ctx.font = '12px sans-serif'
  ctx.fillText('刹车', 16 + btnW / 2, btnY + 48)

  // 加速
  ctx.fillStyle = 'rgba(79, 195, 247, 0.3)'
  roundRect(ctx, 36 + btnW, btnY, btnW, btnH, 12)
  ctx.fill()
  ctx.strokeStyle = '#4fc3f7'
  ctx.lineWidth = 1.5
  roundRect(ctx, 36 + btnW, btnY, btnW, btnH, 12)
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = '20px sans-serif'
  ctx.fillText('⚡', 36 + btnW + btnW / 2, btnY + 28)
  ctx.font = '12px sans-serif'
  ctx.fillText('加速', 36 + btnW + btnW / 2, btnY + 48)
  ctx.textAlign = 'left'

  touchAreas.push({ x: 16, y: btnY, w: btnW, h: btnH, type: 'brake' })
  touchAreas.push({ x: 36 + btnW, y: btnY, w: btnW, h: btnH, type: 'accel' })

  // 底部操作栏
  var barBottom = h - 55

  // 暂停
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  roundRect(ctx, 16, barBottom, (w - 48) / 2, 36, 8)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '13px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(state.paused ? '继续' : '暂停', 16 + (w - 48) / 4, barBottom + 23)

  // 结束
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  roundRect(ctx, 32 + (w - 48) / 2, barBottom, (w - 48) / 2, 36, 8)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillText('结束', 32 + (w - 48) / 2 + (w - 48) / 4, barBottom + 23)
  ctx.textAlign = 'left'

  touchAreas.push({ x: 16, y: barBottom, w: (w - 48) / 2, h: 36, type: 'pause' })
  touchAreas.push({ x: 32 + (w - 48) / 2, y: barBottom, w: (w - 48) / 2, h: 36, type: 'finish' })
}

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

function handleTouch(x, y) {
  for (var i = 0; i < touchAreas.length; i++) {
    var a = touchAreas[i]
    if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) {
      if (a.type === 'brake') {
        targetSpeed = Math.max(0, targetSpeed - 80)
        state.score += 5
        return
      }
      if (a.type === 'accel') {
        var limit = state.sceneConfig.speedLimit || 350
        targetSpeed = Math.min(limit + 10, targetSpeed + 30)
        targetSpeed = Math.min(380, targetSpeed)
        return
      }
      if (a.type === 'handle_event') {
        handleEvent()
        return
      }
      if (a.type === 'pause') {
        state.paused = !state.paused
        return
      }
      if (a.type === 'finish') {
        finishDrive()
        return
      }
    }
  }
}

function handleEvent() {
  var handled = false
  if (eventType === 'speed_limit') {
    if (state.speed <= 220) { handled = true; state.score += 100 }
    else { state.score = Math.max(0, state.score - 50) }
  } else if (eventType === 'signal_yellow') {
    if (state.speed <= 200) { handled = true; state.score += 80 }
    else { state.score = Math.max(0, state.score - 30) }
  } else if (eventType === 'signal_red') {
    if (state.speed <= 30) { handled = true; state.score += 150 }
    else { state.score = Math.max(0, state.score - 100) }
  } else if (eventType === 'crossing') {
    handled = true; state.score += 60; state.crossings++
  } else if (eventType === 'tunnel') {
    handled = true; state.score += 30
  }

  state.eventsPassed++
  eventVisible = false
  signalStatus = 'green'
  signalText = '前方畅通'
}

function finishDrive() {
  state.gameOver = true
  stopLoop()

  GW.lastResult = {
    mileage: state.mileage.toFixed(1),
    maxSpeed: Math.round(state.maxSpeed),
    score: state.score,
    crossings: state.crossings,
    eventsPassed: state.eventsPassed,
    eventsTotal: state.eventsTotal,
    duration: timeElapsed,
    sceneTitle: GW.currentScene ? GW.currentScene.title : '自由驾驶'
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
