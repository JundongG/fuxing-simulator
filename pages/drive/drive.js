// pages/drive/drive.js — 驾驶界面（核心）
const Renderer = require('./engine/renderer')

Page({
  data: {
    speed: 0,
    mileage: 0,
    score: 0,
    signalStatus: 'green',
    signalText: '前方畅通',
    eventVisible: false,
    eventText: '',
    eventType: '',
    paused: false,
    timeElapsed: 0,
    crossings: 0,
    eventsPassed: 0,
    eventsTotal: 0,
  },

  canvas: null,
  ctx: null,
  renderer: null,
  animFrameId: null,
  gameTimer: null,
  startTime: 0,
  targetSpeed: 0,

  // 游戏状态
  state: {
    speed: 0,
    mileage: 0,
    score: 0,
    maxSpeed: 0,
    crossings: 0,
    eventsPassed: 0,
    eventsTotal: 0,
    paused: false,
    gameOver: false,
    sceneConfig: null,
  },

  // 事件队列
  eventQueue: [],
  nextEventMileage: 2,

  onLoad() {
    const scene = getApp().globalData.currentScene
    this.state.sceneConfig = scene ? scene.config : {
      time: 'day', weather: 'clear', terrain: 'plain', speedLimit: 350, landmarks: []
    }
    this.initCanvas()
    this.generateEvents()
    this.startGameLoop()
  },

  onUnload() {
    this.stopGameLoop()
  },

  // 初始化Canvas
  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) {
          console.error('[Drive] Canvas not found')
          return
        }
        this.canvas = res[0].node
        this.ctx = this.canvas.getContext('2d')

        const dpr = wx.getSystemInfoSync().pixelRatio
        this.canvas.width = res[0].width * dpr
        this.canvas.height = res[0].height * dpr
        this.ctx.scale(dpr, dpr)

        this.renderer = new Renderer(this.ctx, res[0].width, res[0].height, this.state.sceneConfig)
        console.log('[Drive] Canvas初始化完成', res[0].width, 'x', res[0].height)
      })
  },

  // 生成事件序列
  generateEvents() {
    const events = []
    let km = 3 + Math.random() * 3

    while (km < 50) {
      const type = this.randomEvent()
      events.push({ mileage: km, type, handled: false })
      km += 2 + Math.random() * 4
    }

    this.eventQueue = events
    this.nextEventMileage = events.length > 0 ? events[0].mileage : 999
    this.setData({ eventsTotal: events.length })
    this.state.eventsTotal = events.length
  },

  randomEvent() {
    const types = ['speed_limit', 'signal_yellow', 'signal_red', 'crossing', 'tunnel']
    return types[Math.floor(Math.random() * types.length)]
  },

  // 开始游戏循环
  startGameLoop() {
    this.startTime = Date.now()

    // 计时器
    this.gameTimer = setInterval(() => {
      if (!this.state.paused) {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
        this.setData({ timeElapsed: elapsed })
      }
    }, 1000)

    // 渲染循环
    const loop = () => {
      if (!this.state.paused && !this.state.gameOver) {
        this.update()
        this.render()
      }
      this.animFrameId = wxAnimationFrame(loop)
    }

    // 兼容：wx下用requestAnimationFrame替代
    if (typeof wxAnimationFrame === 'undefined') {
      const self = this
      const raf = function() {
        if (!self.state.paused && !self.state.gameOver) {
          self.update()
          self.render()
        }
        self.animFrameId = setTimeout(raf, 16)
      }
      raf()
    } else {
      loop()
    }
  },

  stopGameLoop() {
    if (this.animFrameId) {
      clearTimeout(this.animFrameId)
      this.animFrameId = null
    }
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
      this.gameTimer = null
    }
  },

  // 物理更新
  update() {
    const dt = 1 / 60
    const cfg = this.state.sceneConfig

    // 速度 → 里程
    this.state.mileage += (this.state.speed / 3600) * dt * 60

    // 最高速度记录
    if (this.state.speed > this.state.maxSpeed) {
      this.state.maxSpeed = this.state.speed
    }

    // 自然阻力（高速时风阻增大）
    if (this.targetSpeed < this.state.speed) {
      const drag = this.state.speed > 200 ? 0.8 : 0.3
      this.state.speed = Math.max(this.targetSpeed, this.state.speed - drag)
    } else if (this.targetSpeed > this.state.speed) {
      const acc = this.state.speed < 100 ? 1.2 : 0.6
      this.state.speed = Math.min(this.targetSpeed, this.state.speed + acc)
    }

    // 更新UI
    this.setData({
      speed: Math.round(this.state.speed),
      mileage: this.state.mileage.toFixed(1),
      score: this.state.score,
    })

    // 检查事件
    this.checkEvents()
  },

  // 渲染
  render() {
    if (!this.renderer) return
    this.renderer.draw(this.state.speed, this.state.mileage)
  },

  // 检查事件触发
  checkEvents() {
    if (this.state.mileage >= this.nextEventMileage) {
      const event = this.eventQueue.find(e => !e.handled)
      if (event) {
        event.handled = true
        this.triggerEvent(event)
        // 下一个事件
        const next = this.eventQueue.find(e => !e.handled)
        this.nextEventMileage = next ? next.mileage : 999
      }
    }
  },

  // 触发事件
  triggerEvent(event) {
    const info = this.getEventInfo(event.type)

    this.setData({
      eventVisible: true,
      eventText: info.text,
      eventType: event.type,
    })

    // 信号灯状态
    if (event.type.startsWith('signal_')) {
      this.setData({
        signalStatus: event.type === 'signal_yellow' ? 'yellow' : 'red',
        signalText: info.signalText,
      })
    }

    // 15秒内未处理则扣分
    this._eventTimer = setTimeout(() => {
      if (this.data.eventVisible) {
        this.state.score = Math.max(0, this.state.score - 100)
        this.setData({
          eventVisible: false,
          score: this.state.score,
          eventsPassed: this.state.eventsPassed,
        })
      }
    }, 12000)
  },

  getEventInfo(type) {
    const infos = {
      speed_limit: { text: '⚠️ 前方施工，限速 200km/h', signalText: '⚠️ 限速200' },
      signal_yellow: { text: '🟡 前方信号灯变黄，注意减速', signalText: '🟡 注意减速' },
      signal_red: { text: '🔴 前方红灯，请立即停车！', signalText: '🔴 紧急停车' },
      crossing: { text: '🚄 前方有对向列车交汇！', signalText: '🚄 注意交汇' },
      tunnel: { text: '🕳️ 即将进入隧道', signalText: '🕳️ 进入隧道' },
    }
    return infos[type] || { text: '未知事件', signalText: '' }
  },

  // === 交互事件 ===

  onAccelerate() {
    const limit = this.state.sceneConfig.speedLimit || 350
    this.targetSpeed = Math.min(limit + 10, this.targetSpeed + 30)
    this.targetSpeed = Math.min(380, this.targetSpeed)
  },

  onBrake() {
    this.targetSpeed = Math.max(0, this.targetSpeed - 80)
    this.state.score += 5 // 刹车加分
  },

  // 处理事件（用户确认）
  onHandleEvent() {
    if (this._eventTimer) clearTimeout(this._eventTimer)

    const eventType = this.data.eventType

    // 根据事件类型判断处理结果
    let handled = false
    if (eventType === 'speed_limit') {
      if (this.state.speed <= 220) {
        handled = true
        this.state.score += 100
      } else {
        this.state.score = Math.max(0, this.state.score - 50)
      }
    } else if (eventType === 'signal_yellow') {
      if (this.state.speed <= 200) {
        handled = true
        this.state.score += 80
      } else {
        this.state.score = Math.max(0, this.state.score - 30)
      }
    } else if (eventType === 'signal_red') {
      if (this.state.speed <= 30) {
        handled = true
        this.state.score += 150
      } else {
        this.state.score = Math.max(0, this.state.score - 100)
      }
    } else if (eventType === 'crossing') {
      handled = true
      this.state.score += 60
      this.state.crossings++
      this.setData({ crossings: this.state.crossings })
    } else if (eventType === 'tunnel') {
      handled = true
      this.state.score += 30
    }

    this.state.eventsPassed++
    this.setData({
      eventVisible: false,
      score: this.state.score,
      signalStatus: 'green',
      signalText: '前方畅通',
    })
  },

  // 暂停
  onPause() {
    this.state.paused = !this.state.paused
    this.setData({ paused: this.state.paused })
  },

  // 结束驾驶
  onFinish() {
    this.state.gameOver = true
    this.stopGameLoop()

    const result = {
      mileage: this.state.mileage.toFixed(1),
      maxSpeed: this.state.maxSpeed,
      score: this.state.score,
      crossings: this.state.crossings,
      eventsPassed: this.state.eventsPassed,
      eventsTotal: this.state.eventsTotal,
      duration: this.data.timeElapsed,
      sceneTitle: getApp().globalData.currentScene?.title || '自由驾驶',
    }

    getApp().globalData.lastResult = result
    wx.redirectTo({ url: '/pages/result/result' })
  },

  // 阻止分享
  onShareAppMessage() {
    return {
      title: '高铁五七班 — 我刚开复兴号穿越了风景！你也来试试？',
      path: '/pages/index/index',
    }
  },
})
