// pages/index/index.js
const presetRoutes = require('../../utils/routes')

Page({
  data: {
    aiInput: '',
    loading: false,
    routes: presetRoutes,
    hotRoutes: presetRoutes.slice(0, 6),
  },

  onInputChange(e) {
    this.setData({ aiInput: e.detail.value })
  },

  // AI生成场景并进入驾驶
  async onGenerate() {
    const input = this.data.aiInput.trim()
    if (!input) {
      wx.showToast({ title: '请输入你想开的路线', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'aiGenerate',
        data: { description: input }
      })

      const sceneData = res.result.data
      if (!sceneData) {
        throw new Error('生成失败')
      }

      // 保存到全局，跳转到场景介绍页
      getApp().globalData.currentScene = sceneData
      wx.navigateTo({ url: '/pages/scene/scene?from=ai' })
    } catch (err) {
      console.error('[AI生成失败]', err)
      wx.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 选择预制线路
  onSelectRoute(e) {
    const route = e.currentTarget.dataset.route
    getApp().globalData.currentScene = {
      title: route.name,
      description: route.desc,
      knowledge: route.knowledge,
      coverId: route.coverId,
      config: route.config,
    }
    wx.navigateTo({ url: '/pages/scene/scene?from=preset' })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '来开一次复兴号！AI一句话生成你的高铁之旅 🚄',
      path: '/pages/index/index',
    }
  }
})
