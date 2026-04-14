// pages/scene/scene.js
Page({
  data: {
    scene: null,
    from: 'preset',
  },

  onLoad(options) {
    const scene = getApp().globalData.currentScene
    if (!scene) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }
    this.setData({
      scene,
      from: options.from || 'preset',
    })
  },

  // 进入驾驶
  onStartDrive() {
    wx.navigateTo({
      url: '/pages/drive/drive',
    })
  },

  // 返回首页
  onBack() {
    wx.navigateBack()
  },
})
