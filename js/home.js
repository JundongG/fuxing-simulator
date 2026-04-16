// js/home.js — 首页 v1.1（纯Canvas）
var GW = require('./global')
var characters = require('./characters')
var routes = require('./routes')
var roundRect = GW.roundRect  // 使用全局共享的 roundRect

// 按钮/可点击区域
var touchAreas = []
var selectedCharIdx = 0
var scrollOffset = 0
var hotRoutes = routes.slice(0, 6)
var aiInput = ''
var loading = false
var titleAnim = 0

function init() {
  touchAreas = []
  selectedCharIdx = 0
  scrollOffset = 0
  loading = false
  aiInput = ''
  titleAnim = 0
  // 恢复之前选中的角色
  if (GW.selectedChar) {
    for (var i = 0; i < characters.length; i++) {
      if (characters[i].id === GW.selectedChar.id) { selectedCharIdx = i; break }
    }
  }
}

function update() {
  titleAnim += 0.02
}

function draw(ctx, w, h) {
  touchAreas = []

  // 背景
  var bgGrad = ctx.createLinearGradient(0, 0, 0, h)
  bgGrad.addColorStop(0, '#0f0f23')
  bgGrad.addColorStop(1, '#1a1a2e')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, w, h)

  // 标题区
  var headerH = h * 0.13
  drawTitle(ctx, w, headerH)

  // 角色选择
  var charY = headerH + 10
  drawSectionLabel(ctx, 16, charY, '选择小司机')
  var charCardY = charY + 28
  drawCharCards(ctx, w, charCardY)

  // 选中角色描述
  var descY = charCardY + 112
  var selChar = characters[selectedCharIdx]
  ctx.fillStyle = selChar.color
  ctx.font = '13px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(selChar.name + ' — ' + selChar.desc, w / 2, descY)
  ctx.textAlign = 'left'

  // 热门线路
  var routeY = descY + 24
  drawSectionLabel(ctx, 16, routeY, '选择线路')
  drawRouteGrid(ctx, w, routeY + 28, h)

  // 底部提示
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('娱乐模拟，非真实驾驶训练', w / 2, h - 15)
  ctx.textAlign = 'left'
}

function drawTitle(ctx, w, headerH) {
  // 背景装饰
  var titleGrad = ctx.createLinearGradient(0, 0, w, headerH)
  titleGrad.addColorStop(0, 'rgba(79, 195, 247, 0.1)')
  titleGrad.addColorStop(1, 'rgba(156, 39, 176, 0.1)')
  ctx.fillStyle = titleGrad
  ctx.fillRect(0, 0, w, headerH)

  // 火车emoji（动画浮动）
  var bounce = Math.sin(titleAnim) * 3
  ctx.font = '36px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🚄', w / 2, headerH * 0.45 + bounce)

  // 标题
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText('高铁五七班', w / 2, headerH * 0.75)

  // 副标题
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '12px sans-serif'
  ctx.fillText('选一个小司机，开启你的高铁之旅', w / 2, headerH * 0.93)
  ctx.textAlign = 'left'
}

function drawSectionLabel(ctx, x, y, text) {
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText(text, x, y + 14)
}

function drawCharCards(ctx, w, y) {
  var cardW = 80
  var cardH = 90
  var gap = 10
  var startX = 16

  for (var i = 0; i < characters.length; i++) {
    var ch = characters[i]
    var x = startX + i * (cardW + gap)
    var isSelected = (i === selectedCharIdx)

    // 卡片背景
    ctx.fillStyle = isSelected ? ch.bgColor : 'rgba(255,255,255,0.08)'
    roundRect(ctx, x, y, cardW, cardH, 10)
    ctx.fill()

    // 选中边框
    if (isSelected) {
      ctx.strokeStyle = ch.color
      ctx.lineWidth = 2
      roundRect(ctx, x, y, cardW, cardH, 10)
      ctx.stroke()
    }

    // 角色头像圆形
    var avatarCX = x + cardW / 2
    var avatarCY = y + 32
    ctx.fillStyle = ch.bgColor
    ctx.beginPath()
    ctx.arc(avatarCX, avatarCY, 22, 0, Math.PI * 2)
    ctx.fill()

    // 脸
    ctx.fillStyle = ch.skinColor
    ctx.beginPath()
    ctx.arc(avatarCX, avatarCY, 16, 0, Math.PI * 2)
    ctx.fill()

    // 眼睛
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(avatarCX - 5, avatarCY - 2, 2, 0, Math.PI * 2)
    ctx.arc(avatarCX + 5, avatarCY - 2, 2, 0, Math.PI * 2)
    ctx.fill()

    // 嘴巴
    ctx.strokeStyle = '#c0392b'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(avatarCX, avatarCY + 4, 4, 0.1 * Math.PI, 0.9 * Math.PI)
    ctx.stroke()

    // 衣服
    ctx.fillStyle = ch.shirtColor
    ctx.beginPath()
    ctx.arc(avatarCX, avatarCY + 22, 14, Math.PI, 0)
    ctx.fill()

    // 名字
    ctx.fillStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.8)'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ch.name, avatarCX, y + cardH - 20)

    // 标签
    ctx.fillStyle = ch.color
    ctx.font = '10px sans-serif'
    ctx.fillText(ch.tag, avatarCX, y + cardH - 6)
    ctx.textAlign = 'left'

    // 注册点击区域
    touchAreas.push({ x: x, y: y, w: cardW, h: cardH, type: 'char', idx: i })
  }
}

function drawRouteGrid(ctx, w, startY, screenH) {
  var cardW = (w - 48) / 2
  var cardH = 85
  var gap = 10
  var cols = 2

  for (var i = 0; i < hotRoutes.length; i++) {
    var route = hotRoutes[i]
    var col = i % cols
    var row = Math.floor(i / cols)
    var x = 16 + col * (cardW + gap)
    var y = startY + row * (cardH + gap)

    if (y + cardH > screenH - 30) break

    // 卡片
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    roundRect(ctx, x, y, cardW, cardH, 8)
    ctx.fill()

    // emoji
    ctx.font = '24px sans-serif'
    ctx.fillText(route.emoji, x + 10, y + 32)

    // 名称
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(route.name, x + 42, y + 25)

    // 难度标签
    var diffColors = ['#4caf50', '#ffa726', '#ef5350']
    var diffTexts = ['新手', '中级', '高级']
    var diff = route.difficulty || 1
    ctx.fillStyle = diffColors[Math.min(diff - 1, 2)]
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText(diffTexts[Math.min(diff - 1, 2)], x + 42, y + 42)

    // 距离
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '10px sans-serif'
    ctx.fillText(route.distance + 'km', x + 42 + ctx.measureText(diffTexts[Math.min(diff - 1, 2)]).width + 8, y + 42)

    // 限速
    ctx.fillStyle = 'rgba(79,195,247,0.6)'
    ctx.font = '10px sans-serif'
    ctx.fillText('限速 ' + route.config.speedLimit + 'km/h', x + 42, y + 58)

    // 天气标签
    if (route.config.weather !== 'clear') {
      var weatherLabels = { rain: '🌧️雨天', snow: '❄️雪天' }
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '9px sans-serif'
      ctx.fillText(weatherLabels[route.config.weather] || '', x + 42, y + 73)
    }

    touchAreas.push({ x: x, y: y, w: cardW, h: cardH, type: 'route', idx: i })
  }
}

// roundRect 已移至 global.js 共享

function handleTouch(x, y) {
  for (var i = 0; i < touchAreas.length; i++) {
    var a = touchAreas[i]
    if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) {
      if (a.type === 'char') {
        selectedCharIdx = a.idx
        GW.selectedChar = characters[a.idx]
        wx.vibrateShort && wx.vibrateShort({ type: 'light' })
        return
      }
      if (a.type === 'route') {
        onSelectRoute(a.idx)
        return
      }
    }
  }
}

function onSelectRoute(idx) {
  if (!GW.selectedChar) {
    wx.showToast({ title: '请先选择一个小司机', icon: 'none' })
    return
  }
  var route = routes[idx]
  GW.currentScene = {
    title: route.name,
    description: route.desc,
    knowledge: route.knowledge,
    config: route.config,
    distance: route.distance // 传递距离给驾驶系统
  }
  GW.currentScreen = 'scene'
}

module.exports = {
  init: init,
  update: update,
  draw: draw,
  handleTouch: handleTouch
}
