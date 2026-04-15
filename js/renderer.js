// js/renderer.js — Canvas 2D 视差滚动渲染引擎

function Renderer(ctx, width, height, sceneConfig) {
  this.ctx = ctx
  this.w = width
  this.h = height
  this.config = sceneConfig || {}
  this.offsetSky = 0
  this.offsetFar = 0
  this.offsetMid = 0
  this.offsetTrack = 0
  this.inTunnel = false
  this.tunnelTimer = 0
  this.oncomingTrain = null
  this.trainTimer = 0
  this.seed = Math.random() * 10000
}

Renderer.prototype.draw = function(speed, mileage) {
  var ctx = this.ctx
  var w = this.w
  var h = this.h
  var speedFactor = speed / 350

  ctx.clearRect(0, 0, w, h)

  var scrollBase = speedFactor * 8
  this.offsetSky += scrollBase * 0.05
  this.offsetFar += scrollBase * 0.15
  this.offsetMid += scrollBase * 0.4
  this.offsetTrack += scrollBase

  this.tunnelTimer++
  if (this.tunnelTimer > 300 + Math.random() * 200) {
    this.inTunnel = !this.inTunnel
    this.tunnelTimer = 0
  }

  this.trainTimer++
  if (!this.oncomingTrain && this.trainTimer > 400 + Math.random() * 300) {
    this.oncomingTrain = { x: w + 100, scale: 0.1 }
    this.trainTimer = 0
  }

  this.drawSky(ctx, w, h, speedFactor)
  this.drawFarLayer(ctx, w, h, speedFactor)
  this.drawMidLayer(ctx, w, h, speedFactor)
  this.drawTrack(ctx, w, h, speedFactor)
  if (this.inTunnel) this.drawTunnel(ctx, w, h, speedFactor)
  if (this.oncomingTrain) this.drawOncomingTrain(ctx, w, h, speedFactor)
  if (speed > 150) this.drawSpeedLines(ctx, w, h, speedFactor)
  this.drawCockpit(ctx, w, h)
}

Renderer.prototype.drawSky = function(ctx, w, h, speedFactor) {
  var skyH = h * 0.35
  var time = this.config.time || 'day'
  var gradient

  if (time === 'night') {
    gradient = ctx.createLinearGradient(0, 0, 0, skyH)
    gradient.addColorStop(0, '#0a0a2e')
    gradient.addColorStop(0.5, '#1a1a4e')
    gradient.addColorStop(1, '#2a2a5e')
  } else if (time === 'sunset') {
    gradient = ctx.createLinearGradient(0, 0, 0, skyH)
    gradient.addColorStop(0, '#1a0a2e')
    gradient.addColorStop(0.3, '#4a1942')
    gradient.addColorStop(0.6, '#c84b31')
    gradient.addColorStop(1, '#ecb365')
  } else {
    gradient = ctx.createLinearGradient(0, 0, 0, skyH)
    gradient.addColorStop(0, '#1565c0')
    gradient.addColorStop(0.4, '#42a5f5')
    gradient.addColorStop(1, '#90caf9')
  }
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, skyH)

  // 云朵
  ctx.fillStyle = time === 'night' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'
  for (var i = 0; i < 4; i++) {
    var cx = ((i * 280 + this.offsetSky * 30) % (w + 200)) - 100
    var cy = 30 + i * 25
    this.drawCloud(ctx, cx, cy, 40 + i * 10)
  }

  // 夜间星星
  if (time === 'night') {
    ctx.fillStyle = '#fff'
    for (var i = 0; i < 20; i++) {
      var sx = ((i * 73 + 17) % w)
      var sy = ((i * 41 + 8) % (skyH * 0.6))
      var twinkle = Math.sin(Date.now() / 500 + i) * 0.5 + 0.5
      ctx.globalAlpha = twinkle * 0.8
      ctx.fillRect(sx, sy, 2, 2)
    }
    ctx.globalAlpha = 1
  }

  var weather = this.config.weather
  if (weather === 'snow') this.drawSnow(ctx, w, h, speedFactor)
  else if (weather === 'rain') this.drawRain(ctx, w, h, speedFactor)
}

Renderer.prototype.drawCloud = function(ctx, x, y, size) {
  ctx.beginPath()
  ctx.ellipse(x, y, size * 1.2, size * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x - size * 0.5, y + 5, size * 0.7, size * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x + size * 0.5, y + 3, size * 0.8, size * 0.35, 0, 0, Math.PI * 2)
  ctx.fill()
}

Renderer.prototype.drawFarLayer = function(ctx, w, h, speedFactor) {
  var terrain = this.config.terrain || 'plain'
  var baseY = h * 0.35

  if (terrain === 'mountain' || terrain === 'tunnel') {
    ctx.fillStyle = 'rgba(40, 50, 80, 0.8)'
    ctx.beginPath()
    ctx.moveTo(0, baseY)
    for (var x = 0; x <= w; x += 3) {
      var y = baseY - 40 - Math.sin((x + this.offsetFar * 50) * 0.008) * 35 - Math.sin((x + this.offsetFar * 50) * 0.015) * 20
      ctx.lineTo(x, y)
    }
    ctx.lineTo(w, baseY)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = 'rgba(30, 35, 60, 0.6)'
    ctx.beginPath()
    ctx.moveTo(0, baseY + 10)
    for (var x = 0; x <= w; x += 3) {
      var y = baseY - 15 - Math.sin((x + this.offsetFar * 30) * 0.006 + 2) * 25
      ctx.lineTo(x, y)
    }
    ctx.lineTo(w, baseY + 10)
    ctx.closePath()
    ctx.fill()
  } else if (terrain === 'city') {
    ctx.fillStyle = 'rgba(20, 20, 50, 0.9)'
    for (var i = 0; i < 12; i++) {
      var bx = ((i * 80 + this.offsetFar * 20) % (w + 160)) - 80
      var bh = 30 + (Math.sin(i * 3.7) * 0.5 + 0.5) * 60
      var bw = 15 + (Math.sin(i * 2.3) * 0.5 + 0.5) * 20
      ctx.fillRect(bx, baseY - bh, bw, bh)
      if (this.config.time === 'night') {
        ctx.fillStyle = 'rgba(255, 200, 50, 0.6)'
        for (var wy = baseY - bh + 5; wy < baseY - 3; wy += 8) {
          for (var wx = bx + 3; wx < bx + bw - 3; wx += 6) {
            if (Math.random() > 0.3) ctx.fillRect(wx, wy, 3, 4)
          }
        }
        ctx.fillStyle = 'rgba(20, 20, 50, 0.9)'
      }
    }
  } else if (terrain === 'coast') {
    var seaGrad = ctx.createLinearGradient(0, baseY - 10, 0, baseY + 30)
    seaGrad.addColorStop(0, 'rgba(30, 100, 180, 0.6)')
    seaGrad.addColorStop(1, 'rgba(20, 60, 120, 0.4)')
    ctx.fillStyle = seaGrad
    ctx.fillRect(0, baseY - 5, w, 35)
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)'
    ctx.lineWidth = 1
    for (var line = 0; line < 3; line++) {
      ctx.beginPath()
      for (var x = 0; x <= w; x += 2) {
        var y = baseY + line * 8 + Math.sin((x + this.offsetFar * 40 + line * 50) * 0.03) * 3
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  } else {
    ctx.fillStyle = 'rgba(50, 80, 50, 0.4)'
    ctx.fillRect(0, baseY - 3, w, 6)
  }
}

Renderer.prototype.drawMidLayer = function(ctx, w, h, speedFactor) {
  var baseY = h * 0.5
  ctx.fillStyle = 'rgba(60, 60, 80, 0.7)'
  for (var i = 0; i < 6; i++) {
    var x = ((i * 150 + this.offsetMid * 80) % (w + 300)) - 150
    var terrain = this.config.terrain
    if (terrain === 'mountain' || terrain === 'tunnel') {
      this.drawTree(ctx, x, baseY - 5, 15 + i * 2)
    } else if (terrain === 'city') {
      ctx.fillRect(x + 8, baseY - 30, 3, 30)
      ctx.fillStyle = 'rgba(255, 200, 50, 0.5)'
      ctx.beginPath()
      ctx.arc(x + 9, baseY - 30, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(60, 60, 80, 0.7)'
    } else {
      ctx.fillRect(x + 6, baseY - 35, 3, 35)
      ctx.fillRect(x, baseY - 33, 18, 2)
    }
  }
}

Renderer.prototype.drawTree = function(ctx, x, y, size) {
  ctx.fillStyle = 'rgba(40, 60, 30, 0.7)'
  ctx.fillRect(x + size * 0.4, y - size * 0.3, size * 0.2, size * 0.5)
  ctx.beginPath()
  ctx.moveTo(x, y - size * 0.3)
  ctx.lineTo(x + size * 0.5, y - size)
  ctx.lineTo(x + size, y - size * 0.3)
  ctx.closePath()
  ctx.fill()
}

Renderer.prototype.drawTrack = function(ctx, w, h, speedFactor) {
  var trackY = h * 0.55
  var trackH = h - trackY
  var vanishY = trackY - 20
  var vanishX = w / 2
  var railWidth = w * 0.35

  var groundGrad = ctx.createLinearGradient(0, trackY, 0, h)
  groundGrad.addColorStop(0, '#3a3a2a')
  groundGrad.addColorStop(0.3, '#4a4a3a')
  groundGrad.addColorStop(1, '#2a2a1a')
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, trackY, w, trackH)

  ctx.fillStyle = '#5a5a4a'
  ctx.beginPath()
  ctx.moveTo(vanishX - 3, vanishY + 10)
  ctx.lineTo(vanishX - railWidth, h)
  ctx.lineTo(vanishX + railWidth, h)
  ctx.lineTo(vanishX + 3, vanishY + 10)
  ctx.closePath()
  ctx.fill()

  var numSleepers = 15
  for (var i = 0; i < numSleepers; i++) {
    var t = (i + (this.offsetTrack % 1)) / numSleepers
    var y = vanishY + 10 + (h - vanishY - 10) * t
    var width = 3 + railWidth * 2 * t
    var alpha = 0.3 + t * 0.5
    ctx.fillStyle = 'rgba(80, 70, 50, ' + alpha + ')'
    ctx.fillRect(vanishX - width / 2, y - 1, width, 2 + t * 3)
  }

  for (var side = -1; side <= 1; side += 2) {
    ctx.strokeStyle = '#8a8a7a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(vanishX + side * 2, vanishY + 10)
    ctx.lineTo(vanishX + side * railWidth, h)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(100, 100, 80, 0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(vanishX, vanishY + 10)
  ctx.lineTo(vanishX, h)
  ctx.stroke()
}

Renderer.prototype.drawTunnel = function(ctx, w, h, speedFactor) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(40, 35, 30, 0.8)'
  ctx.fillRect(0, 0, w * 0.15, h)
  ctx.fillRect(w * 0.85, 0, w * 0.15, h)

  for (var i = 0; i < 5; i++) {
    var ly = ((i * h / 5 + this.offsetTrack * 50) % h)
    var flicker = Math.sin(Date.now() / 100 + i * 2) * 0.3 + 0.7
    ctx.fillStyle = 'rgba(255, 200, 100, ' + (0.15 * flicker) + ')'
    ctx.beginPath()
    ctx.arc(w * 0.12, ly, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(w * 0.88, ly, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  var exitGlow = ctx.createRadialGradient(w / 2, h * 0.1, 0, w / 2, h * 0.1, 120)
  exitGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
  exitGlow.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = exitGlow
  ctx.fillRect(0, 0, w, h * 0.4)
}

Renderer.prototype.drawOncomingTrain = function(ctx, w, h, speedFactor) {
  var train = this.oncomingTrain
  if (!train) return
  var cx = w / 2
  var trackY = h * 0.55

  train.scale += 0.008 + speedFactor * 0.015
  train.x = cx
  var scale = train.scale
  var trainW = 20 * scale
  var trainH = 12 * scale
  var trainY = trackY - trainH / 2 + (h - trackY) * 0.15

  if (scale > 3) { this.oncomingTrain = null; return }

  ctx.fillStyle = '#1a237e'
  ctx.fillRect(cx - trainW / 2, trainY, trainW, trainH)

  if (scale > 0.5) {
    var glow = ctx.createRadialGradient(cx, trainY + trainH * 0.3, 0, cx, trainY + trainH * 0.3, trainW * 1.5)
    glow.addColorStop(0, 'rgba(255, 255, 200, ' + Math.min(0.5, scale * 0.15) + ')')
    glow.addColorStop(1, 'rgba(255, 255, 200, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(cx - trainW * 2, trainY - trainH, trainW * 4, trainH * 3)
  }

  if (scale > 1.5) {
    ctx.fillStyle = 'rgba(200, 220, 255, 0.5)'
    var winCount = Math.floor(trainW / 4)
    for (var i = 0; i < winCount; i++) {
      ctx.fillRect(cx - trainW / 2 + 2 + i * 4, trainY + 2, 2, trainH * 0.4)
    }
  }

  if (scale > 2 && scale < 2.5) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.fillRect(0, 0, w, h)
  }
}

Renderer.prototype.drawSpeedLines = function(ctx, w, h, speedFactor) {
  var count = Math.floor(speedFactor * 20)
  ctx.strokeStyle = 'rgba(255, 255, 255, ' + (speedFactor * 0.15) + ')'
  ctx.lineWidth = 1
  for (var i = 0; i < count; i++) {
    var x = Math.random() * w
    var y = h * 0.3 + Math.random() * h * 0.4
    var len = 20 + speedFactor * 40
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - len, y + 2)
    ctx.stroke()
  }
}

Renderer.prototype.drawCockpit = function(ctx, w, h) {
  // A柱左
  ctx.fillStyle = 'rgba(20, 20, 30, 0.95)'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(w * 0.08, 0)
  ctx.lineTo(w * 0.03, h * 0.6)
  ctx.lineTo(0, h * 0.5)
  ctx.closePath()
  ctx.fill()

  // A柱右
  ctx.beginPath()
  ctx.moveTo(w, 0)
  ctx.lineTo(w * 0.92, 0)
  ctx.lineTo(w * 0.97, h * 0.6)
  ctx.lineTo(w, h * 0.5)
  ctx.closePath()
  ctx.fill()

  // 仪表台
  var dashY = h * 0.82
  var dashGrad = ctx.createLinearGradient(0, dashY, 0, h)
  dashGrad.addColorStop(0, 'rgba(25, 25, 35, 0.95)')
  dashGrad.addColorStop(1, 'rgba(15, 15, 25, 0.98)')
  ctx.fillStyle = dashGrad
  ctx.beginPath()
  ctx.moveTo(0, dashY + 20)
  ctx.quadraticCurveTo(w * 0.2, dashY, w * 0.5, dashY - 5)
  ctx.quadraticCurveTo(w * 0.8, dashY, w, dashY + 20)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  // 上边框
  ctx.fillStyle = 'rgba(15, 15, 25, 0.8)'
  ctx.fillRect(0, 0, w, 4)

  // 后视镜
  ctx.fillStyle = 'rgba(30, 30, 40, 0.9)'
  ctx.fillRect(w * 0.35, 30, w * 0.3, 12)
  ctx.fillStyle = 'rgba(100, 120, 150, 0.3)'
  ctx.fillRect(w * 0.36, 32, w * 0.28, 8)
}

Renderer.prototype.drawSnow = function(ctx, w, h, speedFactor) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  var time = Date.now() / 1000
  for (var i = 0; i < 30; i++) {
    var x = (Math.sin(i * 3.7 + time) * 0.5 + 0.5) * w
    var y = ((i * 47 + time * (60 + speedFactor * 40)) % h)
    var r = 1 + Math.sin(i) * 1
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

module.exports = Renderer
