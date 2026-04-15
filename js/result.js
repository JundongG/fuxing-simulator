// js/result.js — 结果页 v1.0（三维评分展示）
var GW = require('./global')

var touchAreas = []
var result = null
var char = null
var grade = ''
var gradeColor = ''
var animProgress = 0 // 动画进度 0-1

function init() {
  touchAreas = []
  result = GW.lastResult
  char = GW.selectedChar
  animProgress = 0

  if (result) {
    var g = calcGrade(result.score)
    grade = g.grade
    gradeColor = g.color
  }
}

function calcGrade(score) {
  if (score >= 600) return { grade: 'S 金牌司机', color: '#ffd700' }
  if (score >= 450) return { grade: 'A 优秀司机', color: '#4fc3f7' }
  if (score >= 300) return { grade: 'B 合格司机', color: '#66bb6a' }
  if (score >= 150) return { grade: 'C 实习司机', color: '#ffa726' }
  return { grade: 'D 需要加油', color: '#ef5350' }
}

function calcSubGrade(score) {
  if (score >= 90) return { text: '优秀', color: '#4caf50' }
  if (score >= 70) return { text: '良好', color: '#4fc3f7' }
  if (score >= 50) return { text: '合格', color: '#ffa726' }
  return { text: '较差', color: '#ef5350' }
}

function update() {
  if (animProgress < 1) animProgress += 0.03
}

function draw(ctx, w, h) {
  touchAreas = []
  if (!result) return

  // 背景
  ctx.fillStyle = '#0f0f23'
  ctx.fillRect(0, 0, w, h)

  // === 头部 ===
  var headY = 15
  ctx.font = '36px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(result.arrived ? '🏁' : '⏰', w / 2, headY + 30)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 18px sans-serif'
  ctx.fillText(result.arrived ? '到站！' : '未按时到站', w / 2, headY + 55)

  // 角色小头像
  if (char) {
    var cy = headY + 75
    ctx.fillStyle = char.bgColor
    ctx.beginPath()
    ctx.arc(w / 2, cy, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = char.skinColor
    ctx.beginPath()
    ctx.arc(w / 2, cy, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(w / 2 - 3, cy - 1, 1.2, 0, Math.PI * 2)
    ctx.arc(w / 2 + 3, cy - 1, 1.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '10px sans-serif'
    ctx.fillText(char.name, w / 2, cy + 22)
  }

  // 线路名
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '11px sans-serif'
  ctx.fillText(result.sceneTitle, w / 2, headY + 110)

  // === 综合评分卡 ===
  var scoreY = headY + 120
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  roundRect(ctx, 30, scoreY, w - 60, 75, 16)
  ctx.fill()

  // 分数（带动画）
  var displayScore = Math.round(result.score * Math.min(animProgress, 1))
  ctx.fillStyle = gradeColor
  ctx.font = 'bold 36px monospace'
  ctx.fillText(displayScore, w / 2, scoreY + 40)

  // 评级徽章
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '11px sans-serif'
  ctx.fillText('总得分', w / 2, scoreY + 56)

  var badgeW = ctx.measureText(grade).width + 20
  ctx.fillStyle = gradeColor + '25'
  roundRect(ctx, (w - badgeW) / 2, scoreY + 60, badgeW, 22, 11)
  ctx.fill()
  ctx.fillStyle = gradeColor
  ctx.font = 'bold 11px sans-serif'
  ctx.fillText(grade, w / 2, scoreY + 75)

  // === 三维评分 ===
  var triY = scoreY + 90
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  roundRect(ctx, 16, triY, w - 32, 115, 12)
  ctx.fill()

  // 标题
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('三维评分', 28, triY + 18)
  ctx.textAlign = 'center'

  var metrics = [
    { label: '🚄 准点率', value: result.punctuality, icon: '准时到达' },
    { label: '⚡ 节能率', value: result.energyScore, icon: '节能驾驶' },
    { label: '😊 满意度', value: result.satisfaction, icon: '乘客体验' }
  ]

  for (var i = 0; i < metrics.length; i++) {
    var m = metrics[i]
    var mx = 16 + (w - 32) * (i + 0.5) / 3
    var my = triY + 40

    // 分数
    var subGrade = calcSubGrade(m.value)
    ctx.fillStyle = subGrade.color
    ctx.font = 'bold 20px monospace'
    ctx.fillText(m.value, mx, my + 8)

    // 标签
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '11px sans-serif'
    ctx.fillText(m.label, mx, my + 25)

    // 进度条
    var barW = (w - 32) / 3 - 20
    var barX = mx - barW / 2
    var barY = my + 32
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    roundRect(ctx, barX, barY, barW, 4, 2)
    ctx.fill()

    var fillW = barW * (m.value / 100) * Math.min(animProgress * 1.5, 1)
    ctx.fillStyle = subGrade.color
    roundRect(ctx, barX, barY, Math.max(0, fillW), 4, 2)
    ctx.fill()

    // 等级文字
    ctx.fillStyle = subGrade.color
    ctx.font = 'bold 10px sans-serif'
    ctx.fillText(subGrade.text, mx, barY + 18)
  }
  ctx.textAlign = 'left'

  // === 统计数据 ===
  var statsY = triY + 120
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  roundRect(ctx, 16, statsY, w - 32, 100, 12)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('驾驶统计', 28, statsY + 18)

  var stats = [
    { value: result.mileage + '/' + result.targetMileage + 'km', label: '里程/目标' },
    { value: result.maxSpeed + 'km/h', label: '最高时速' },
    { value: result.duration + 's', label: '用时' },
    { value: result.accelCount + '/' + result.brakeCount, label: '加/减速次数' }
  ]

  for (var i = 0; i < stats.length; i++) {
    var col = i % 2
    var row = Math.floor(i / 2)
    var sx = 28 + col * ((w - 56) / 2)
    var sy = statsY + 30 + row * 35

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px monospace'
    ctx.fillText(stats[i].value, sx, sy + 10)

    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '10px sans-serif'
    ctx.fillText(stats[i].label, sx, sy + 24)
  }

  // === 驾驶总结 ===
  var summaryY = statsY + 110
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  roundRect(ctx, 16, summaryY, w - 32, 58, 8)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = 'bold 11px sans-serif'
  ctx.fillText('驾驶总结', 28, summaryY + 18)

  var summary = getSummary(result)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '11px sans-serif'
  // 简单两行显示
  ctx.fillText(summary[0], 28, summaryY + 36)
  if (summary[1]) {
    ctx.fillText(summary[1], 28, summaryY + 50)
  }

  // === 按钮 ===
  var btnY = h - 105

  // 再来一次
  var btnGrad = ctx.createLinearGradient(16, btnY, w - 16, btnY)
  btnGrad.addColorStop(0, '#4fc3f7')
  btnGrad.addColorStop(1, '#ab47bc')
  ctx.fillStyle = btnGrad
  roundRect(ctx, 16, btnY, w - 32, 44, 22)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🚄 再来一次', w / 2, btnY + 28)
  touchAreas.push({ x: 16, y: btnY, w: w - 32, h: 44, type: 'replay' })

  // 返回首页
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, 16, btnY + 52, w - 32, 36, 18)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '12px sans-serif'
  ctx.fillText('返回首页', w / 2, btnY + 75)
  ctx.textAlign = 'left'

  touchAreas.push({ x: 16, y: btnY + 52, w: w - 32, h: 36, type: 'home' })
}

function getSummary(r) {
  var lines = []

  if (r.arrived) {
    lines[0] = '成功将列车送达目的地'
  } else {
    lines[0] = '未能按时到达'
  }

  var tips = []
  if (r.signalViolations > 0) tips.push('信号违规' + r.signalViolations + '次')
  if (r.harshAccel > 2) tips.push('急加速较多')
  if (r.harshBrake > 2) tips.push('急减速较多')
  if (r.satisfaction >= 90) tips.push('乘客非常满意')
  if (r.punctuality >= 90) tips.push('准点表现优异')

  if (tips.length > 0) {
    lines[1] = tips.join('，') + '。'
  } else {
    lines[1] = '驾驶平稳，继续保持！'
  }

  return lines
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
      if (a.type === 'replay') {
        GW.currentScreen = 'drive'
        return
      }
      if (a.type === 'home') {
        GW.currentScreen = 'home'
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
