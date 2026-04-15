// js/home.js — 首页（纯Canvas）
var GW = require('./global')
var characters = require('./characters')
var routes = require('./routes')

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
  var descY = charCardY + 100
  var selChar = characters[selectedCharIdx]
  ctx.fillStyle = selChar.color
  ctx.font = '13px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(selChar.name + ' — ' + selChar.desc, w / 2, descY)
  ctx.textAlign = 'left'

  // AI输入区
  var inputY = descY + 20
  drawAIInput(ctx, w, inputY)

  // 热门线路
  var routeY = inputY + 90
  drawSectionLabel(ctx, 16, routeY, '热门线路')
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

function drawAIInput(ctx, w, y) {
  var inputX = 16
  var inputW = w - 32
  var inputH = 40

  // 输入框
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  roundRect(ctx, inputX, y, inputW, inputH, 8)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 1
  roundRect(ctx, inputX, y, inputW, inputH, 8)
  ctx.stroke()

  // 文字或placeholder
  ctx.font = '14px sans-serif'
  if (aiInput) {
    ctx.fillStyle = '#fff'
    ctx.fillText(aiInput, inputX + 12, y + 25)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillText('例：复兴号穿越武夷山隧道', inputX + 12, y + 25)
  }

  // 闪光图标
  ctx.font = '16px sans-serif'
  ctx.fillText('✨', inputX + inputW - 30, y + 27)

  // 注册点击区域（点击弹出输入框）
  touchAreas.push({ x: inputX, y: y, w: inputW, h: inputH, type: 'ai_input' })

  // 生成按钮
  var btnY = y + inputH + 12
  var btnH = 44
  var btnGrad = ctx.createLinearGradient(inputX, btnY, inputX + inputW, btnY)
  if (loading) {
    btnGrad.addColorStop(0, '#555')
    btnGrad.addColorStop(1, '#444')
  } else {
    btnGrad.addColorStop(0, '#4fc3f7')
    btnGrad.addColorStop(1, '#ab47bc')
  }
  ctx.fillStyle = btnGrad
  roundRect(ctx, inputX, btnY, inputW, btnH, 22)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 15px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(loading ? '生成中...' : '生成并驾驶', w / 2, btnY + 28)
  ctx.textAlign = 'left'

  touchAreas.push({ x: inputX, y: btnY, w: inputW, h: btnH, type: 'generate' })
}

function drawRouteGrid(ctx, w, startY, screenH) {
  var cardW = (w - 48) / 2
  var cardH = 75
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

    // 距离
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '11px sans-serif'
    ctx.fillText(route.distance + 'km', x + 42, y + 42)

    // 限速
    ctx.fillStyle = 'rgba(79,195,247,0.6)'
    ctx.font = '10px sans-serif'
    ctx.fillText('限速 ' + route.config.speedLimit + 'km/h', x + 42, y + 58)

    touchAreas.push({ x: x, y: y, w: cardW, h: cardH, type: 'route', idx: i })
  }
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
      if (a.type === 'char') {
        selectedCharIdx = a.idx
        GW.selectedChar = characters[a.idx]
        wx.vibrateShort && wx.vibrateShort({ type: 'light' })
        return
      }
      if (a.type === 'ai_input') {
        wx.showModal({
          title: 'AI生成场景',
          content: '',
          editable: true,
          placeholderText: '例：复兴号穿越武夷山隧道',
          success: function(res) {
            if (res.confirm && res.content) {
              aiInput = res.content
            }
          }
        })
        return
      }
      if (a.type === 'generate') {
        onGenerate()
        return
      }
      if (a.type === 'route') {
        onSelectRoute(a.idx)
        return
      }
    }
  }
}

function onGenerate() {
  if (loading) return
  if (!GW.selectedChar) {
    wx.showToast({ title: '请先选择一个小司机', icon: 'none' })
    return
  }
  if (!aiInput.trim()) {
    wx.showModal({
      title: 'AI生成场景',
      editable: true,
      placeholderText: '例：复兴号穿越武夷山隧道',
      success: function(res) {
        if (res.confirm && res.content) {
          aiInput = res.content
          doGenerate()
        }
      }
    })
    return
  }
  doGenerate()
}

function doGenerate() {
  loading = true
  // 模拟AI生成（云函数可能不可用，用预设随机场景）
  var randomRoute = routes[Math.floor(Math.random() * routes.length)]
  GW.currentScene = {
    title: aiInput || randomRoute.name,
    description: '基于"' + (aiInput || randomRoute.name) + '"生成的高铁驾驶场景。列车飞驰，窗外风景如画。',
    knowledge: randomRoute.knowledge,
    config: randomRoute.config
  }
  setTimeout(function() {
    loading = false
    GW.currentScreen = 'scene'
  }, 800)
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
    config: route.config
  }
  GW.currentScreen = 'scene'
}

module.exports = {
  init: init,
  update: update,
  draw: draw,
  handleTouch: handleTouch
}
