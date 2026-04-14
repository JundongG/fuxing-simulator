// cloudfunctions/saveScore/index.js — 保存成绩云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  const {
    mileage,
    maxSpeed,
    score,
    crossings,
    eventsPassed,
    eventsTotal,
    duration,
    sceneTitle,
  } = event

  try {
    const result = await db.collection('scores').add({
      data: {
        openid: OPENID,
        mileage: parseFloat(mileage),
        maxSpeed: parseInt(maxSpeed),
        score: parseInt(score),
        crossings: parseInt(crossings),
        eventsPassed: parseInt(eventsPassed),
        eventsTotal: parseInt(eventsTotal),
        duration: parseInt(duration),
        sceneTitle: sceneTitle || '自由驾驶',
        createdAt: db.serverDate(),
      }
    })

    return { success: true, id: result._id }
  } catch (err) {
    console.error('[saveScore]', err)
    return { success: false, error: err.message }
  }
}
