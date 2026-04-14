// utils/config.js — 全局配置
module.exports = {
  // 云开发环境ID（部署时替换）
  CLOUD_ENV: 'prod-xxxxx',

  // 游戏配置
  GAME: {
    MAX_SPEED: 380,           // 最大速度
    DEFAULT_SPEED_LIMIT: 350, // 默认限速
    ACCELERATION: 1.0,        // 加速度
    BRAKE_FORCE: 80,          // 刹车力度
    DRAG_HIGH: 0.8,           // 高速阻力
    DRAG_LOW: 0.3,            // 低速阻力
    TARGET_MILEAGE: 50,       // 目标里程(km)
    EVENT_MIN_GAP: 2,         // 事件最小间隔(km)
    EVENT_MAX_GAP: 6,         // 事件最大间隔(km)
  },

  // AI配置
  AI: {
    MODEL: 'hunyuan-turbo',
    MAX_TOKENS: 500,
    TEMPERATURE: 0.8,
  },

  // 分数配置
  SCORE: {
    SPEED_LIMIT_PASS: 100,    // 通过限速
    SIGNAL_YELLOW_PASS: 80,   // 通过黄灯
    SIGNAL_RED_PASS: 150,     // 通过红灯
    CROSSING_PASS: 60,        // 通过交汇
    TUNNEL_PASS: 30,          // 通过隧道
    BRAKE_BONUS: 5,           // 刹车加分
    FAIL_PENALTY: 100,        // 失败扣分
  },
}
