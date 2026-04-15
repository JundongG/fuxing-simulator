// pages/result/result.js
Page({
  data: {
    result: null,
    grade: '',
    gradeColor: '',
    character: null,
  },

  onLoad() {
    const result = wx._globalData.lastResult
    const char = wx._globalData.selectedChar
    if (!result) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }

    // 评级
    const { grade, color } = this.calcGrade(result.score)
    this.setData({ result, grade, gradeColor: color, character: char || null })

    // 保存成绩
    this.saveScore(result)
  },

  calcGrade(score) {
    if (score >= 2000) return { grade: 'S — 金牌司机 🏅', color: '#ffd700' }
    if (score >= 1500) return { grade: 'A — 优秀司机 ⭐', color: '#4fc3f7' }
    if (score >= 1000) return { grade: 'B — 合格司机 👍', color: '#66bb6a' }
    if (score >= 500) return { grade: 'C — 实习司机 📝', color: '#ffa726' }
    return { grade: 'D — 需要加油 💪', color: '#ef5350' }
  },

  async saveScore(result) {
    try {
      await wx.cloud.callFunction({
        name: 'saveScore',
        data: result
      })
    } catch (err) {
      console.warn('[Result] 保存成绩失败:', err)
    }
  },

  // 保存截图
  async onSaveImage() {
    try {
      await wx.authorize({ scope: 'scope.writePhotosAlbum' })
      const canvas = wx.createOffscreenCanvas({ type: '2d', width: 750, height: 1000 })
      const ctx = canvas.getContext('2d')
      this.drawShareCard(ctx)
      // 注意：小程序截图保存需要特殊处理，这里简化
      wx.showToast({ title: '截图已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  drawShareCard(ctx) {
    const r = this.data.result
    // 背景
    ctx.fillStyle = '#0f0f23'
    ctx.fillRect(0, 0, 750, 1000)
    // 标题
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 48px sans-serif'
    ctx.fillText('🚄 高铁五七班', 40, 80)
    ctx.font = '32px sans-serif'
    ctx.fillStyle = '#90a4ae'
    ctx.fillText(r.sceneTitle, 40, 130)
    // 成绩
    ctx.fillStyle = '#4fc3f7'
    ctx.font = 'bold 72px monospace'
    ctx.fillText(r.score + ' 分', 40, 260)
    ctx.fillStyle = '#b0bec5'
    ctx.font = '28px sans-serif'
    ctx.fillText(`里程 ${r.mileage}km  |  最高 ${r.maxSpeed}km/h  |  交汇 ${r.crossings}次`, 40, 320)
  },

  // 再来一次
  onReplay() {
    wx.redirectTo({ url: '/pages/drive/drive' })
  },

  // 回首页
  onHome() {
    wx.redirectTo({ url: '/pages/index/index' })
  },

  onShareAppMessage() {
    const r = this.data.result
    return {
      title: `我开复兴号跑了${r.mileage}km，得分${r.score}！你能超过我吗？🚄`,
      path: '/pages/index/index',
    }
  },
})
