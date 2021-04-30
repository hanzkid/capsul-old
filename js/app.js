const noise = () => {
    let canvas, ctx;
  
    let wWidth, wHeight;
  
    let noiseData = [];
    let frame = 0;
  
    let loopTimeout;
  
  
    // Create Noise
    const createNoise = () => {
        const idata = ctx.createImageData(wWidth, wHeight);
        const buffer32 = new Uint32Array(idata.data.buffer);
        const len = buffer32.length;
  
        for (let i = 0; i < len; i++) {
            if (Math.random() < 0.5) {
                buffer32[i] = 0xffffffff;
            }
        }
  
        noiseData.push(idata);
    };
  
  
    // Play Noise
    const paintNoise = () => {
        if (frame === 9) {
            frame = 0;
        } else {
            frame++;
        }
  
        ctx.putImageData(noiseData[frame], 0, 0);
    };
  
  
    // Loop
    const loop = () => {
        paintNoise(frame);
  
        loopTimeout = window.setTimeout(() => {
            window.requestAnimationFrame(loop);
        }, (1000 / 25));
    };
  
  
    // Setup
    const setup = () => {
        wWidth = window.innerWidth;
        wHeight = window.innerHeight;
  
        canvas.width = wWidth;
        canvas.height = wHeight;
  
        for (let i = 0; i < 10; i++) {
            createNoise();
        }
  
        loop();
    };
  
  
    // Reset
    let resizeThrottle;
    const reset = () => {
        window.addEventListener('resize', () => {
            window.clearTimeout(resizeThrottle);
  
            resizeThrottle = window.setTimeout(() => {
                window.clearTimeout(loopTimeout);
                setup();
            }, 200);
        }, false);
    };
  
  
    // Init
    const init = (() => {
        canvas = document.getElementById('noise');
        ctx = canvas.getContext('2d');
  
        setup();
    })();
  };
  
  noise();



//Motion Hover Header Pop Up

{
  // body element
  const body = document.getElementsByClassName("motion");

  // helper functions
  const MathUtils = {
      // linear interpolation
      lerp: (a, b, n) => (1 - n) * a + n * b,
      // distance between two points
      distance: (x1,y1,x2,y2) => Math.hypot(x2-x1, y2-y1)
  }

  // get the mouse position
  const getMousePos = (ev) => {
      let posx = 0;
      let posy = 0;
      if (!ev) ev = window.event;
      if (ev.pageX || ev.pageY) {
          posx = ev.pageX;
          posy = ev.pageY;
      }
      else if (ev.clientX || ev.clientY) 	{
          posx = ev.clientX + body.scrollLeft + docEl.scrollLeft;
          posy = ev.clientY + body.scrollTop + docEl.scrollTop;
      }
      return {x: posx, y: posy};
  }

  // mousePos: current mouse position
  // cacheMousePos: previous mouse position
  // lastMousePos: last last recorded mouse position (at the time the last image was shown)
  let mousePos = lastMousePos = cacheMousePos = {x: 0, y: 0};
  
  // update the mouse position
  window.addEventListener('mousemove', ev => mousePos = getMousePos(ev));
  
  // gets the distance from the current mouse position to the last recorded mouse position
  const getMouseDistance = () => MathUtils.distance(mousePos.x,mousePos.y,lastMousePos.x,lastMousePos.y);

  class Image {
      constructor(el) {
          this.DOM = {el: el};
          // image deafult styles
          this.defaultStyle = {
              scale: 1,
              x: 0,
              y: 0,
              opacity: 0
          };
          // get sizes/position
          this.getRect();
          // init/bind events
          this.initEvents();
      }
      initEvents() {
          // on resize get updated sizes/position
          window.addEventListener('resize', () => this.resize());
      }
      resize() {
          // reset styles
          TweenMax.set(this.DOM.el, this.defaultStyle);
          // get sizes/position
          this.getRect();
      }
      getRect() {
          this.rect = this.DOM.el.getBoundingClientRect();
      }
      isActive() {
          // check if image is animating or if it's visible
          return TweenMax.isTweening(this.DOM.el) || this.DOM.el.style.opacity != 0;
      }
  }

  class ImageTrail {
      constructor() {
          // images container
          this.DOM = {content: document.querySelector('.motion')};
          // array of Image objs, one per image element
          this.images = [];
          [...this.DOM.content.querySelectorAll('.content__img')].forEach(img => this.images.push(new Image(img)));
          // total number of images
          this.imagesTotal = this.images.length;
          // upcoming image index
          this.imgPosition = 0;
          // zIndex value to apply to the upcoming image
          this.zIndexVal = 1;
          // mouse distance required to show the next image
          this.threshold = 100;
          // render the images
          requestAnimationFrame(() => this.render());
      }
      render() {
          // get distance between the current mouse position and the position of the previous image
          let distance = getMouseDistance();
          // cache previous mouse position
          cacheMousePos.x = MathUtils.lerp(cacheMousePos.x || mousePos.x, mousePos.x, 0.1);
          cacheMousePos.y = MathUtils.lerp(cacheMousePos.y || mousePos.y, mousePos.y, 0.1);

          // if the mouse moved more than [this.threshold] then show the next image
          if ( distance > this.threshold ) {
              this.showNextImage();

              ++this.zIndexVal;
              this.imgPosition = this.imgPosition < this.imagesTotal-1 ? this.imgPosition+1 : 0;
              
              lastMousePos = mousePos;
          }

          // check when mousemove stops and all images are inactive (not visible and not animating)
          let isIdle = true;
          for (let img of this.images) {
              if ( img.isActive() ) {
                  isIdle = false;
                  break;
              }
          }
          // reset z-index initial value
          if ( isIdle && this.zIndexVal !== 1 ) {
              this.zIndexVal = 1;
          }

          // loop..
          requestAnimationFrame(() => this.render());
      }
      showNextImage() {
          // show image at position [this.imgPosition]
          const img = this.images[this.imgPosition];
          // kill any tween on the image
          TweenMax.killTweensOf(img.DOM.el);

          new TimelineMax()
          // show the image
          .set(img.DOM.el, {
              startAt: {opacity: 0, scale: 1},
              opacity: 1,
              scale: 1,
              zIndex: this.zIndexVal,
              x: cacheMousePos.x - img.rect.width/2,
              y: cacheMousePos.y - img.rect.height/2
          }, 0)
          // animate position
          .to(img.DOM.el, 0.9, {
              ease: Expo.easeOut,
              x: mousePos.x - img.rect.width/2,
              y: mousePos.y - img.rect.height/2
          }, 0)
          // then make it disappear
          .to(img.DOM.el, 1, {
              ease: Power1.easeOut,
              opacity: 0
          }, 0.4)
          // scale down the image
          .to(img.DOM.el, 1, {
              ease: Quint.easeOut,
              scale: 0.2
          }, 0.4);
      }
  }

  /***********************************/
  /********** Preload stuff **********/

  // Preload images
  const preloadImages = () => {
      return new Promise((resolve, reject) => {
          imagesLoaded(document.querySelectorAll('.content__img'), resolve);
      });
  };
  
  // And then..
  preloadImages().then(() => {
      // Remove the loader
      document.body.classList.remove('loading');
      new ImageTrail();
  });
}






/*
  $('.orange-theme').click(function() {
      $(this).addClass('white-theme background-white');
      $('.orange-theme').removeClass('orange-theme background-orange');

      $('body').addClass('background-orange');
      $('.quotes').addClass('text-black');
      $('.p, .name, .price, .see, .footer-link a, .copyright, .join').addClass('text-black');
      $('.marquee-container').addClass('background-black');
      $('.marquee-scrolling').addClass('text-white')
  })
*/


let switches = document.getElementsByClassName('theme');
let style = localStorage.getItem('style');

if (style == null) {
  setTheme('black');
} else {
  setTheme(style);
}

for (let i of switches) {
  i.addEventListener('click', function () {
    let theme = this.dataset.theme;
    setTheme(theme);
  });
}

function setTheme(theme) {
  if (theme == 'black') {
    document.getElementById('switcher-id').href = './themes/black.css';
    $('.background-black').css("display", "none");
    $('.background-orange').css("display", "inline-block");
  } else if (theme == 'orange') {
    document.getElementById('switcher-id').href = './themes/orange.css';
    $('.background-orange').css("display", "none");
    $('.background-white').css("display", "inline-block");
  } else if (theme == 'white') {
    document.getElementById('switcher-id').href = './themes/white.css';
    $('.background-white').css("display", "none");
    $('.background-yellow').css("display", "inline-block");
  } else if (theme == 'yellow') {
    document.getElementById('switcher-id').href = './themes/yellow.css';
    $('.background-yellow').css("display", "none");
    $('.background-black').css("display", "inline-block");
  }
  localStorage.setItem('style', theme);
}

/*
$('.background-orange').click(function() {
  $(this).removeClass('theme-enabled');
  $('.background-white').addClass('theme-enabled');
})
$('.background-white').click(function() {
  $(this).removeClass('theme-enabled');
  $('.background-yellow').addClass('theme-enabled');
})
$('.background-yellow').click(function() {
  $(this).removeClass('theme-enabled');
  $('.background-black').addClass('theme-enabled');
})
$('.background-black').click(function() {
  $(this).removeClass('theme-enabled');
  $('.background-orange').addClass('theme-enabled');
})*/

$('.with-model').mouseover(function(){
  $(this).css('opacity', '0')
})
$('.with-model').mouseout(function(){
  $(this).css('opacity', '1')
})


$('#nav').click(function(){
    $('.overlay-navigation').addClass('navigation-show')
});
$('.close').click(function(){
    $('.overlay-navigation').removeClass('navigation-show')
});


(function() {
 
    window.inputNumber = function(el) {
  
      var min = el.attr('min') || false;
      var max = el.attr('max') || false;
  
      var els = {};
  
      els.dec = el.prev();
      els.inc = el.next();
  
      el.each(function() {
        init($(this));
      });
  
      function init(el) {
  
        els.dec.on('click', decrement);
        els.inc.on('click', increment);
  
        function decrement() {
          var value = el[0].value;
          value--;
          if(!min || value >= min) {
            el[0].value = value;
          }
        }
  
        function increment() {
          var value = el[0].value;
          value++;
          if(!max || value <= max) {
            el[0].value = value++;
          }
        }
      }
    }
  })();
  
  inputNumber($('.input-number'));


$("#cart").click(function(){
    $(".cart").css("right","0px");
})
$(".close-cart").click(function(){
    $(".cart").css("right","-441px");
})


const math = {
	lerp: (a, b, n) => {
		return (1 - n) * a + n * b
	},
	norm: (value, min, max) => {
	  	return (value - min) / (max - min)
	}
}

const config = {
  height: window.innerHeight,
  width: window.innerWidth
}

class Smooth {
  constructor() {
    this.bindMethods()

    this.data = {
      ease: 0.1,
      current: 0,
      last: 0,
      rounded: 0
    }

    this.dom = {
      el: document.querySelector('[data-scroll]'),
      content: document.querySelector('[data-scroll-content]')
    }

    this.rAF = null

    this.init()
  }

  bindMethods() {
    ['scroll', 'run', 'resize']
    .forEach((fn) => this[fn] = this[fn].bind(this))
  }

  setStyles() {
    Object.assign(this.dom.el.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      overflow: 'hidden'        
    })   
  }

  setHeight() {
    document.body.style.height = `${this.dom.content.getBoundingClientRect().height}px`
  }

  resize() {
    this.setHeight()
    this.scroll()
  }

  preload() {
    imagesLoaded(this.dom.content, (instance) => {
      this.setHeight()
    })
  }

  scroll() {
    this.data.current = window.scrollY
  }

  run() {
    this.data.last += (this.data.current - this.data.last) * this.data.ease
    this.data.rounded = Math.round(this.data.last * 100) / 100
    
    const diff = this.data.current - this.data.rounded
    const acc = diff / config.width
    const velo =+ acc
    const skew = velo * 7.5
    
    this.dom.content.style.transform = `translate3d(0, -${this.data.rounded}px, 0) skewY(${skew}deg)`

    this.requestAnimationFrame()
  }

  on() { 
    this.setStyles()
    this.setHeight()
    this.addEvents()

    this.requestAnimationFrame()
  }

  off() {
    this.cancelAnimationFrame()

    this.removeEvents()
  }

  requestAnimationFrame() {
    this.rAF = requestAnimationFrame(this.run)
  }

  cancelAnimationFrame() {
    cancelAnimationFrame(this.rAF)
  }

  destroy() {
    document.body.style.height = ''

    this.data = null

    this.removeEvents()
    this.cancelAnimationFrame()
  }

  resize() {
    this.setHeight()
    this.data.rounded = this.data.last = this.data.current
  }

  addEvents() {
    window.addEventListener('resize', this.resize, { passive: true })
    window.addEventListener('scroll', this.scroll, { passive: true })
  }

  removeEvents() {
    window.removeEventListener('resize', this.resize, { passive: true })
    window.removeEventListener('scroll', this.scroll, { passive: true })
  }

  init() {
    this.preload()
    this.on()
  }
}

new Smooth()


// Smooth Scroll Anchor Links

$('a[href*="#"]')
  // Remove links that don't actually link to anything
  .not('[href="#"]')
  .not('[href="#0"]')
  .click(function(event) {
    // On-page links
    if (
      location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') 
      && 
      location.hostname == this.hostname
    ) {
      // Figure out element to scroll to
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      // Does a scroll target exist?
      if (target.length) {
        // Only prevent default if animation is actually gonna happen
        event.preventDefault();
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 1000, function() {
        });
      }
    }
  });


$(window).scroll(function(){
  var wScroll = $(this).scrollTop();
  
  if(wScroll > $('.backtotop').offset().top - ($(window).height() / 1)) {
    $('.backtotop svg').each(function(){
        $('.backtotop svg').addClass('up-fade-in');
    });
  }
  else {
    $('.backtotop svg').removeClass('up-fade-in');
  }

})

$(window).scroll(function(){
  var wScroll = $(this).scrollTop();
  
  if(wScroll > $('h1').offset().top - ($(window).height() / 1)) {
    $('h1').each(function(){
        $(this).addClass('up-fade-in');
    });
  }
  else {
    $(this).each(function(){
        $(this).removeClass('up-fade-in');
    });
  }
  
  if(wScroll > $('.footer-link').offset().top - ($(window).height() / 1)) {
    $('.footer-link a').each(function(i){
                  
      setTimeout(function(){
          
          $('.footer-link a').eq(i).addClass('up-fade-in');
      
      },150 * (i+1));
      
    });
  }
  else {
    $('.footer-link a').removeClass('up-fade-in');
  }
});

$(window).scroll(function(){
  var wScroll = $(this).scrollTop();
  
  if(wScroll > $('.socmed').offset().top - ($(window).height() / 1)) {
    $('.socmed-icon').each(function(i){
                  
      setTimeout(function(){
          
          $('.socmed-icon').eq(i).addClass('up-fade-in');
      
      },150 * (i+1));
      
    });
  }
  else {
    $('.socmed-icon').removeClass('up-fade-in');
  }
});
