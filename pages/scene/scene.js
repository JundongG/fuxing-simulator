// pages/scene/scene.js
Page({
  data: {
    scene: null,
    from: 'preset',
    character: null,
  },

  onLoad(options) {
    const gd = wx._globalData
    const scene = gd.currentScene
    if (!scene) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }
    this.setData({
      scene,
      from: options.from || 'preset',
      character: gd.selectedChar || null,
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
