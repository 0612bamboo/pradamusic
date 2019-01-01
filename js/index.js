// 首先获取数据
// 生成下面的footer，点击footer的li时候，获取下一首音乐，对
// 获取下一曲的时候，会有很多全局变量，
var EventCenter = {
    on: function(type, handler){
        $(document).on(type,handler)
    
    },
    fire: function(type, data){
        $(document).trigger(type,data)
         
    }
  }
  
//   EventCenter.on('hello', function(e,value){
//     console.log(value)
//   })
  
//   EventCenter.fire('hello', '你好')

var Footer ={
    init:function(){
        this.$footer=$('footer')
        this.$ul=this.$footer.find('ul')
        this.$box=this.$footer.find('.box')
        this.$leftBtn=this.$footer.find('.icon-left')
        this.$rightBtn=this.$footer.find('.icon-right')
        this.isToEnd=false
        this.isToStart =true
        this.isAnimate=false//防止多次点击
        this.bind()
        this.render()
    },
    bind:function(){
        var _this=this
        $(window).resize(function(){
            _this.setStyle()
        })
        
        this.$rightBtn.on('click',function(){
            var itemWidth=_this.$box.find('li').outerWidth(true)
            var rowCount=Math.floor(_this.$box.width()/itemWidth)
            if(_this.isAnimate)return
            if(!_this.isToEnd){
                _this.isAnimate=true
                _this.$ul.animate({
                    left: '-='+rowCount*itemWidth   
                },400,function(){
                    _this.isAnimate=false
                    _this.isToStart=false
                    if(parseFloat(_this.$box.width())-parseFloat(_this.$ul.css('left'))>parseFloat(_this.$ul.css('width'))){
                        console.log('over')
                        _this.isToEnd=true
                    }
                })
            }        
        })
        this.$leftBtn.on('click',function(){
            var itemWidth=_this.$box.find('li').outerWidth(true)
            var rowCount=Math.floor(_this.$box.width()/itemWidth)
            if(!_this.isToStart){
                _this.isAnimate=true
                _this.$ul.animate({
                    left: '+='+rowCount*itemWidth   
                },400,function(){
                    _this.isToEnd=false
                    _this.isAnimate=false
                    if(parseFloat(_this.$ul.css('left')) >=0){
                        console.log('over')
                        _this.isToStart=true
                    }
                })
            }        
        })
        this.$footer.on('click','li',function(){
            $(this).addClass('active').siblings().removeClass('active')
            EventCenter.fire('select-albumn',{
                channelId:$(this).attr('data-channel-id'),
                channelName:$(this).attr('data-channel-name')
            })
        })
    },
    render:function(){
        var _this=this
        $.getJSON('//api.jirengu.com/fm/getChannels.php').done(function(ret){
            _this.renderFooter(ret.channels)
            console.log(ret)
        }).fail(function(){
            console.log('error')
        })

    },
    renderFooter:function(channels){
        var html =''
        channels.forEach(function(channel){
            html +='<li data-channel-id ='+channel.channel_id+' data-channel-name='+channel.name+'>'
            +'<div class="cover" style="background-image:url('+channel.cover_small+')"></div>'
            +' <h3>'+channel.name+'</h3>'
            +' </li>'
        })
        // console.log(html)
        this.$ul.html(html)
        this.setStyle()
    },
    setStyle:function(){
        var count =this.$footer.find('li').length
        //li不能提前定义，一开始是没有li的，
        console.log(count)
        var width =this.$footer.find('li').outerWidth(true)
        console.log(width)
        this.$ul.css({
            width:count*width+'px'
        })
      
    }

}

var Fm={
    init:function(){
        this.$container=$('#page-music')
        this.audio=new Audio()
        this.audio.autoplay=true
        this.bind()
    },
    bind:function(){
        var _this = this
        EventCenter.on('select-albumn', function(e, channelObj){
            _this.channelId=channelObj.channelId
            _this.channelName=channelObj.channelName
            _this.loadMusic(function(){
                _this.setMusic()
                console.log( _this.audio.src)
            })
            console.log('select', _this.channelId)
        })
        this.$container.find('.btn-play').on('click',function(){
            var $btn=$(this)
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
            clearInterval(_this.statusClock)//防止下一曲也会再生成一个定时器
            _this.statusClock =setInterval(function(){
                _this.updateStatus()
            },1000)
        })
        this.audio.addEventListener('pause',function(){
            clearInterval(_this.statusClock)
        })
    },
    loadMusic(){
        var _this = this
        console.log('loadmusic...')
        $.getJSON('https://jirenguapi.applinzi.com/fm/getSong.php',{channel: this.channelId}).done(function(ret){
            console.log(ret)
            _this.song=ret['song'][0]
            _this.setMusic()
            _this.loadLyric()    
        })
    },
    loadLyric(){
        var _this = this
        $.getJSON('https://jirenguapi.applinzi.com/fm/getLyric.php',{sid: _this.song.sid}).done(function(ret){
            // console.log(ret)
            var lyric= ret.lyric
            var lyricObj={}
            _this.lyricObj=lyricObj    
            lyric.split('\n').forEach(function(line){
                var times=line.match(/\d{2}:\d{2}/g)
                var str=line.replace(/\[.+?\]/g,'')
                console.log(times)
                console.log(Array.isArray(times))
                if(Array.isArray(times)){
                    times.forEach(function(time){
                        lyricObj[time]=str
                        console.log(_this.lyricObj[time])
                    })
                }else{
                    lyricObj[times]=str
                }
            })
        })   
    },
    setMusic(){
        console.log(this.song.src)
        this.audio.src=this.song.url
        $('.bg').css('background-image','url('+this.song.picture+')')
        this.$container.find('.aside figure').css('background-image','url('+this.song.picture+')')
        this.$container.find('.detail h1').text(this.song.title)
        this.$container.find('.detail .author').text(this.song.artist)
        this.$container.find('.tag').text(this.channelName)
    },
    updateStatus(){
        var _this=this
        var min=Math.floor(this.audio.currentTime/60)
        var second=Math.floor(this.audio.currentTime%60)+''
        second=second.length===2?second:'0'+second
        this.$container.find('.current-time').text(min+':'+second)
        this.$container.find('.bar-progress').css('width',this.audio.currentTime/this.audio.duration*100+'%')
        console.log(_this.lyricObj)
        var all='0'+min+':'+second
        console.log(all)
        var line =_this.lyricObj['0'+min+':'+second]
        if(line){
            _this.$container.find('.lyric p').text(line).boomText('zoomIn')
        }
    }
}
$.fn.boomText =function(type){
    type =type || 'rollIn'
    this.html(function(){
      var arr=$(this).text().split('').map(function(word){
        return '<span style="display:inline-block">'+word+'</span>'
      })
      return arr.join('')
    })
    var index=0
  var $boomTexts =$(this).find('span')
  var clock =setInterval(function(){
    $boomTexts.eq(index).addClass('animated ' +type)
    index++
    if(index >= $boomTexts.length){
      clearInterval(clock)
    }
  },300)
  }
  
Footer.init()
Fm.init()
