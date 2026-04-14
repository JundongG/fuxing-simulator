// pages/drive/engine/renderer.js — Canvas 2D 渲染引擎

/**
 * 视差滚动渲染器
 * 天空 → 远景山 → 中景 → 轨道 → 驾驶舱 → 粒子
 */
class Renderer {
  constructor(ctx, width, height, sceneConfig) {
    this.ctx = ctx
    this.w = width
    this.h = height
    this.config = sceneConfig || {}

    // 滚动偏移量
    this.offsetSky = 0
    this.offsetFar = 0
    this.offsetMid = 0
    this.offsetTrack = 0

    // 隧道状态
    this.inTunnel = false
    this.tunnelTimer = 0

    // 对向列车
    this.oncomingTrain = null
    this.trainTimer = 0

    // 随机种子（用于地形生成）
    this.seed = Math.random() * 10000
  }

  // 主绘制循环
  draw(speed, mileage) {
    const ctx = this.ctx
    const w = this.w
    const h = this.h
    const speedFactor = speed / 350 // 0~1

    // 清屏
    ctx.clearRect(0, 0, w, h)

    // 更新偏移
    const scrollBase = speedFactor * 8
    this.offsetSky += scrollBase * 0.05
    this.offsetFar += scrollBase * 0.15
    this.offsetMid += scrollBase * 0.4
    this.offsetTrack += scrollBase

    // 随机进出隧道
    this.tunnelTimer++
    if (this.tunnelTimer > 300 + Math.random() * 200) {
      this.inTunnel = !this.inTunnel
      this.tunnelTimer = 0
    }

    // 随机对向列车
    this.trainTimer++
    if (!this.oncomingTrain && this.trainTimer > 400 + Math.random() * 300) {
      this.oncomingTrain = { x: w + 100, scale: 0.1 }
      this.trainTimer = 0
    }

    // === Layer 0: 天空 ===
    this.drawSky(ctx, w, h, speedFactor)

    // === Layer 1: 远景山脉/建筑 ===
    this.drawFarLayer(ctx, w, h, speedFactor)

    // === Layer 2: 中景树木/电线杆 ===
    this.drawMidLayer(ctx, w, h, speedFactor)

    // === Layer 3: 轨道 ===
    this.drawTrack(ctx, w, h, speedFactor)

    // === 隧道遮罩 ===
    if (this.inTunnel) {
      this.drawTunnel(ctx, w, h, speedFactor)
    }

    // === Layer 4: 对向列车 ===
    if (this.oncomingTrain) {
      this.drawOncomingTrain(ctx, w, h, speedFactor)
    }

    // === Layer 5: 速度线粒子 ===
    if (speed > 150) {
      this.drawSpeedLines(ctx, w, h, speedFactor)
    }

    // === Layer 6: 驾驶舱边框 ===
    this.drawCockpit(ctx, w, h)
  }

  // 天空层
  drawSky(ctx, w, h, speedFactor) {
    const skyH = h * 0.35
    const time = this.config.time || 'day'

    // 渐变天空
    let gradient
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

    // 云朵（缓慢飘动）
    ctx.fillStyle = time === 'night' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 280 + this.offsetSky * 30) % (w + 200)) - 100
      const cy = 30 + i * 25
      this.drawCloud(ctx, cx, cy, 40 + i * 10)
    }

    // 夜间星星
    if (time === 'night') {
      ctx.fillStyle = '#fff'
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 73 + 17) % w)
        const sy = ((i * 41 + 8) % (skyH * 0.6))
        const twinkle = Math.sin(Date.now() / 500 + i) * 0.5 + 0.5
        ctx.globalAlpha = twinkle * 0.8
        ctx.fillRect(sx, sy, 2, 2)
      }
      ctx.globalAlpha = 1
    }

    // 天气效果
    const weather = this.config.weather
    if (weather === 'snow') {
      this.drawSnow(ctx, w, h, speedFactor)
    } else if (weather === 'rain') {
      this.drawRain(ctx, w, h, speedFactor)
    }
  }

  // 云朵
  drawCloud(ctx, x, y, size) {
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

  // 远景层（山脉/城市剪影）
  drawFarLayer(ctx, w, h, speedFactor) {
    const terrain = this.config.terrain || 'plain'
    const baseY = h * 0.35

    if (terrain === 'mountain' || terrain === 'tunnel') {
      // 连绵山脉
      ctx.fillStyle = 'rgba(40, 50, 80, 0.8)'
      ctx.beginPath()
      ctx.moveTo(0, baseY)
      for (let x = 0; x <= w; x += 3) {
        const y = baseY - 40 - Math.sin((x + this.offsetFar * 50) * 0.008) * 35
          - Math.sin((x + this.offsetFar * 50) * 0.015) * 20
        ctx.lineTo(x, y)
      }
      ctx.lineTo(w, baseY)
      ctx.closePath()
      ctx.fill()

      // 更远的山
      ctx.fillStyle = 'rgba(30, 35, 60, 0.6)'
      ctx.beginPath()
      ctx.moveTo(0, baseY + 10)
      for (let x = 0; x <= w; x += 3) {
        const y = baseY - 15 - Math.sin((x + this.offsetFar * 30) * 0.006 + 2) * 25
        ctx.lineTo(x, y)
      }
      ctx.lineTo(w, baseY + 10)
      ctx.closePath()
      ctx.fill()
    } else if (terrain === 'city') {
      // 城市建筑剪影
      ctx.fillStyle = 'rgba(20, 20, 50, 0.9)'
      for (let i = 0; i < 12; i++) {
        const bx = ((i * 80 + this.offsetFar * 20) % (w + 160)) - 80
        const bh = 30 + (Math.sin(i * 3.7) * 0.5 + 0.5) * 60
        const bw = 15 + (Math.sin(i * 2.3) * 0.5 + 0.5) * 20
        ctx.fillRect(bx, baseY - bh, bw, bh)

        // 窗户灯光（夜间）
        if (this.config.time === 'night') {
          ctx.fillStyle = 'rgba(255, 200, 50, 0.6)'
          for (let wy = baseY - bh + 5; wy < baseY - 3; wy += 8) {
            for (let wx = bx + 3; wx < bx + bw - 3; wx += 6) {
              if (Math.random() > 0.3) {
                ctx.fillRect(wx, wy, 3, 4)
              }
            }
          }
          ctx.fillStyle = 'rgba(20, 20, 50, 0.9)'
        }
      }
    } else if (terrain === 'coast') {
      // 海平面
      const seaGrad = ctx.createLinearGradient(0, baseY - 10, 0, baseY + 30)
      seaGrad.addColorStop(0, 'rgba(30, 100, 180, 0.6)')
      seaGrad.addColorStop(1, 'rgba(20, 60, 120, 0.4)')
      ctx.fillStyle = seaGrad
      ctx.fillRect(0, baseY - 5, w, 35)

      // 海浪线
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)'
      ctx.lineWidth = 1
      for (let line = 0; line < 3; line++) {
        ctx.beginPath()
        for (let x = 0; x <= w; x += 2) {
          const y = baseY + line * 8 + Math.sin((x + this.offsetFar * 40 + line * 50) * 0.03) * 3
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    } else {
      // 平原（简单地平线）
      ctx.fillStyle = 'rgba(50, 80, 50, 0.4)'
      ctx.fillRect(0, baseY - 3, w, 6)
    }
  }

  // 中景层
  drawMidLayer(ctx, w, h, speedFactor) {
    const baseY = h * 0.5

    // 电线杆 / 树木
    ctx.fillStyle = 'rgba(60, 60, 80, 0.7)'
    for (let i = 0; i < 6; i++) {
      const x = ((i * 150 + this.offsetMid * 80) % (w + 300)) - 150
      const terrain = this.config.terrain

      if (terrain === 'mountain' || terrain === 'tunnel') {
        // 树木
        this.drawTree(ctx, x, baseY - 5, 15 + i * 2)
      } else if (terrain === 'city') {
        // 路灯
        ctx.fillRect(x + 8, baseY - 30, 3, 30)
        ctx.fillStyle = 'rgba(255, 200, 50, 0.5)'
        ctx.beginPath()
        ctx.arc(x + 9, baseY - 30, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(60, 60, 80, 0.7)'
      } else {
        // 电线杆
        ctx.fillRect(x + 6, baseY - 35, 3, 35)
        ctx.fillRect(x, baseY - 33, 18, 2)
      }
    }
  }

  drawTree(ctx, x, y, size) {
    ctx.fillStyle = 'rgba(40, 60, 30, 0.7)'
    // 树干
    ctx.fillRect(x + size * 0.4, y - size * 0.3, size * 0.2, size * 0.5)
    // 树冠
    ctx.beginPath()
    ctx.moveTo(x, y - size * 0.3)
    ctx.lineTo(x + size * 0.5, y - size)
    ctx.lineTo(x + size, y - size * 0.3)
    ctx.closePath()
    ctx.fill()
  }

  // 轨道层
  drawTrack(ctx, w, h, speedFactor) {
    const trackY = h * 0.55
    const trackH = h - trackY
    const horizonY = trackY

    // 大地渐变
    const groundGrad = ctx.createLinearGradient(0, trackY, 0, h)
    groundGrad.addColorStop(0, '#3a3a2a')
    groundGrad.addColorStop(0.3, '#4a4a3a')
    groundGrad.addColorStop(1, '#2a2a1a')
    ctx.fillStyle = groundGrad
    ctx.fillRect(0, trackY, w, trackH)

    // 轨道（透视汇聚）
    const vanishX = w / 2
    const vanishY = trackY - 20
    const railWidth = w * 0.35

    // 道砟（碎石）
    ctx.fillStyle = '#5a5a4a'
    ctx.beginPath()
    ctx.moveTo(vanishX - 3, vanishY + 10)
    ctx.lineTo(vanishX - railWidth, h)
    ctx.lineTo(vanishX + railWidth, h)
    ctx.lineTo(vanishX + 3, vanishY + 10)
    ctx.closePath()
    ctx.fill()

    // 枕木
    const numSleepers = 15
    for (let i = 0; i < numSleepers; i++) {
      const t = (i + (this.offsetTrack % 1) ) / numSleepers
      const y = vanishY + 10 + (h - vanishY - 10) * t
      const width = 3 + railWidth * 2 * t
      const alpha = 0.3 + t * 0.5
      ctx.fillStyle = `rgba(80, 70, 50, ${alpha})`
      ctx.fillRect(vanishX - width / 2, y - 1, width, 2 + t * 3)
    }

    // 铁轨
    for (let side = -1; side <= 1; side += 2) {
      ctx.strokeStyle = '#8a8a7a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(vanishX + side * 2, vanishY + 10)
      ctx.lineTo(vanishX + side * railWidth, h)
      ctx.stroke()
    }

    // 中心线
    ctx.strokeStyle = 'rgba(100, 100, 80, 0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(vanishX, vanishY + 10)
    ctx.lineTo(vanishX, h)
    ctx.stroke()
  }

  // 隧道效果
  drawTunnel(ctx, w, h, speedFactor) {
    // 暗色遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
    ctx.fillRect(0, 0, w, h)

    // 隧道壁
    ctx.fillStyle = 'rgba(40, 35, 30, 0.8)'
    ctx.fillRect(0, 0, w * 0.15, h)
    ctx.fillRect(w * 0.85, 0, w * 0.15, h)

    // 隧道灯（流动）
    const lightCount = 5
    for (let i = 0; i < lightCount; i++) {
      const ly = ((i * h / lightCount + this.offsetTrack * 50) % h)
      const flicker = Math.sin(Date.now() / 100 + i * 2) * 0.3 + 0.7
      ctx.fillStyle = `rgba(255, 200, 100, ${0.15 * flicker})`
      ctx.beginPath()
      ctx.arc(w * 0.12, ly, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(w * 0.88, ly, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    // 远端出口光
    const exitGlow = ctx.createRadialGradient(w / 2, h * 0.1, 0, w / 2, h * 0.1, 120)
    exitGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
    exitGlow.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = exitGlow
    ctx.fillRect(0, 0, w, h * 0.4)
  }

  // 对向列车
  drawOncomingTrain(ctx, w, h, speedFactor) {
    const train = this.oncomingTrain
    if (!train) return

    const cx = w / 2
    const trackY = h * 0.55

    // 列车从远处接近
    train.scale += 0.008 + speedFactor * 0.015
    train.x = cx // 始终在中心

    const scale = train.scale
    const trainW = 20 * scale
    const trainH = 12 * scale
    const trainY = trackY - trainH / 2 + (h - trackY) * 0.15

    if (scale > 3) {
      // 已经交汇过，重置
      this.oncomingTrain = null
      return
    }

    // 车身
    ctx.fillStyle = '#1a237e'
    ctx.fillRect(cx - trainW / 2, trainY, trainW, trainH)

    // 车头灯
    if (scale > 0.5) {
      const glow = ctx.createRadialGradient(cx, trainY + trainH * 0.3, 0, cx, trainY + trainH * 0.3, trainW * 1.5)
      glow.addColorStop(0, `rgba(255, 255, 200, ${Math.min(0.5, scale * 0.15)})`)
      glow.addColorStop(1, 'rgba(255, 255, 200, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(cx - trainW * 2, trainY - trainH, trainW * 4, trainH * 3)
    }

    // 车窗
    if (scale > 1.5) {
      ctx.fillStyle = 'rgba(200, 220, 255, 0.5)'
      const winCount = Math.floor(trainW / 4)
      for (let i = 0; i < winCount; i++) {
        ctx.fillRect(cx - trainW / 2 + 2 + i * 4, trainY + 2, 2, trainH * 0.4)
      }
    }

    // 交汇时的冲击效果
    if (scale > 2 && scale < 2.5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.fillRect(0, 0, w, h)
    }
  }

  // 速度线粒子
  drawSpeedLines(ctx, w, h, speedFactor) {
    const count = Math.floor(speedFactor * 20)
    ctx.strokeStyle = `rgba(255, 255, 255, ${speedFactor * 0.15})`
    ctx.lineWidth = 1

    for (let i = 0; i < count; i++) {
      const x = Math.random() * w
      const y = h * 0.3 + Math.random() * h * 0.4
      const len = 20 + speedFactor * 40
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - len, y + 2)
      ctx.stroke()
    }
  }

  // 驾驶舱边框
  drawCockpit(ctx, w, h) {
    // A柱（左侧）
    ctx.fillStyle = 'rgba(20, 20, 30, 0.95)'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(w * 0.08, 0)
    ctx.lineTo(w * 0.03, h * 0.6)
    ctx.lineTo(0, h * 0.5)
    ctx.closePath()
    ctx.fill()

    // A柱（右侧）
    ctx.beginPath()
    ctx.moveTo(w, 0)
    ctx.lineTo(w * 0.92, 0)
    ctx.lineTo(w * 0.97, h * 0.6)
    ctx.lineTo(w, h * 0.5)
    ctx.closePath()
    ctx.fill()

    // 底部仪表台
    const dashY = h * 0.82
    const dashGrad = ctx.createLinearGradient(0, dashY, 0, h)
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

    // 挡风玻璃上边框
    ctx.fillStyle = 'rgba(15, 15, 25, 0.8)'
    ctx.fillRect(0, 0, w, 4)

    // 后视镜
    ctx.fillStyle = 'rgba(30, 30, 40, 0.9)'
    ctx.fillRect(w * 0.35, 30, w * 0.3, 12)
    ctx.fillStyle = 'rgba(100, 120, 150, 0.3)'
    ctx.fillRect(w * 0.36, 32, w * 0.28, 8)
  }

  // 雪花效果
  drawSnow(ctx, w, h, speedFactor) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    const time = Date.now() / 1000
    for (let i = 0; i < 30; i++) {
      const x = (Math.sin(i * 3.7 + time) * 0.5 + 0.5) * w
      const y = ((i * 47 + time * (60 + speedFactor * 40)) % h)
      const r = 1 + Math.sin(i) * 1
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // 雨滴效果
  drawRain(ctx, w, h, speedFactor) {
    ctx.strokeStyle = 'rgba(150, 180, 255, 0.3)'
    ctx.lineWidth = 1
    const time = Date.now() / 500
    for (let i = 0; i < 25; i++) {
      const x = (i * 31 + 17) % w
      const y = ((i * 53 + time * (80 + speedFactor * 60)) % h)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - 3, y + 12)
      ctx.stroke()
    }
  }
}

module.exports = Renderer
