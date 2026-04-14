// pages/scene/scene.js
Page({
  data: {
    scene: null,
    from: 'preset',
    character: null,
  },

  onLoad(options) {
    const app = getApp()
    const scene = app.globalData.currentScene
    if (!scene) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }
    this.setData({
      scene,
      from: options.from || 'preset',
      character: app.globalData.selectedChar || null,
    })
  },

  onStartDrive() {
    wx.navigateTo({
      url: '/pages/drive/drive',
    })
  },

  onBack() {
    wx.navigateBack()
  },
})
