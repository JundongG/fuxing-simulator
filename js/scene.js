// js/scene.js — 场景详情页 v1.1（纯Canvas）
var GW = require('./global')
var roundRect = GW.roundRect  // 使用全局共享的 roundRect

var touchAreas = []
var scrollY = 0
var maxScroll = 0

function init() {
  touchAreas = []
  scrollY = 0
  maxScroll = 400
}

function update() {}

function draw(ctx, w, h) {
  touchAreas = []
  var scene = GW.currentScene
  var char = GW.selectedChar

  // 背景
  ctx.fillStyle = '#0f0f23'
  ctx.fillRect(0, 0, w, h)

  // 返回按钮
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '16px sans-serif'
  ctx.fillText('< 返回', 16, 35)
  touchAreas.push({ x: 0, y: 15, w: 80, h: 35, type: 'back' })

  // 封面
  var coverH = h * 0.22
  var coverGrad = ctx.createLinearGradient(0, 45, w, 45 + coverH)
  var terrain = scene.config.terrain
  if (terrain === 'mountain') { coverGrad.addColorStop(0, '#667eea'); coverGrad.addColorStop(1, '#764ba2') }
  else if (terrain === 'coast') { coverGrad.addColorStop(0, '#43e97b'); coverGrad.addColorStop(1, '#38f9d7') }
  else if (terrain === 'city') { coverGrad.addColorStop(0, '#a18cd1'); coverGrad.addColorStop(1, '#fbc2eb') }
  else if (terrain === 'tunnel') { coverGrad.addColorStop(0, '#4facfe'); coverGrad.addColorStop(1, '#00f2fe') }
  else { coverGrad.addColorStop(0, '#89f7fe'); coverGrad.addColorStop(1, '#66a6ff') }
  ctx.fillStyle = coverGrad
  ctx.fillRect(0, 45, w, coverH)

  // 火车图标
  ctx.font = '48px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🚄', w / 2, 45 + coverH / 2 + 15)
  ctx.textAlign = 'left'

  // 角色信息条
  var charBarY = 45 + coverH + 12
  if (char) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    roundRect(ctx, 12, charBarY, w - 24, 44, 8)
    ctx.fill()

    // 头像
    ctx.fillStyle = char.bgColor
    ctx.beginPath()
    ctx.arc(36, charBarY + 22, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = char.skinColor
    ctx.beginPath()
    ctx.arc(36, charBarY + 22, 11, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(33, charBarY + 20, 1.5, 0, Math.PI * 2)
    ctx.arc(39, charBarY + 20, 1.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(char.name, 58, charBarY + 20)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '11px sans-serif'
    ctx.fillText('本次小司机', 58, charBarY + 36)

    // 标签
    ctx.fillStyle = char.color
    ctx.font = '10px sans-serif'
    var tagX = w - 80
    roundRect(ctx, tagX, charBarY + 10, 55, 24, 12)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.fillText(char.tag, tagX + 27, charBarY + 26)
    ctx.textAlign = 'left'
  }

  // 场景信息
  var infoY = charBarY + (char ? 56 : 8)
  var cfg = scene.config

  // 标题
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 20px sans-serif'
  ctx.fillText(scene.title, 16, infoY + 22)

  // 标签行
  var tagY = infoY + 34
  var tags = []
  tags.push(cfg.time === 'day' ? '白天' : cfg.time === 'night' ? '夜间' : '黄昏')
  if (cfg.weather !== 'clear') tags.push(cfg.weather === 'rain' ? '雨天' : cfg.weather === 'snow' ? '雪天' : '雾天')
  tags.push('限速 ' + cfg.speedLimit + ' km/h')

  var tagX = 16
  for (var i = 0; i < tags.length; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    var tw = ctx.measureText(tags[i]).width + 16
    roundRect(ctx, tagX, tagY, tw, 24, 12)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '11px sans-serif'
    ctx.fillText(tags[i], tagX + 8, tagY + 16)
    tagX += tw + 8
  }

  // 场景故事卡片
  var cardY = tagY + 36
  drawCard(ctx, 12, cardY, w - 24, '场景故事', scene.description)

  // 知识卡片
  var card2Y = cardY + 100
  drawCard(ctx, 12, card2Y, w - 24, '高铁小知识', scene.knowledge)

  // 地标
  if (cfg.landmarks && cfg.landmarks.length > 0) {
    var lmY = card2Y + 100
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText('途经地标', 24, lmY + 14)

    var lmX = 24
    for (var i = 0; i < cfg.landmarks.length; i++) {
      ctx.fillStyle = 'rgba(79,195,247,0.15)'
      var lw = ctx.measureText(cfg.landmarks[i]).width + 16
      roundRect(ctx, lmX, lmY + 22, lw, 26, 13)
      ctx.fill()
      ctx.fillStyle = '#4fc3f7'
      ctx.font = '12px sans-serif'
      ctx.fillText(cfg.landmarks[i], lmX + 8, lmY + 40)
      lmX += lw + 8
      if (lmX > w - 60) { lmX = 24; lmY += 30 }
    }
  }

  // 进入驾驶按钮
  var btnW = w - 32
  var btnH = 50
  var btnY = h - btnH - 30

  var btnGrad = ctx.createLinearGradient(16, btnY, 16 + btnW, btnY)
  btnGrad.addColorStop(0, '#4fc3f7')
  btnGrad.addColorStop(1, '#ab47bc')
  ctx.fillStyle = btnGrad
  roundRect(ctx, 16, btnY, btnW, btnH, 25)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('进入驾驶舱', w / 2, btnY + 31)
  ctx.textAlign = 'left'

  touchAreas.push({ x: 16, y: btnY, w: btnW, h: btnH, type: 'start_drive' })
}

function drawCard(ctx, x, y, w, label, text) {
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  roundRect(ctx, x, y, w, 85, 8)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText(label, x + 12, y + 22)

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '12px sans-serif'
  // 简单的文字换行
  var lines = wrapText(ctx, text, w - 24, 12)
  for (var i = 0; i < Math.min(lines.length, 3); i++) {
    ctx.fillText(lines[i], x + 12, y + 42 + i * 16)
  }
}

function wrapText(ctx, text, maxWidth, fontSize) {
  var words = text.split('')
  var lines = []
  var line = ''
  for (var i = 0; i < words.length; i++) {
    var testLine = line + words[i]
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line)
      line = words[i]
    } else {
      line = testLine
    }
  }
  if (line) lines.push(line)
  return lines
}

// roundRect 已移至 global.js 共享

function handleTouch(x, y) {
  for (var i = 0; i < touchAreas.length; i++) {
    var a = touchAreas[i]
    if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) {
      if (a.type === 'back') {
        GW.currentScreen = 'home'
        return
      }
      if (a.type === 'start_drive') {
        GW.currentScreen = 'drive'
        return
      }
    }
  }
}

module.exports = {
  init: init,
  update: update,
  draw: draw,
  handleTouch: handleTouch
}
