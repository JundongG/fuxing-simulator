// cloudfunctions/getRanking/index.js — 排行榜云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 获取排行榜（按最高分降序）
    const { list } = await db.collection('scores')
      .aggregate()
      .group({
        _id: '$openid',
        maxScore: $.max('$score'),
        totalMileage: $.sum('$mileage'),
        totalGames: $.sum(1),
        bestSpeed: $.max('$maxSpeed'),
      })
      .sort({ maxScore: -1 })
      .limit(50)
      .end()

    // 获取当前用户排名
    const myScores = list.find(item => item._id === wxContext.OPENID)

    return {
      success: true,
      data: {
        ranking: list.map((item, index) => ({
          rank: index + 1,
          openid: item._id.slice(0, 6) + '***',
          score: item.maxScore,
          mileage: item.totalMileage.toFixed(1),
          games: item.totalGames,
          isMe: item._id === wxContext.OPENID,
        })),
        myBest: myScores ? {
          score: myScores.maxScore,
          mileage: myScores.totalMileage.toFixed(1),
          games: myScores.totalGames,
        } : null,
      }
    }
  } catch (err) {
    console.error('[getRanking]', err)
    return { success: false, error: err.message }
  }
}
