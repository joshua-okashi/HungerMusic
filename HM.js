var EventCenter = {
  on: function(type,handler){
    $(document).on(type,handler)
  },
  fire: function(type,data){
    $(document).trigger(type,data)
  }
}


var Footer = {
  init: function(){
    this.$footer = $('footer')
    this.$ul = this.$footer.find('ul')
    // this.$li= this.$footer.find('li') 不能使用li，应为li是通过ajax获取，现在的li在页面时不存在的。
    this.$box = this.$footer.find('.box')
    this.$leftBtn = this.$footer.find('.icon-left')
    this.$rightBtn = this.$footer.find('.icon-right')
    this.isToEnd = false
    this.isToStart = true
    this.isAimate = false 
    
    this.bind()
    this.render()
  },
  bind: function(){
    var _this = this
    $(window).resize(function(){
      _this.setStyle()
    })
    this.$rightBtn.on('click',function(){
      if(_this.isAimate) return
      var itemWidth = _this.$box.find('li').outerWidth(true)
      var rowCount = Math.floor(_this.$box.width()/itemWidth)
      if(!_this.isToEnd){
        _this.isAimate = true
        _this.$ul.animate({
          left: '-=' +rowCount*itemWidth
       },400,function(){
         _this.isAimate = false
         _this.isToStart = false
         if(parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))){
           _this.isToEnd = true
         }
       })
      }
    })

    // 对应的ul要设置position，为absolute，这样位置才可以控制,
    // 父元素要设置好高度，absolute使元素脱离文档流。
    
    this.$leftBtn.on('click',function(){
      if(_this.isAimate) return
      var itemWidth = _this.$box.find('li').outerWidth(true)
      var rowCount = Math.floor(_this.$box.width()/itemWidth)
      if(!_this.isToStart){
        _this.isAimate = true
        _this.$ul.animate({
          left: '+=' +rowCount * itemWidth
       },400,function(){
         _this.isAimate = false
         _this.isToEnd = false
         if(parseFloat(_this.$ul.css('left')) >= 0 ){
           _this.isToStart = true
         }
       })
      }
    })

    this.$footer.on('click','li',function(){
      $(this).addClass('active')
             .siblings().removeClass('active')

    // 将作品编号发送出去。         
      EventCenter.fire('select-albumn',{
        channelId: $(this).attr('data-channel-id'),
        channelName: $(this).attr('data-channel-name')
      })
    })
  },

  render: function(){
    var _this = this
    $.getJSON('https://jirenguapi.applinzi.com/fm/getChannels.php')
     .done(function(ret){
        console.log(ret)
        _this.renderFooter(ret.channels)
      }).fail(function(){
        console.log('获取数据失败')
      }) 
  },

  renderFooter: function(channels){
    console.log(channels)
    var html = ''
    channels.forEach(function(channel){
      html += '<li data-channel-id='+channel.channel_id+' data-channel-name='+channel.name+'>'
            + '  <div class="cover" style="background-image:url('+channel.cover_small+')">'
            + '  <h3>'+channel.name+'</h3>'
            + '</li>'
    })
    this.$ul.html(html)
    this.setStyle()
  },

  setStyle: function(){
    var count = this.$footer.find('li').length
    var width = this.$footer.find('li').outerWidth(true)
    this.$footer.find(count,width)
    this.$ul.css({
      width: count * width + 'px'
    })
  }
}


var FM = {
  init: function(){
    this.$container = $('#page-music')
    this.audio = new Audio()
    this.audio.autoplay = true
    
    this.bind()
  },

  bind: function(){
    var _this = this
    // 获取音乐编号
    EventCenter.on('select-albumn',function(e,channelObj){
      console.log('select',channelObj)
      _this.channelId = channelObj.channelId
      _this.channelName = channelObj.channelName
      _this.loadMusic()
    })

    this.$container.find('.btn-play').on('click',function(){
      // 设置播放和暂停键的切换，音乐播放和暂停。
      var $btn = $(this)
      if($btn.hasClass('icon-play')){
        $btn.removeClass('icon-play').addClass('icon-pause')
        _this.audio.play()
      }else{
        $btn.removeClass('icon-pause').addClass('icon-play')
        _this.audio.pause()
      }
    })

    this.$container.find('.btn-next').on('click',function(){
      _this.loadMusic()
    })

    this.audio.addEventListener('play',function(){
      // 加锁，防止多次点击后的多次执行。
      console.log("play")
      clearInterval(_this.statusClock)
      _this.statusClock = setInterval(function(){
        _this.updataStatus()
        _this.loadLyric()
      },1000)
    })

    this.audio.addEventListener('pause',function(){
      console.log('pause')
      clearInterval(_this.statusClock)
    })

    // 进度条拖动。
    this.$container.find('.bar').on('click', function(e){
      console.log(e.offsetX)
      var per = e.offsetX / parseInt(getComputedStyle(this).width)
      _this.audio.currentTime = _this.audio.duration * per
    })
  },
  
  loadMusic(){
    var _this = this
    $.getJSON('https://jirenguapi.applinzi.com/fm/getSong.php',{channel:this.channelId}).done(function(ret){
      _this.song = ret['song'][0]
      console.log(_this.song)
      _this.setMusic()
      _this.loadLyric()
    })
  },

  loadLyric(){
    var _this = this
    $.getJSON('https://jirenguapi.applinzi.com/fm/getLyric.php',{sid:
    this.song.sid}).done(function(ret){
      console.log(ret)
      var lyric = ret.lyric
      var lyricObj = {}
      lyric.split('\n').forEach(function(line){
        var times = line.match(/\d{2}:\d{2}/g)
        var str = line.replace(/\[.+?\]/g, '')
        if(Array.isArray(times)){
          times.forEach(function(time){
            lyricObj[time] = str
          })
        }
      })
         _this.lyricObj = lyricObj
    })   
  },

  setMusic(){
    // 获取音乐地址，设置背景，标题，作者，标签。
    this.audio.src = this.song.url
    $('.page-bg').css('background-image','url('+this.song.picture+')')
    this.$container.find('.aside figure').css('background-image',
    'url('+this.song.picture+')')
    this.$container.find('.detail h1').text(this.song.title)
    this.$container.find('.detail .author').text(this.song.artist)
    this.$container.find('.tag').text(this.channelName)
    this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause')
  },

  updataStatus(){
    // 更新进度条，播放时间。
    var min = Math.floor(this.audio.currentTime/60)
    var second = Math.floor(this.audio.currentTime%60) + ''
    second = second.length ===2?second: '0'+second
    this.$container.find('.current-time').text(min+':'+second)
    this.$container.find('.bar-progress').css('width',
    this.audio.currentTime/this.audio.duration*100+'%')
    var line = this.lyricObj['0'+min+':'+second]
    if(line){
      this.$container.find('.lyric p').text(line).boomText('fadeOut')
    }
  }
}

// jQuery的歌词插件
$.fn.boomText = function(type) {
  type = type || 'fadeOutUp'
  this.html(function(){
    var arr = $(this).text()
    .split('').map(function(word){
      return '<span class= "boomText">'+word+'</span>'
    })
    return arr.join('')
  })

  var index = 0
  var $boomTexts = $(this).find('span')
  var clock = setInterval(function(){
    $boomTexts.eq(index).addClass('animated ' + type)
    index++
    if(index >= $boomTexts.length){
      clearInterval(clock)
    }
  },400)
}

Footer.init()
FM.init()