let touch = {
  //拖拽数据
  startPoint: null,
  translateX: null,
  translateY: null,
  timeStampStart: null,
  timeStampEnd: null
};
const app = getApp()
Page({
  data: {
    isHider: false,
    isLoadingEnd: false,
    slideTimes: 0,
    userInfo: {},
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    touchDot: 0, //触摸时的原点
    coord: {
      x: 0,
      y: 0
    },
    curShowIdx: 0,
    movieData:[]
  },
  onLoad: function (option) {
    wx.showLoading({
      title: '加载中...',
    })
    this.loadRecommendData()
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              self.setData({
                userInfo: res.userInfo
              })
            }
          })
        } else {
          // 用户没有授权
          // 改变 isHide 的值，显示授权页面
          //self.setData({
          //  isHide: true
          //});
        }
      }
    })
  },
  loadRecommendData: function () {
    wx.cloud.callFunction({
      name: 'recommend',
      data: {},
      complete: res => {
        console.log(res)
        for (var j = 0, len = res.result.movieData.length; j < len; j++)         {
          res.result.movieData[j].zIndex = len - j;
          if (j < 2) {
            res.result.movieData[j].isRender = 1
          } else {
            res.result.movieData[j].isRender = 0
          }
          res.result.movieData[j].animationData = 0
        }
        var isLoadingEnd = false;
        if (res.result.movieData.length == 0) {
          isLoadingEnd = true;
        }
        this.downloadPicture(res.result.movieData)
      }
    })
  },
  downloadPicture: function (movieData) {
    let fileList = []
    for (var i = 0; i < movieData.length; i++) {
      let picUrl = movieData[i].picUrl
      //console.log("origin picUrl:" + movieData[i].picUrl)
      let filename = picUrl.split('/').pop()
      let fileid = 'cloud://favor-movies-nj6pp.6661-favor-movies-nj6pp-1300680160/pictures/' + filename;
      fileList.push(fileid)
    }
    let self = this
    wx.cloud.getTempFileURL({
      fileList: fileList,
      success: res => {
        for (var i = 0; i < movieData.length; i++) {
          if (res.fileList[i].status == 0) {
            movieData[i].picUrl = res.fileList[i].tempFileURL
          }
        }
        self.setDataAndHideLoading(movieData)
      },
      fail: err => {
        // handle error
        console.log('download error')
        console.log(err)
        self.setDataAndHideLoading(movieData)
      }
    })
  },
  setDataAndHideLoading: function (movieData) {
    this.setData({
      movieData: movieData,
      curShowIdx: 0,
      slideTimes: 0,
      isLoadingEnd: false
    })
    wx.hideLoading()
  },
  touchStart: function (e) {
    touch.startPoint = e.touches[0];
    let timeStampStart = new Date().getTime();
    this.animation = wx.createAnimation({
      duration: 70,
      timingFunction: 'ease',
      delay: 0
    })
    this.touch = {
      timeStampStart
    }

  },
  //触摸移动事件
  touchMove: function (e) {
    let movieData, rotate;
    let currentPoint = e.touches[e.touches.length - 1];
    let translateX = currentPoint.clientX - touch.startPoint.clientX;
    let translateY = currentPoint.clientY - touch.startPoint.clientY;
    if (translateX < 0) {
      if (translateX > -10) {
        rotate = -1;
      } else {
        rotate = -4;
      }
    }
    if (translateX > 0) {
      if (translateX < 10) {
        rotate = 1;
      } else {
        rotate = 4;
      }
    }
    this.animation.rotate(rotate).translate(translateX, 10).step();
    let id = this.data.curShowIdx;
    movieData = this.data.movieData;
    
    movieData[id].animationData = this.animation.export();
    this.setData({
      movieData
    }) //4nvzqm

  },
  // 触摸结束事件
  touchEnd: function (e) {
    // return;
    let movieData;
    let translateX = e.changedTouches[0].clientX - touch.startPoint.clientX;
    let translateY = e.changedTouches[0].clientY - touch.startPoint.clientY;
    let timeStampEnd = new Date().getTime();
    let time = timeStampEnd - this.touch.timeStampStart;
    let id = this.data.curShowIdx;
    let animation = wx.createAnimation({
      duration: 250,
      timingFunction: 'ease',
      delay: 0
    })
    if (time < 150) {
      //快速滑动
      if (translateX > 40) {
        //右划
        this.markAsRead('right');
        animation.rotate(0).translate(this.data.windowWidth, 0).step();
        movieData = this.data.movieData;
        movieData[id].animationData = animation.export();
        this.setData({
          movieData
        })
      } else if (translateX < -40) {
        //左划
        this.markAsRead('left');
        animation.rotate(0).translate(-this.data.windowWidth, 0).step();
        movieData = this.data.movieData;
        movieData[id].animationData = animation.export();
        this.setData({
          movieData
        })
      } else {
        //返回原位置
        animation.rotate(0).translate(0, 0).step();
        movieData = this.data.movieData;
        movieData[this.data.curShowIdx].animationData = animation.export();
        this.setData({
          movieData,
        })
      }
    } else {
      if (translateX > 160) {
        //右划
        this.markAsRead('right');
        animation.rotate(0).translate(this.data.windowWidth, 0).step();
        movieData = this.data.movieData;
        movieData[id].animationData = animation.export();
        this.setData({
          movieData
        })
      } else if (translateX < -160) {
        //左划
        this.markAsRead('left');
        animation.rotate(0).translate(-this.data.windowWidth, 0).step();
        movieData = this.data.movieData;
        movieData[id].animationData = animation.export();
        this.setData({
          movieData
        })
      } else {
        //返回原位置
        animation.rotate(0).translate(0, 0).step();
        movieData = this.data.movieData;
        movieData[this.data.curShowIdx].animationData = animation.export();
        this.setData({
          movieData,
        })
      }
    }
  },

  onLike: function () {
    this.clickAnimation({
      direction: 'right'
    });
    this.markAsRead('right')
  },
  onUnlike: function () {
    this.clickAnimation({
      direction: 'left'
    })
    this.markAsRead('left');
  },

  markAsRead: function (param) {
    let id = this.data.curShowIdx;
    let movieData = this.data.movieData;
    if (id < movieData.length - 2) {
      movieData[id + 2].isRender = 1
    }
    let slideTimes = this.data.slideTimes;
    slideTimes++;
    // 保存到后端
    this.recordHistory(param)
    let nextId = this.data.curShowIdx + 1;
    this.setData({
      curShowIdx: nextId,
      slideTimes
    })
    this.deleteItem(id)
    if (slideTimes == this.data.movieData.length) {
      console.log('slide finished!')
      this.setData({
        isLoadingEnd: true
      })
      wx.showLoading({
        title: '加载中...',
      })
      this.loadRecommendData()
    }
  },
  recordHistory: function(param) {
    let func_name = 'like'
    if (param == 'left') {
      func_name = 'dislike'
    } else {
      func_name = 'like'
    }
    wx.cloud.callFunction({
      name: func_name,
      data: {
        movieId: this.data.movieData[this.data.curShowIdx].movieId
      },
      complete: res => {
        //console.log(res)
      }
    })
  },
  clickAnimation: function (params) {
    let x, y, duration, rotate, movieData;
    duration = 700;
    y = 100;
    if (params.direction === 'left') {
      rotate = -10;
      x = -this.data.windowWidth - 100;
    } else {
      rotate = 10;
      x = this.data.windowWidth + 100;
    }

    this.animation = wx.createAnimation({
      duration,
      timingFunction: 'ease',
      delay: 0
    })
    let id = this.data.curShowIdx;
    this.animation.rotate(rotate).translate(x, y).step();
    movieData = this.data.movieData;
    movieData[id].animationData = this.animation.export();
    this.setData({
      movieData
    })
  },
  deleteItem: function (id) {
    let movieData = this.data.movieData;
    for (let i = 0; i <= id; i++) {
      movieData[i].isRender = false;
    }
    this.setData({
      movieData
    })
  },
  toUserList: function () {
    try {
      wx.navigateTo({
        url: '/pages/like/like'
      });
    } catch (e) {
      console.log(e);
    } finally {

    }
  },
  bindGetUserInfo: function (e) {
    if (e.detail.userInfo) {
      //用户按了允许授权按钮
      var that = this;
      // 获取到用户的信息了，打印到控制台上看下
      console.log("用户的信息如下：");
      console.log(e.detail.userInfo);
      this.setData({
        userInfo: e.detail.userInfo
      })
      //授权成功后,通过改变 isHide 的值，让实现页面显示出来，把授权页面隐藏起来
      that.setData({
        isHide: false
      });
    } else {
      //用户按了拒绝按钮
      wx.showModal({
        title: '警告',
        content: '您点击了拒绝授权，将无法进入小程序，请授权之后再进入!!!',
        showCancel: false,
        confirmText: '返回授权',
        success: function (res) {
          // 用户没有授权成功，不需要改变 isHide 的值
          if (res.confirm) {
            console.log('用户点击了“返回授权”');
          }
        }
      });
    }
  },
  onShareAppMessage: function () {
    return {
      title: '电影心愿单',
      path: '/pages/index/index',
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
        console.log(res)
      }
    }
  }
})
