// app.js — 云开发初始化（容错版）
App({
  onLaunch() {
    // 初始化云开发（容错）
    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: 'prod-xxxxx', // TODO: 替换为你的云开发环境ID
          traceUser: true,
        })
      } catch (e) {
        console.warn('[App] 云开发初始化跳过:', e.message)
      }
    }

    // 获取系统信息
    try {
      const sysInfo = wx.getSystemInfoSync()
      this.globalData.systemInfo = sysInfo
      this.globalData.screenWidth = sysInfo.screenWidth
      this.globalData.screenHeight = sysInfo.screenHeight
      this.globalData.pixelRatio = sysInfo.pixelRatio
      console.log('[App] 系统信息:', sysInfo.model, sysInfo.screenWidth + 'x' + sysInfo.screenHeight)
    } catch (e) {
      console.warn('[App] 获取系统信息失败:', e.message)
    }
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
