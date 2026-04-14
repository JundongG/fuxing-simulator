// utils/routes.js — 预制线路数据
module.exports = [
  {
    id: 'qingzang',
    name: '青藏高原线',
    emoji: '🏔️',
    desc: '穿越世界屋脊，窗外雪山连绵，蓝天触手可及。列车行驶在海拔4000米的高原之上。',
    knowledge: '青藏铁路是世界上海拔最高、线路最长的高原铁路，最高点海拔5072米。',
    distance: 1956,
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    coverId: 'qingzang',
    config: {
      time: 'day',
      weather: 'clear',
      terrain: 'mountain',
      speedLimit: 160,
      landmarks: ['昆仑山', '唐古拉山', '可可西里'],
    }
  },
  {
    id: 'jinghu',
    name: '京沪高速线',
    emoji: '🌆',
    desc: '连接北京与上海的经济大动脉，感受中国最繁忙高铁线路的速度与激情。',
    knowledge: '京沪高铁全长1318公里，是世界上一次建成里程最长的高速铁路。',
    distance: 1318,
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    coverId: 'jinghu',
    config: {
      time: 'day',
      weather: 'clear',
      terrain: 'plain',
      speedLimit: 350,
      landmarks: ['南京南站', '济南西站', '天津南站'],
    }
  },
  {
    id: 'wuyishan',
    name: '武夷山隧道群',
    emoji: '🌲',
    desc: '列车穿行于闽北山区，连续隧道与青山绿水交替出现，光影明灭间感受速度。',
    knowledge: '合福高铁穿越武夷山脉，隧道总长占比超过60%，是典型的山区高铁。',
    distance: 850,
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    coverId: 'wuyishan',
    config: {
      time: 'day',
      weather: 'clear',
      terrain: 'tunnel',
      speedLimit: 300,
      landmarks: ['武夷山东站', '闽江特大桥'],
    }
  },
  {
    id: 'kuahai',
    name: '福厦跨海线',
    emoji: '🌊',
    desc: '列车飞驰在海上高架桥，两侧碧波万顷，海天一色，体验"海上高铁"的壮阔。',
    knowledge: '福厦高铁是中国首条跨海高铁，设计时速350公里，跨越湄洲湾等多处海湾。',
    distance: 277,
    gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    coverId: 'kuahai',
    config: {
      time: 'sunset',
      weather: 'clear',
      terrain: 'coast',
      speedLimit: 350,
      landmarks: ['湄洲湾跨海大桥', '泉州湾大桥'],
    }
  },
  {
    id: 'waitan',
    name: '上海外滩夜景',
    emoji: '🌃',
    desc: '夜间驶入魔都，窗外是璀璨的外滩灯光，陆家嘴天际线在远处闪烁。',
    knowledge: '上海虹桥站是中国最繁忙的高铁站之一，日均发送旅客超20万人次。',
    distance: 130,
    gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    coverId: 'waitan',
    config: {
      time: 'night',
      weather: 'clear',
      terrain: 'city',
      speedLimit: 300,
      landmarks: ['陆家嘴', '外滩', '东方明珠'],
    }
  },
  {
    id: 'dongbei',
    name: '东北雪国线',
    emoji: '❄️',
    desc: '穿越白山黑水，车窗外雪花纷飞，银装素裹的东北大地一望无际。',
    knowledge: '哈大高铁是世界首条高寒高铁，可在-40°C极寒条件下以300km/h速度运行。',
    distance: 921,
    gradient: 'linear-gradient(135deg, #89f7fe, #66a6ff)',
    coverId: 'dongbei',
    config: {
      time: 'day',
      weather: 'snow',
      terrain: 'plain',
      speedLimit: 300,
      landmarks: ['哈尔滨西站', '长春站', '沈阳北站'],
    }
  },
  {
    id: 'chengkun',
    name: '成昆铁路复线',
    emoji: '🏞️',
    desc: '穿越西南深山峡谷，桥隧相连，窗外是奔腾的金沙江和险峻的山崖。',
    knowledge: '成昆铁路被誉为"地质博物馆"，全线桥隧总长占线路总长的41.6%。',
    distance: 773,
    gradient: 'linear-gradient(135deg, #fccb90, #d57eeb)',
    coverId: 'chengkun',
    config: {
      time: 'day',
      weather: 'clear',
      terrain: 'mountain',
      speedLimit: 160,
      landmarks: ['金沙江', '大渡河', '凉山隧道群'],
    }
  },
  {
    id: 'guangshengang',
    name: '广深港高铁',
    emoji: '🇭🇰',
    desc: '从广州南出发，经深圳北直达香港西九龙，体验跨境高铁的独特魅力。',
    knowledge: '广深港高铁全长141公里，其中香港段26公里，全程最快仅需47分钟。',
    distance: 141,
    gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
    coverId: 'guangshengang',
    config: {
      time: 'sunset',
      weather: 'clear',
      terrain: 'city',
      speedLimit: 350,
      landmarks: ['虎门大桥', '深圳北站', '西九龙站'],
    }
  },
]
