// cloudfunctions/aiGenerate/index.js — AI场景生成云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 场景配置映射（根据关键词匹配预制素材）
const TERRAIN_KEYWORDS = {
  mountain: ['山', '高原', '雪山', '峡谷', '悬崖', '青藏', '昆仑', '唐古拉'],
  tunnel: ['隧道', '山洞', '穿越', '黑暗'],
  coast: ['海', '跨海', '海岸', '桥', '厦门', '湄洲湾'],
  city: ['城市', '外滩', '上海', '北京', '夜景', '都市', '霓虹'],
  plain: ['平原', '田野', '草原', '麦田', '东北'],
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

// 根据用户描述生成场景配置
function parseDescription(desc) {
  const config = {
    time: 'day',
    weather: 'clear',
    terrain: 'plain',
    speedLimit: 350,
    landmarks: [],
  }

  // 解析地形
  for (const [terrain, keywords] of Object.entries(TERRAIN_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) {
      config.terrain = terrain
      break
    }
  }

  // 解析天气
  for (const [weather, keywords] of Object.entries(WEATHER_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) {
      config.weather = weather
      break
    }
  }

  // 解析时段
  for (const [time, keywords] of Object.entries(TIME_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) {
      config.time = time
      break
    }
  }

  // 根据地形设限速
  if (config.terrain === 'mountain' || config.terrain === 'tunnel') {
    config.speedLimit = 160 + Math.floor(Math.random() * 140)
  }

  return config
}

// 调用混元AI生成文字描述
async function generateWithAI(description) {
  try {
    const response = await cloud.callAI({
      model: 'hunyuan-turbo',
      messages: [
        {
          role: 'system',
          content: `你是一个高铁场景描述AI。用户会给你一句话描述他们想开的高铁旅程。
请生成以下JSON格式的响应（只返回JSON，不要其他内容）：
{
  "title": "场景名称（简短有吸引力）",
  "description": "沉浸式场景描述（50-80字，第二人称，如"您正驾驶..."）",
  "knowledge": "一条与该线路/车型相关的高铁冷知识（30字以内）",
  "landmarks": ["途经的重要地标，2-4个"]
}`
        },
        {
          role: 'user',
          content: description
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
    })

    const content = response.choices[0].message.content
    // 尝试解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('AI返回格式异常')
  } catch (err) {
    console.error('[AI生成失败]', err)
    return null
  }
}

// 云函数入口
exports.main = async (event, context) => {
  const { description } = event

  if (!description || description.trim().length === 0) {
    return { success: false, error: '请输入场景描述' }
  }

  // 1. 解析用户输入的配置
  const config = parseDescription(description)

  // 2. 调用AI生成文字内容
  const aiResult = await generateWithAI(description)

  // 3. 组合结果
  const sceneData = {
    title: aiResult?.title || `${description.slice(0, 10)}之旅`,
    description: aiResult?.description || `您正驾驶复兴号穿越未知领域，窗外风景如画，速度与激情并存。`,
    knowledge: aiResult?.knowledge || '复兴号CR400列车最高运营时速350公里，是我国自主研发的高速动车组。',
    config,
    landmarks: aiResult?.landmarks || [],
    fromAI: true,
  }

  return { success: true, data: sceneData }
}
