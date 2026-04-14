// cloudfunctions/aiGenerate/index.js — AI场景生成云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// ============ 场景配置解析 ============

const TERRAIN_KEYWORDS = {
  mountain: ['山', '高原', '雪山', '峡谷', '悬崖', '青藏', '昆仑', '唐古拉', '昆仑'],
  tunnel: ['隧道', '山洞', '穿越', '黑暗'],
  coast: ['海', '跨海', '海岸', '桥', '厦门', '湄洲湾', '跨海'],
  city: ['城市', '外滩', '上海', '北京', '夜景', '都市', '霓虹', '广州', '深圳'],
  plain: ['平原', '田野', '草原', '麦田', '东北', '京沪'],
}

const WEATHER_KEYWORDS = {
  snow: ['雪', '冰', '冻', '寒冷', '东北'],
  rain: ['雨', '湿润', '潮湿'],
  fog: ['雾', '朦胧', '迷雾'],
}

const TIME_KEYWORDS = {
  night: ['夜', '晚上', '星光', '月光', '霓虹', '灯光'],
  sunset: ['黄昏', '日落', '夕阳', '傍晚', '晚霞'],
}

function parseDescription(desc) {
  const config = { time: 'day', weather: 'clear', terrain: 'plain', speedLimit: 350, landmarks: [] }
  for (const [terrain, keywords] of Object.entries(TERRAIN_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) { config.terrain = terrain; break }
  }
  for (const [weather, keywords] of Object.entries(WEATHER_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) { config.weather = weather; break }
  }
  for (const [time, keywords] of Object.entries(TIME_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) { config.time = time; break }
  }
  if (config.terrain === 'mountain' || config.terrain === 'tunnel') {
    config.speedLimit = 160 + Math.floor(Math.random() * 140)
  }
  return config
}

// ============ AI 调用 ============

async function callAI(messages) {
  // 方式1：优先使用环境变量中的 HUNYUAN API
  const secretId = process.env.HUNYUAN_SECRET_ID
  const secretKey = process.env.HUNYUAN_SECRET_KEY

  if (secretId && secretKey) {
    return await callHunyuan(messages, secretId, secretKey)
  }

  // 方式2：无API key时返回模板生成
  return null
}

async function callHunyuan(messages, secretId, secretKey) {
  const https = require('https')
  const crypto = require('crypto')

  const payload = JSON.stringify({
    Model: 'hunyuan-turbo',
    Messages: messages,
    Temperature: 0.8,
    MaxTokens: 500,
  })

  // 腾讯云API签名（简化版，实际需完整签名逻辑）
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'hunyuan.tencentcloudapi.com',
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TC-Action': 'ChatCompletions',
        'X-TC-Version': '2023-09-01',
        'X-TC-Region': 'ap-guangzhou',
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const content = json.Response?.Choices?.[0]?.Message?.Content || ''
          resolve(content)
        } catch { resolve(null) }
      })
    })
    req.on('error', () => resolve(null))
    req.write(payload)
    req.end()
  })
}

// ============ 模板生成（无API时的降级方案）===========

const TEMPLATES = {
  mountain: [
    { title: '云端穿越', desc: '您正驾驶复兴号穿越连绵群山，窗外云雾缭绕，列车以300km/h的速度在山脊间穿行。', knowledge: '复兴号列车采用流线型车头设计，可有效降低高速运行时的空气阻力。' },
    { title: '高原飞驰', desc: '列车在高原之上飞驰，远处雪山在阳光下熠熠生辉，铁轨在脚下延伸至天际。', knowledge: '青藏铁路全线使用了特殊的冻土路基技术，确保在极端低温下铁路的安全运行。' },
  ],
  tunnel: [
    { title: '隧道追光', desc: '复兴号冲入黑暗隧道，车灯划破沉寂，隧道壁上的灯光飞速后退，光明就在前方。', knowledge: '高铁隧道内设有专门的气压调节系统，避免列车高速通过时产生的气压波影响乘客。' },
    { title: '暗夜疾驰', desc: '列车在连续隧道群中穿行，明暗交替间感受风驰电掣的速度，每一次出洞都是新的风景。', knowledge: '合福高铁武夷山段隧道占比超过60%，被誉为"隧道博物馆"。' },
  ],
  coast: [
    { title: '海上飞虹', desc: '复兴号飞驰在跨海大桥之上，两侧碧波万顷，海天一色间列车如箭一般向前。', knowledge: '福厦高铁是中国首条设计时速350公里的跨海高铁，桥梁占比超80%。' },
  ],
  city: [
    { title: '都市穿行', desc: '列车高速驶入城市，窗外摩天大楼飞速后退，万家灯火在夜色中闪烁。', knowledge: '上海虹桥站日均发送旅客超20万人次，是中国最繁忙的高铁站之一。' },
  ],
  plain: [
    { title: '平原飞驰', desc: '复兴号在广袤的平原上飞驰，窗外田野如画，铁轨在阳光下闪着银光。', knowledge: '京沪高铁全长1318公里，是世界上一次建成里程最长的高速铁路。' },
  ],
}

function templateGenerate(config) {
  const terrain = config.terrain || 'plain'
  const templates = TEMPLATES[terrain] || TEMPLATES.plain
  const t = templates[Math.floor(Math.random() * templates.length)]
  return { title: t.title, description: t.desc, knowledge: t.knowledge, landmarks: [] }
}

// ============ 主入口 ============

exports.main = async (event) => {
  const { description } = event
  if (!description || description.trim().length === 0) {
    return { success: false, error: '请输入场景描述' }
  }

  const config = parseDescription(description)

  // 尝试AI生成
  let aiResult = null
  try {
    const content = await callAI([
      { role: 'system', content: '你是高铁场景描述AI。用户给你一句话，返回JSON: {"title":"场景名","description":"沉浸描述50字","knowledge":"高铁知识30字","landmarks":["地标1","地标2"]}' },
      { role: 'user', content: description }
    ])
    if (content) {
      const match = content.match(/\{[\s\S]*\}/)
      if (match) aiResult = JSON.parse(match[0])
    }
  } catch (e) { console.warn('[AI] 调用失败，使用模板:', e.message) }

  // 降级：使用模板
  if (!aiResult) {
    aiResult = templateGenerate(config)
  }

  return {
    success: true,
    data: {
      title: aiResult.title,
      description: aiResult.description,
      knowledge: aiResult.knowledge,
      config,
      landmarks: aiResult.landmarks || [],
      fromAI: !!aiResult,
    }
  }
}
