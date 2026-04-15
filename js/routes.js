// js/routes.js — 预制线路数据 v1.0（带难度分级）
var routes = [
  {
    id: 'beijing_tianjin',
    name: '京津城际',
    emoji: '🚄',
    desc: '中国第一条高铁，平直高速，新手友好。',
    knowledge: '京津城际全长120公里，2008年开通，是中国第一条设计时速350公里的高速铁路。',
    distance: 20,
    difficulty: 1,
    config: { time: 'day', weather: 'clear', terrain: 'plain', speedLimit: 350, landmarks: ['北京南站', '武清站', '天津站'] }
  },
  {
    id: 'shanghai_hangzhou',
    name: '沪杭高铁',
    emoji: '🌆',
    desc: '连接上海与杭州，有曲线和隧道，中级挑战。',
    knowledge: '沪杭高铁全长169公里，设计时速350公里，连接两座长三角核心城市。',
    distance: 30,
    difficulty: 2,
    config: { time: 'day', weather: 'clear', terrain: 'plain', speedLimit: 350, landmarks: ['上海虹桥站', '嘉兴南站', '杭州东站'] }
  },
  {
    id: 'wuyishan',
    name: '合福高铁隧道群',
    emoji: '🌲',
    desc: '穿越武夷山脉，连续隧道与限速，注意信号！',
    knowledge: '合福高铁穿越武夷山脉，隧道总长占比超过60%，是典型的山区高铁。',
    distance: 35,
    difficulty: 2,
    config: { time: 'day', weather: 'clear', terrain: 'tunnel', speedLimit: 300, landmarks: ['武夷山东站', '闽江特大桥'] }
  },
  {
    id: 'kuahai',
    name: '福厦跨海线',
    emoji: '🌊',
    desc: '列车飞驰在海上高架桥，海天一色。',
    knowledge: '福厦高铁是中国首条跨海高铁，设计时速350公里，跨越湄洲湾等多处海湾。',
    distance: 25,
    difficulty: 2,
    config: { time: 'sunset', weather: 'clear', terrain: 'coast', speedLimit: 350, landmarks: ['湄洲湾跨海大桥', '泉州湾大桥'] }
  },
  {
    id: 'dongbei_snow',
    name: '哈大高铁·雪国',
    emoji: '❄️',
    desc: '穿越白山黑水，雪天制动距离大幅增加！',
    knowledge: '哈大高铁是世界首条高寒高铁，可在-40°C极寒条件下以300km/h速度运行。',
    distance: 40,
    difficulty: 3,
    config: { time: 'day', weather: 'snow', terrain: 'plain', speedLimit: 300, landmarks: ['哈尔滨西站', '长春站', '沈阳北站'] }
  },
  {
    id: 'shanghai_rain',
    name: '京沪线·雨夜',
    emoji: '🌧️',
    desc: '夜间雨中驾驶，视线模糊，制动距离延长！',
    knowledge: '京沪高铁全长1318公里，是世界上一次建成里程最长的高速铁路。',
    distance: 35,
    difficulty: 3,
    config: { time: 'night', weather: 'rain', terrain: 'plain', speedLimit: 350, landmarks: ['南京南站', '济南西站', '天津南站'] }
  }
]

module.exports = routes
