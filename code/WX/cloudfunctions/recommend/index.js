// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
//返回20个推荐电影
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const db = cloud.database({
    throwOnNotFound: false
  })
  
  let candidate_movies = []
  // 召回：热门召回
  await db.collection('hot_movies').limit(500).field({movieId: true}).get().then(res => {
    for (var i = 0; i < res.data.length; i++) {
      candidate_movies.push(res.data[i]['movieId'])
    }
  })
  console.log("hot recall :" + candidate_movies)
  // 召回：ItemCF召回
  let favor_movies = []
  await db.collection('like').doc(openid).get().then(res => {
    if (res.data != null){
      favor_movies = res.data['movies']
    }
  })
  let similar_movies = []
  const _ = db.command
  await db.collection('similar_movies').where({ movieId: _.in(favor_movies)}).field({similar_movies:true})
      .get().then(res => {
        for (var i = 0; i < res.data.length; i++) {
          similar_movies = similar_movies.concat(res.data[i]['similar_movies'].slice(0, 100))
        }
        candidate_movies = candidate_movies.concat(similar_movies)
      })
  console.log("hot and similar movies:" + candidate_movies)
  // 去重：喜欢过的和不喜欢过的都要去掉
  let dislike_movies = []
  await db.collection('dislike').doc(openid).get().then(res => {
    if (res.data !=  null){
      dislike_movies = res.data['movies']
    }
  })
  //console.log('favor_movies: ' + favor_movies)
  //console.log('dislike_movies: ' + dislike_movies)
 //console.log('candidate_movies: ' + candidate_movies)
  const recall_recommend_movies = []
  for (var i = 0; i < candidate_movies.length; i++) {
    if (favor_movies.includes(candidate_movies[i])) {
      continue;
    }
    if (dislike_movies.includes(candidate_movies[i])) {
      continue;
    }
    recall_recommend_movies.push(candidate_movies[i])
  }
  console.log("recall_recommend_movies:" + recall_recommend_movies)
  // 排序：暂时随机排序
  const rank_recommend_movies = []
  while (rank_recommend_movies.length < Math.min(recall_recommend_movies.length, 20)) {
    let i = Math.floor(Math.random() * (recall_recommend_movies.length - 1));
    if (rank_recommend_movies.indexOf(recall_recommend_movies[i]) == -1) {
      rank_recommend_movies.push(recall_recommend_movies[i])
    }
  }
  console.log("rank_recommend_movies:" + rank_recommend_movies)
  let recommend_movies = []
  await db.collection('all_movies').where({'movieId': _.in(rank_recommend_movies)}).get().then(res => {
    recommend_movies = res.data
  })
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    movieData: recommend_movies
  }
}