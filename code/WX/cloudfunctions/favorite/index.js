// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database({
    throwOnNotFound: false
  })
  let movies = []
  await db.collection('like').doc(wxContext.OPENID).get().then(res => {
    if (res.data != null) {
      movies = res.data['movies']
    }
  })
  const _ = db.command
  let movieData = []
  await db.collection('all_movies').where({ 'movieId': _.in(movies) }).get().then(res => {
    movieData = res.data
  })
  return {
    event,
    movieData: movieData,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}