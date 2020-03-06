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
    console.log(res.data)
    if (res.data == null) {
      movies = [event.movieId]
    } else {
      if (res.data['movies'].length >= 20) {
        movies = res.data['movies'].slice(1)
        movies.push(event.movieId)
      }
      else {
        movies = res.data['movies']
        movies.push(event.movieId)
      }
    }
  })
  if (movies.length == 1) {
    await db.collection('like').add({
      data: {
        _id: wxContext.OPENID,
        movies: movies
      }
    })
  } else {
    await db.collection('like').doc(wxContext.OPENID).update({
      data: {
        movies: movies
      }
    })
  }
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}