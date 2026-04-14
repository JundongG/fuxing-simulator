// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'prod-xxxxx', // 替换为你的云开发环境ID
        traceUser: true,
      })
    }

    // 获取系统信息
    const sysInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = sysInfo
    this.globalData.screenWidth = sysInfo.screenWidth
    this.globalData.screenHeight = sysInfo.screenHeight
    this.globalData.pixelRatio = sysInfo.pixelRatio

    console.log('[App] 系统信息:', sysInfo.model, sysInfo.screenWidth + 'x' + sysInfo.screenHeight)
  },

  globalData: {
    systemInfo: null,
    screenWidth: 375,
    screenHeight: 812,
    pixelRatio: 2,
    selectedChar: null,
    currentScene: null,
  }
})
