// utils/storage.js — 本地存储工具
const HISTORY_KEY = 'drive_history'
const SETTINGS_KEY = 'user_settings'

module.exports = {
  // 获取驾驶历史
  getHistory() {
    try {
      return wx.getStorageSync(HISTORY_KEY) || []
    } catch {
      return []
    }
  },

  // 添加驾驶记录
  addHistory(record) {
    const history = this.getHistory()
    history.unshift({
      ...record,
      timestamp: Date.now(),
    })
    // 最多保留50条
    if (history.length > 50) history.length = 50
    wx.setStorageSync(HISTORY_KEY, history)
  },

  // 获取用户设置
  getSettings() {
    try {
      return wx.getStorageSync(SETTINGS_KEY) || {
        soundEnabled: true,
        hapticEnabled: true,
        quality: 'high',
      }
    } catch {
      return { soundEnabled: true, hapticEnabled: true, quality: 'high' }
    }
  },

  // 保存用户设置
  saveSettings(settings) {
    wx.setStorageSync(SETTINGS_KEY, settings)
  },

  // 清除所有数据
  clearAll() {
    wx.removeStorageSync(HISTORY_KEY)
    wx.removeStorageSync(SETTINGS_KEY)
  },
}
