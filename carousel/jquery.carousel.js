;(function ($) {

    var defaults = {
        items: 3,           //Количество элементов, которые видно на экране
        slideMargin: 10,    //Размер свободного пространства между элементами (в пикселях)
        speed: 400,         //Скорость анимации перехода (в миллисекундах)
        loop: false,        //Зацикливание прокрутки

        gallery: false,     //Включение режима галереи
        thumbItems: 7,      //Количество элементов, которые видно на экране в режиме галереи
        thumbMargin: 5,     //Размер свободного пространства между элементами в режиме галереи (в пикселях)
    };

    $.fn.carousel = function (options) {
        var settings = $.extend(true, {}, defaults, options),
            $targetElement      = this,
            $children           = $targetElement.children(),
            $slide              = null,
            length              = 0,
            carouselWidth       = 0,
            targetElementWidth  = 0,
            scene               = 0,
            slideValue          = 0,
            pagerWidth          = 0,
            slideWidth          = 0,
            thumbWidth          = 0;

        var calculateHelper = {};

        calculateHelper.getSlideWidth = function () {
            return (targetElementWidth - (settings.items * (settings.slideMargin - 1))) / settings.items;
        };

        calculateHelper.getWidth = function (withClones) {
            var len = withClones === true 
                ? $slide.find('.jqSlide').length 
                : $children.length;

            return len * (slideWidth + settings.slideMargin);
        };

        calculateHelper.getThumbWidth = function() {
            return (targetElementWidth - ((settings.thumbItems * (settings.thumbMargin)) - settings.thumbMargin)) / settings.thumbItems;
        };

        calculateHelper.getSlideValue = function() {
            return scene * ((slideWidth + settings.slideMargin));
        };

        var plugin = {};

        plugin.drawControls = function () {
            if (length <= settings.items) {
                return;
            }

            $targetElement
                .after('<div class="carouselAction"><a class="actionPrev"></a><a class="actionNext"></a></div>');

            $slide.find('.carouselAction a.actionPrev').on('click', function () {
                $targetElement.goToPreviousSlide();
            });

            $slide.find('.carouselAction a.actionNext').on('click', function () {
                $targetElement.goToNextSlide();
            });
        };

        plugin.checkControls = function() {
            if (settings.loop) { 
                return;
            }

            $prev = $slide.find('.carouselAction a.actionPrev');
            $next = $slide.find('.carouselAction a.actionNext');
            
            if(scene == 0) {
                $prev.addClass('disabled');
            } else {
                $prev.removeClass('disabled');
            }

            if (scene < length - 1) { 
                $next.removeClass('disabled');
            } else {
                $next.addClass('disabled');
            }
        };

        plugin.init = function () {
            $targetElement.addClass('jqCarousel')
                .wrap('<div class="jqCarouselOuter"><div class="jqCarouselWrapper"></div></div>');
            $children.addClass('jqSlide');

            if(settings.gallery) {
                settings.items = 1;
                $targetElement.addClass('jqGallery')
            }

            $slide = $targetElement.parent('.jqCarouselWrapper');
            targetElementWidth = $targetElement.outerWidth();
            slideWidth = calculateHelper.getSlideWidth();

            if (settings.loop && calculateHelper.getWidth(true) > targetElementWidth) {
                var itemCount = settings.items;

                for (var n = $targetElement.find('.clone.right').length; n < itemCount; n++) {
                    $targetElement.find('.jqSlide').eq(n).clone()
                        .removeClass('jqSlide')
                        .addClass('clone right')
                        .appendTo($targetElement);

                    scene++;
                }
                for (var m = $targetElement.find('.jqSlide').length - $targetElement.find('.clone.left').length; m > ($targetElement.find('.jqSlide').length - itemCount); m--) {
                    $targetElement.find('.jqSlide').eq(m - 1).clone()
                        .removeClass('jqSlide')
                        .addClass('clone left')
                        .prependTo($targetElement);
                }

                $children = $targetElement.children();
            }

            length = $children.length;

            $children.css({
                'width': slideWidth + 'px',
                'margin-right': settings.slideMargin + 'px'
            });

            carouselWidth = calculateHelper.getWidth(false);
            $targetElement.css('width', carouselWidth + 'px');

            if (settings.loop) {
                scene = $targetElement.find('.clone.left').length;
                slideValue = calculateHelper.getSlideValue();
                this.move($targetElement, slideValue);
                $children.eq(scene).addClass('active');
            } else {
                $children.first().addClass('active');
            }

            if(!settings.gallery) {
                $children.on('click', function() {
                    scene = settings.loop
                        ? scene + ($targetElement.find('li:not(.clone)').index(this) - $targetElement.find('li.active').index()) + 1 
                        : $targetElement.find('li').index(this);

                    plugin.goToSlide(scene);
                });
            }

            this.setHeight($targetElement);
        };

        plugin.drawGalleryPager = function () {
            if (settings.gallery) {
                $slide.after('<ul class="jqPager jqGallery"></ul>');
                $slide.parent().find('.jqPager').css('margin-top', '5px');

                thumbWidth = calculateHelper.getThumbWidth();
                var $children = $slide.find('.jqSlide');
                var length = $slide.find('.jqSlide').length;

                var pagers = '';
                for (var i = 0; i < length; i++) {
                    var thumbSrc = $children.eq(i).find('img').attr('src');
                    if (settings.gallery === true) {
                        pagers += '<li style="width:' + thumbWidth + 'px;margin-right:' + settings.thumbMargin + 'px"><a href="#"><img src="' + thumbSrc + '" /></a></li>';
                    }
                }

                var $outer = $slide.parent();
                $outer.find('.jqPager').html(pagers);

                pagerWidth = (length * (settings.thumbMargin + thumbWidth));
                $outer.find('.jqPager').css({
                    'width': pagerWidth + 'px',
                    'transition-duration': settings.speed + 'ms'
                });

                $outer.find('.jqPager').css('width', pagerWidth + 'px');
                
                var $pager = $outer.find('.jqPager').find('li');
                var $this = this;
                $pager.first().addClass('active');

                $pager.on('click', function () {
                    scene = settings.loop 
                        ? scene + ($pager.index(this) - $outer.find('.jqPager').find('li.active').index()) 
                        : $pager.index(this);
   
                    plugin.moveSlide();
                    $this.moveThumb();

                    return false;
                });
            }
        };

        plugin.setActive = function (target, isThumb) {
            var sceneId = 0;

            target.removeClass('active');
            if (scene < length) {
                sceneId = scene;

                if (settings.loop) {
                    sceneId = (isThumb === true) ? scene - $targetElement.find('.clone.left').length : scene;

                    if (isThumb === true) {
                        if (sceneId + 1 > target.length) {
                            sceneId = 0;
                        }
                    }
                }

                target.eq(sceneId).addClass('active');
            } else {
                target.eq(target.length - 1).addClass('active');
            }
        };

        plugin.goToSlide = function (sceneId) {
            scene = (settings.loop) 
                ? (sceneId + $targetElement.find('.clone.left').length - 1)
                : sceneId;

            this.moveSlide();
            if (settings.gallery) {
                plugin.slideThumb();
            }
        };

        plugin.moveSlide = function () {
            if (carouselWidth > targetElementWidth) {
                slideValue = calculateHelper.getSlideValue();
                this.setActive($children, false);

                if ((slideValue) > carouselWidth - targetElementWidth - settings.slideMargin) {
                    slideValue = carouselWidth - targetElementWidth - settings.slideMargin;
                } else if (slideValue < 0) {
                    slideValue = 0;
                }

                this.move($targetElement, slideValue);

                if (settings.loop) {
                    if (scene >= (length - ($targetElement.find('.clone.left').length))) {
                        this.resetSlide($targetElement.find('.clone.left').length);
                    } else if (scene === 0) {
                        this.resetSlide($slide.find('.jqSlide').length);
                    }
                }

                this.checkControls();
            }
        };

        plugin.resetSlide = function (sceneId) {
            var $this = this;
            $slide.find('.carouselAction a').addClass('disabled');

            setTimeout(function () {
                scene = sceneId;
                $slide.css('transition-duration', '0ms');
                slideValue = calculateHelper.getSlideValue();
                $this.setActive($children, false);
                $this.move($targetElement, slideValue);
                $slide.css('transition-duration', settings.speed + 'ms');
                $slide.find('.carouselAction a').removeClass('disabled');
            }, settings.speed + 100);
        };

        plugin.moveThumb = function () {
            var position = (targetElementWidth / 2) - (thumbWidth / 2);
            var sceneId = scene - $targetElement.find('.clone.left').length;
            var $pager = $slide.parent().find('.jqPager');

            if (settings.loop === true) {
                if (sceneId >= $pager.children().length) {
                    sceneId = 0;
                } else if (sceneId < 0) {
                    sceneId = $pager.children().length;
                }
            }
            
            var thumbSlide = sceneId * ((thumbWidth + settings.thumbMargin)) - (position);

            if ((thumbSlide + targetElementWidth) > pagerWidth) {
                thumbSlide = pagerWidth - targetElementWidth - settings.thumbMargin;
            }

            if (thumbSlide < 0) {
                thumbSlide = 0;
            }

            this.move($pager, thumbSlide);
        };

        plugin.move = function (target, val) {
            target.css('position', 'relative').animate({ left: -val + 'px' }, settings.speed);

            if(settings.gallery) {
                var $thumb = $slide.parent().find('.jqPager').find('li');
                this.setActive($thumb, true);
            }
        };

        plugin.setHeight = function (target) {
            var child = settings.loop 
                ? target.children('.jqSlide ').first() 
                : target.children().first();

            var setCss = function () {
                target.css('height', child.outerHeight() + 'px');
            };
            setCss();
            //Установка корректной высоты, если изображение долго загружается
            if (child.find('img').length) {
                if (child.find('img')[0].complete) {
                    setCss();
                } else {
                    child.find('img').on('load', function () {
                        setCss();
                    });
                }
            }
        };

        plugin.build = function () {
            this.init();
            this.drawControls();
            this.checkControls();
            this.drawGalleryPager();
        };

        $targetElement.goToPreviousSlide = function () {
            if (scene > 0) {
                scene--;
                plugin.moveSlide();
                if (settings.gallery) {
                    plugin.moveThumb();
                }
            } else {
                if (settings.loop) {
                    plugin.moveSlide();
                    if (settings.gallery) {
                        plugin.moveThumb();
                    }
                }
            }
        };

        $targetElement.goToNextSlide = function () {
            var canMove = calculateHelper.getSlideValue() < carouselWidth - targetElementWidth - settings.slideMargin;

            if ((scene < length - 1) && canMove) {
                scene++;
                plugin.moveSlide();
                if (settings.gallery) {
                    plugin.moveThumb();
                }
            } else {
                if (settings.loop) {
                    scene = 0;
                    plugin.moveSlide();
                    if (settings.gallery) {
                        plugin.moveThumb();
                    }
                } else {
                    if((scene < length - 1)) {
                        scene++;
                        plugin.goToSlide(scene);
                    }
                }
            }
        };

        plugin.build();

        return this;
    };
}(jQuery));