// js/result.js — 结果页（纯Canvas）
var GW = require('./global')

var touchAreas = []
var result = null
var grade = ''
var gradeColor = ''
var char = null

function init() {
  touchAreas = []
  result = GW.lastResult
  char = GW.selectedChar

  if (result) {
    var g = calcGrade(result.score)
    grade = g.grade
    gradeColor = g.color
  }
}

function calcGrade(score) {
  if (score >= 2000) return { grade: 'S 金牌司机', color: '#ffd700' }
  if (score >= 1500) return { grade: 'A 优秀司机', color: '#4fc3f7' }
  if (score >= 1000) return { grade: 'B 合格司机', color: '#66bb6a' }
  if (score >= 500) return { grade: 'C 实习司机', color: '#ffa726' }
  return { grade: 'D 需要加油', color: '#ef5350' }
}

function update() {}

function draw(ctx, w, h) {
  touchAreas = []
  if (!result) return

  // 背景
  ctx.fillStyle = '#0f0f23'
  ctx.fillRect(0, 0, w, h)

  // 头部
  ctx.font = '42px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🏆', w / 2, 55)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText('驾驶完成！', w / 2, 85)

  // 角色
  if (char) {
    var cy = 108
    ctx.fillStyle = char.bgColor
    ctx.beginPath()
    ctx.arc(w / 2, cy, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = char.skinColor
    ctx.beginPath()
    ctx.arc(w / 2, cy, 11, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(w / 2 - 3, cy - 1, 1.5, 0, Math.PI * 2)
    ctx.arc(w / 2 + 3, cy - 1, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '12px sans-serif'
    ctx.fillText(char.name, w / 2, cy + 30)
  }

  // 路线名
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '12px sans-serif'
  ctx.fillText(result.sceneTitle, w / 2, 155)

  // 分数卡片
  var scoreY = 170
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  roundRect(ctx, 30, scoreY, w - 60, 120, 16)
  ctx.fill()

  ctx.fillStyle = gradeColor
  ctx.font = 'bold 52px monospace'
  ctx.fillText(result.score, w / 2, scoreY + 55)

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '12px sans-serif'
  ctx.fillText('总得分', w / 2, scoreY + 75)

  // 评级徽章
  var badgeW = ctx.measureText(grade).width + 24
  ctx.fillStyle = gradeColor + '20'
  roundRect(ctx, (w - badgeW) / 2, scoreY + 85, badgeW, 28, 14)
  ctx.fill()
  ctx.strokeStyle = gradeColor + '60'
  ctx.lineWidth = 1
  roundRect(ctx, (w - badgeW) / 2, scoreY + 85, badgeW, 28, 14)
  ctx.stroke()
  ctx.fillStyle = gradeColor
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText(grade, w / 2, scoreY + 104)

  // 数据网格
  var gridY = scoreY + 140
  var stats = [
    { value: result.mileage + 'km', label: '总里程' },
    { value: result.maxSpeed + 'km/h', label: '最高时速' },
    { value: '' + result.crossings, label: '列车交汇' },
    { value: result.eventsPassed + '/' + result.eventsTotal, label: '调度通过' }
  ]

  var cellW = (w - 60) / 2
  for (var i = 0; i < stats.length; i++) {
    var col = i % 2
    var row = Math.floor(i / 2)
    var sx = 30 + col * cellW
    var sy = gridY + row * 55

    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    roundRect(ctx, sx + 4, sy, cellW - 8, 48, 8)
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(stats[i].value, sx + cellW / 2, sy + 22)

    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '11px sans-serif'
    ctx.fillText(stats[i].label, sx + cellW / 2, sy + 40)
  }

  // 复盘
  var summaryY = gridY + 125
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  roundRect(ctx, 16, summaryY, w - 32, 65, 8)
  ctx.fill()

  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('驾驶复盘', 28, summaryY + 18)

  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '11px sans-serif'
  var passed = result.eventsPassed >= result.eventsTotal * 0.8 ? '表现优秀！' : '继续加油！'
  ctx.fillText('最高' + result.maxSpeed + 'km/h，通过' + result.eventsPassed + '次调度，' + passed, 28, summaryY + 38)

  // 按钮
  var btnY = h - 130

  // 再来一次
  var btnGrad = ctx.createLinearGradient(16, btnY, w - 16, btnY)
  btnGrad.addColorStop(0, '#4fc3f7')
  btnGrad.addColorStop(1, '#ab47bc')
  ctx.fillStyle = btnGrad
  roundRect(ctx, 16, btnY, w - 32, 50, 25)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('再来一次', w / 2, btnY + 31)
  touchAreas.push({ x: 16, y: btnY, w: w - 32, h: 50, type: 'replay' })

  // 返回首页
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  roundRect(ctx, 16, btnY + 62, w - 32, 40, 20)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '14px sans-serif'
  ctx.fillText('返回首页', w / 2, btnY + 87)
  ctx.textAlign = 'left'

  touchAreas.push({ x: 16, y: btnY + 62, w: w - 32, h: 40, type: 'home' })
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
