// Avoid `console` errors in browsers that lack a console.
(function() {
  var method;
  var noop = function () {};
  var methods = [
    'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
    'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
    'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
    'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
  ];
  var length = methods.length;
  var console = (window.console = window.console || {});

  while (length--) {
    method = methods[length];

    // Only stub undefined methods.
    if (!console[method]) {
      console[method] = noop;
    }
  }
}());

// File#: _1_masonry
// Usage: codyhouse.co/license

(function() {
  var Masonry = function(element) {
    this.element = element;
    this.list = this.element.getElementsByClassName('js-masonry__list')[0];
    this.items = this.element.getElementsByClassName('js-masonry__item');
    this.activeColumns = 0;
    this.colStartWidth = 0; // col min-width (defined in CSS using --masonry-col-auto-size variable)
    this.colWidth = 0; // effective column width
    this.colGap = 0;
    // store col heights and items
    this.colHeights = [];
    this.colItems = [];
    // flex full support
    this.flexSupported = checkFlexSupported(this.items[0]);
    getGridLayout(this); // get initial grid params
    setGridLayout(this); // set grid params (width of elements)
    initMasonryLayout(this); // init gallery layout
  };

  function checkFlexSupported(item) {
    var itemStyle = window.getComputedStyle(item);
    return itemStyle.getPropertyValue('flex-basis') != 'auto';
  };

  function getGridLayout(grid) { // this is used to get initial grid details (width/grid gap)
    var itemStyle = window.getComputedStyle(grid.items[0]);
    if( grid.colStartWidth == 0) {
      grid.colStartWidth = parseFloat(itemStyle.getPropertyValue('width'));
    }
    grid.colGap = parseFloat(itemStyle.getPropertyValue('margin-right'));
  };

  function setGridLayout(grid) { // set width of items in the grid
    var contanerWidth = parseFloat(window.getComputedStyle(grid.element).getPropertyValue('width'));
    grid.activeColumns = parseInt((contanerWidth + grid.colGap)/(grid.colStartWidth+grid.colGap));
    if(grid.activeColumns == 0) grid.activeColumns = 1;
    grid.colWidth = parseFloat((contanerWidth - (grid.activeColumns - 1)*grid.colGap)/grid.activeColumns);
    for(var i = 0; i < grid.items.length; i++) {
      grid.items[i].style.width = grid.colWidth+'px'; // reset items width
    }
  };

  function initMasonryLayout(grid) {
    if(grid.flexSupported) {
      checkImgLoaded(grid); // reset layout when images are loaded
    } else {
      Util.addClass(grid.element, 'masonry--loaded'); // make sure the gallery is visible
    }

    grid.element.addEventListener('masonry-resize', function(){ // window has been resized -> reset masonry layout
      getGridLayout(grid);
      setGridLayout(grid);
      if(grid.flexSupported) layItems(grid); 
    });

    grid.element.addEventListener('masonry-reset', function(event){ // reset layout (e.g., new items added to the gallery)
      if(grid.flexSupported) checkImgLoaded(grid); 
    });
  };

  function layItems(grid) {
    Util.addClass(grid.element, 'masonry--loaded'); // make sure the gallery is visible
    grid.colHeights = [];
    grid.colItems = [];

    // grid layout has already been set -> update container height and order of items
    for(var j = 0; j < grid.activeColumns; j++) {
      grid.colHeights.push(0); // reset col heights
      grid.colItems[j] = []; // reset items order
    }
    
    for(var i = 0; i < grid.items.length; i++) {
      var minHeight = Math.min.apply( Math, grid.colHeights ),
        index = grid.colHeights.indexOf(minHeight);
      grid.colItems[index].push(i);
      grid.items[i].style.flexBasis = 0; // reset flex basis before getting height
      var itemHeight = grid.items[i].getBoundingClientRect().height || grid.items[i].offsetHeight || 1;
      grid.colHeights[index] = grid.colHeights[index] + grid.colGap + itemHeight;
    }

    // reset height of container
    var masonryHeight = Math.max.apply( Math, grid.colHeights ) + 5;
    grid.list.style.cssText = 'height: '+ masonryHeight + 'px;';

    // go through elements and set flex order
    var order = 0;
    for(var i = 0; i < grid.colItems.length; i++) {
      for(var j = 0; j < grid.colItems[i].length; j++) {
        grid.items[grid.colItems[i][j]].style.order = order;
        order = order + 1;
      }
      // change flex-basis of last element of each column, so that next element shifts to next col
      var lastItemCol = grid.items[grid.colItems[i][grid.colItems[i].length - 1]];
      lastItemCol.style.flexBasis = masonryHeight - grid.colHeights[i] + lastItemCol.getBoundingClientRect().height - 5 + 'px';
    }

    // emit custom event when grid has been reset
    grid.element.dispatchEvent(new CustomEvent('masonry-laid'));
  };

  function checkImgLoaded(grid) {
    var imgs = grid.list.getElementsByTagName('img');

    function countLoaded() {
      var setTimeoutOn = false;
      for(var i = 0; i < imgs.length; i++) {
        if(!imgs[i].complete) {
          setTimeoutOn = true;
          break;
        } else if (typeof imgs[i].naturalHeight !== "undefined" && imgs[i].naturalHeight == 0) {
          setTimeoutOn = true;
          break;
        }
      }

      if(!setTimeoutOn) {
        layItems(grid);
      } else {
        setTimeout(function(){
          countLoaded();
        }, 100);
      }
    };

    if(imgs.length == 0) {
      layItems(grid); // no need to wait -> no img available
    } else {
      countLoaded();
    }
  };

  //initialize the Masonry objects
  var masonries = document.getElementsByClassName('js-masonry'), 
    flexSupported = Util.cssSupports('flex-basis', 'auto'),
    masonriesArray = [];

  if( masonries.length > 0) {
    for( var i = 0; i < masonries.length; i++) {
      if(!flexSupported) {
        Util.addClass(masonries[i], 'masonry--loaded'); // reveal gallery
      } else {
        (function(i){masonriesArray.push(new Masonry(masonries[i]));})(i); // init Masonry Layout
      }
    }

    if(!flexSupported) return;

    // listen to window resize -> reorganize items in gallery
    var resizingId = false,
      customEvent = new CustomEvent('masonry-resize');
      
    window.addEventListener('resize', function() {
      clearTimeout(resizingId);
      resizingId = setTimeout(doneResizing, 500);
    });

    function doneResizing() {
      for( var i = 0; i < masonriesArray.length; i++) {
        (function(i){masonriesArray[i].element.dispatchEvent(customEvent)})(i);
      };
    };
  };
}());


// File#: _1_reveal-effects
// Usage: codyhouse.co/license
(function() {
	var fxElements = document.getElementsByClassName('reveal-fx');
	var intersectionObserverSupported = ('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype);
	if(fxElements.length > 0) {
		// deactivate effect if Reduced Motion is enabled
		if (Util.osHasReducedMotion() || !intersectionObserverSupported) {
			fxRemoveClasses();
			return;
		}
		//on small devices, do not animate elements -> reveal all
		if( fxDisabled(fxElements[0]) ) {
			fxRevealAll();
			return;
		}

		var fxRevealDelta = 120; // amount (in pixel) the element needs to enter the viewport to be revealed - if not custom value (data-reveal-fx-delta)
		
		var viewportHeight = window.innerHeight,
			fxChecking = false,
			fxRevealedItems = [],
			fxElementDelays = fxGetDelays(), //elements animation delay
			fxElementDeltas = fxGetDeltas(); // amount (in px) the element needs enter the viewport to be revealed (default value is fxRevealDelta) 
		
		
		// add event listeners
		window.addEventListener('load', fxReveal);
		window.addEventListener('resize', fxResize);

		// observe reveal elements
		var observer = [];
		initObserver();

		function initObserver() {
			for(var i = 0; i < fxElements.length; i++) {
				observer[i] = new IntersectionObserver(
					function(entries, observer) { 
						if(entries[0].isIntersecting) {
							fxRevealItemObserver(entries[0].target);
							observer.unobserve(entries[0].target);
						}
					}, 
					{rootMargin: "0px 0px -"+fxElementDeltas[i]+"px 0px"}
				);
	
				observer[i].observe(fxElements[i]);
			}
		};

		function fxRevealAll() { // reveal all elements - small devices
			for(var i = 0; i < fxElements.length; i++) {
				Util.addClass(fxElements[i], 'reveal-fx--is-visible');
			}
		};

		function fxResize() { // on resize - check new window height and reveal visible elements
			if(fxChecking) return;
			fxChecking = true;
			(!window.requestAnimationFrame) ? setTimeout(function(){fxReset();}, 250) : window.requestAnimationFrame(fxReset);
		};

		function fxReset() {
			viewportHeight = window.innerHeight;
			fxReveal();
		};

		function fxReveal() { // reveal visible elements
			for(var i = 0; i < fxElements.length; i++) {(function(i){
				if(fxRevealedItems.indexOf(i) != -1 ) return; //element has already been revelead
				if(fxElementIsVisible(fxElements[i], i)) {
					fxRevealItem(i);
					fxRevealedItems.push(i);
				}})(i); 
			}
			fxResetEvents(); 
			fxChecking = false;
		};

		function fxRevealItem(index) {
			if(fxElementDelays[index] && fxElementDelays[index] != 0) {
				// wait before revealing element if a delay was added
				setTimeout(function(){
					Util.addClass(fxElements[index], 'reveal-fx--is-visible');
				}, fxElementDelays[index]);
			} else {
				Util.addClass(fxElements[index], 'reveal-fx--is-visible');
			}
		};

		function fxRevealItemObserver(item) {
			var index = Util.getIndexInArray(fxElements, item);
			if(fxRevealedItems.indexOf(index) != -1 ) return; //element has already been revelead
			fxRevealItem(index);
			fxRevealedItems.push(index);
			fxResetEvents(); 
			fxChecking = false;
		};

		function fxGetDelays() { // get anmation delays
			var delays = [];
			for(var i = 0; i < fxElements.length; i++) {
				delays.push( fxElements[i].getAttribute('data-reveal-fx-delay') ? parseInt(fxElements[i].getAttribute('data-reveal-fx-delay')) : 0);
			}
			return delays;
		};

		function fxGetDeltas() { // get reveal delta
			var deltas = [];
			for(var i = 0; i < fxElements.length; i++) {
				deltas.push( fxElements[i].getAttribute('data-reveal-fx-delta') ? parseInt(fxElements[i].getAttribute('data-reveal-fx-delta')) : fxRevealDelta);
			}
			return deltas;
		};

		function fxDisabled(element) { // check if elements need to be animated - no animation on small devices
			return !(window.getComputedStyle(element, '::before').getPropertyValue('content').replace(/'|"/g, "") == 'reveal-fx');
		};

		function fxElementIsVisible(element, i) { // element is inside viewport
			return (fxGetElementPosition(element) <= viewportHeight - fxElementDeltas[i]);
		};

		function fxGetElementPosition(element) { // get top position of element
			return element.getBoundingClientRect().top;
		};

		function fxResetEvents() { 
			if(fxElements.length > fxRevealedItems.length) return;
			// remove event listeners if all elements have been revealed
			window.removeEventListener('load', fxReveal);
			window.removeEventListener('resize', fxResize);
		};

		function fxRemoveClasses() {
			// Reduced Motion on or Intersection Observer not supported
			while(fxElements[0]) {
				// remove all classes starting with 'reveal-fx--'
				var classes = fxElements[0].getAttribute('class').split(" ").filter(function(c) {
					return c.lastIndexOf('reveal-fx--', 0) !== 0;
				});
				fxElements[0].setAttribute('class', classes.join(" ").trim());
				Util.removeClass(fxElements[0], 'reveal-fx');
			}
		};
	}
}());


// File#: _1_image-zoom
// Usage: codyhouse.co/license

(function() {
  var ImageZoom = function(element, index) {
    this.element = element;
    this.lightBoxId = 'img-zoom-lightbox--'+index;
    this.imgPreview = this.element.getElementsByClassName('js-image-zoom__preview')[0];
    
    initImageZoomHtml(this); // init markup
    
    this.lightbox = document.getElementById(this.lightBoxId);
    this.imgEnlg = this.lightbox.getElementsByClassName('js-image-zoom__fw')[0];
    this.input = this.element.getElementsByClassName('js-image-zoom__input')[0];
    this.animate = this.element.getAttribute('data-morph') != 'off';
    
    initImageZoomEvents(this); //init events
  };

  function initImageZoomHtml(imageZoom) {
    // get zoomed image url
    var url = imageZoom.element.getAttribute('data-img');
    if(!url) url = imageZoom.imgPreview.getAttribute('src');

    var lightBox = document.createElement('div');
    Util.setAttributes(lightBox, {class: 'image-zoom__lightbox js-image-zoom__lightbox', id: imageZoom.lightBoxId, 'aria-hidden': 'true'});
    lightBox.innerHTML = '<img src="'+url+'" class="js-image-zoom__fw"></img>';
    document.body.appendChild(lightBox);
    
    var keyboardInput = '<input aria-hidden="true" type="checkbox" class="image-zoom__input js-image-zoom__input"></input>';
    imageZoom.element.insertAdjacentHTML('afterbegin', keyboardInput);

  };

  function initImageZoomEvents(imageZoom) {
    // toggle lightbox on click
    imageZoom.imgPreview.addEventListener('click', function(event){
      toggleFullWidth(imageZoom, true);
      imageZoom.input.checked = true;
    });
    imageZoom.lightbox.addEventListener('click', function(event){
      toggleFullWidth(imageZoom, false);
      imageZoom.input.checked = false;
    });
    // keyboard accessibility
    imageZoom.input.addEventListener('change', function(event){
      toggleFullWidth(imageZoom, imageZoom.input.checked);
    });
    imageZoom.input.addEventListener('keydown', function(event){
      if( (event.keyCode && event.keyCode == 13) || (event.key && event.key.toLowerCase() == 'enter') ) {
        imageZoom.input.checked = !imageZoom.input.checked;
        toggleFullWidth(imageZoom, imageZoom.input.checked);
      }
    });
  };

  function toggleFullWidth(imageZoom, bool) {
    if(animationSupported && imageZoom.animate) { // start expanding animation
      window.requestAnimationFrame(function(){
        animateZoomImage(imageZoom, bool);
      });
    } else { // show lightbox without animation
      Util.toggleClass(imageZoom.lightbox, 'image-zoom__lightbox--is-visible', bool);
    }
  };

  function animateZoomImage(imageZoom, bool) {
    // get img preview position and dimension for the morphing effect
    var rect = imageZoom.imgPreview.getBoundingClientRect(),
      finalWidth = imageZoom.lightbox.getBoundingClientRect().width;
    var init = (bool) ? [rect.top, rect.left, rect.width] : [0, 0, finalWidth],
      final = (bool) ? [-rect.top, -rect.left, parseFloat(finalWidth/rect.width)] : [rect.top + imageZoom.lightbox.scrollTop, rect.left, parseFloat(rect.width/finalWidth)];
    
    if(bool) {
      imageZoom.imgEnlg.setAttribute('style', 'top: '+init[0]+'px; left:'+init[1]+'px; width:'+init[2]+'px;');
    }
    
    // show modal
    Util.removeClass(imageZoom.lightbox, 'image-zoom__lightbox--no-transition');
    Util.addClass(imageZoom.lightbox, 'image-zoom__lightbox--is-visible');

    imageZoom.imgEnlg.addEventListener('transitionend', function cb(event){ // reset elements once animation is over
      if(!bool) Util.removeClass(imageZoom.lightbox, 'image-zoom__lightbox--is-visible');
      Util.addClass(imageZoom.lightbox, 'image-zoom__lightbox--no-transition');
      imageZoom.imgEnlg.removeAttribute('style');
      imageZoom.imgEnlg.removeEventListener('transitionend', cb);
    });
    
    // animate image and bg
    imageZoom.imgEnlg.style.transform = 'translateX('+final[1]+'px) translateY('+final[0]+'px) scale('+final[2]+')';
    Util.toggleClass(imageZoom.lightbox, 'image-zoom__lightbox--animate-bg', bool);
  };

  // init ImageZoom object
  var imageZoom = document.getElementsByClassName('js-image-zoom'),
    animationSupported = window.requestAnimationFrame && !Util.osHasReducedMotion();
  if( imageZoom.length > 0 ) {
    var imageZoomArray = [];
    for( var i = 0; i < imageZoom.length; i++) {
      imageZoomArray.push(new ImageZoom(imageZoom[i], i));
    }

    // close Zoom Image lightbox on Esc
    window.addEventListener('keydown', function(event){
      if((event.keyCode && event.keyCode == 27) || (event.key && event.key.toLowerCase() == 'esc')) {
        for( var i = 0; i < imageZoomArray.length; i++) {
          imageZoomArray[i].input.checked = false;
          if(Util.hasClass(imageZoomArray[i].lightbox, 'image-zoom__lightbox--is-visible')) toggleFullWidth(imageZoomArray[i], false);
        }
      }
    });
  }
}());

// File#: _1_immersive-section-transition
// Usage: codyhouse.co/license
(function() {
  var ImmerseSectionTr = function(element) {
    this.element = element;
    this.media = this.element.getElementsByClassName('js-immerse-section-tr__media');
    this.scrollContent = this.element.getElementsByClassName('js-immerse-section-tr__content');
    if(this.media.length < 1) return;
    this.figure = this.media[0].getElementsByClassName('js-immerse-section-tr__figure');
    if(this.figure.length < 1) return;
    this.visibleFigure = false;
    this.mediaScale = 1;
    this.mediaInitHeight = 0;
    this.elementPadding = 0;
    this.scrollingFn = false;
    this.scrolling = false;
    this.active = false;
    this.scrollDelta = 0; // amount to scroll for full-screen scaleup
    initImmerseSectionTr(this);
  };

  function initImmerseSectionTr(element) {
    initContainer(element);
    resetSection(element);

    // listen to resize event and reset values
    element.element.addEventListener('update-immerse-section', function(event){
      resetSection(element);
    });

    // detect when the element is sticky - update scale value and opacity layer 
    var observer = new IntersectionObserver(immerseSectionTrCallback.bind(element));
    observer.observe(element.media[0]);
  };

  function resetSection(element) {
    getVisibleFigure(element);
    checkEffectActive(element);
    if(element.active) {
      Util.removeClass(element.element, 'immerse-section-tr--disabled');
      updateMediaHeight(element);
      getMediaScale(element); 
      updateMargin(element);
      setScaleValue.bind(element)();
    } else {
      // reset appearance
      Util.addClass(element.element, 'immerse-section-tr--disabled');
      element.media[0].style = '';
      element.scrollContent[0].style = '';
      updateScale(element, 1);
      updateOpacity(element, 0);
    }
    element.element.dispatchEvent(new CustomEvent('immersive-section-updated', {detail: {active: element.active, asset: element.visibleFigure}}));
  };

  function getVisibleFigure(element) { // get visible figure element
    element.visibleFigure = false;
    for(var i = 0; i < element.figure.length; i++) {
      if(window.getComputedStyle(element.figure[i]).getPropertyValue('display') != 'none') {
        element.visibleFigure = element.figure[i];
        break;
      }
    }
  };

  function updateMediaHeight(element) { // set sticky element padding/margin + height
    element.mediaInitHeight = element.visibleFigure.offsetHeight;
    element.scrollDelta = (window.innerHeight - element.visibleFigure.offsetHeight) > (window.innerWidth - element.visibleFigure.offsetWidth)
      ? (window.innerHeight - element.visibleFigure.offsetHeight)/2
      : (window.innerWidth - element.visibleFigure.offsetWidth)/2;
    if(element.scrollDelta > window.innerHeight) element.scrollDelta = window.innerHeight;
    if(element.scrollDelta < 200) element.scrollDelta = 200;
    element.media[0].style.height = window.innerHeight+'px';
    element.media[0].style.paddingTop = (window.innerHeight - element.visibleFigure.offsetHeight)/2+'px';
    element.media[0].style.marginTop = (element.visibleFigure.offsetHeight - window.innerHeight)/2+'px';
  };

  function getMediaScale(element) { // get media final scale value
    var scaleX = roundValue(window.innerWidth/element.visibleFigure.offsetWidth),
      scaleY = roundValue(window.innerHeight/element.visibleFigure.offsetHeight);

    element.mediaScale = Math.max(scaleX, scaleY);
    element.elementPadding = parseInt(window.getComputedStyle(element.element).getPropertyValue('padding-top'));
  };

  function roundValue(value) {
    return (Math.ceil(value*100)/100).toFixed(2);
  };

  function updateMargin(element) { // update distance between media and content elements
    if(element.scrollContent.length > 0) element.scrollContent[0].style.marginTop = element.scrollDelta+'px';
  };

  function setScaleValue() { // update asset scale value
    if(!this.active) return; // effect is not active
    var offsetTop = (window.innerHeight - this.mediaInitHeight)/2;
    var top = this.element.getBoundingClientRect().top + this.elementPadding;

    if( top < offsetTop && top > offsetTop - this.scrollDelta) {
      var scale = 1 + (top - offsetTop)*(1 - this.mediaScale)/this.scrollDelta;
      updateScale(this, scale);
      updateOpacity(this, 0);
    } else if(top >= offsetTop) {
      updateScale(this, 1);
      updateOpacity(this, 0);
    } else {
      updateScale(this, this.mediaScale);
      updateOpacity(this, 1.8*( offsetTop - this.scrollDelta - top)/ window.innerHeight);
    }

    this.scrolling = false;
  };

  function updateScale(element, value) { // apply new scale value
    element.visibleFigure.style.transform = 'scale('+value+')';
    element.visibleFigure.style.msTransform = 'scale('+value+')';
  };

  function updateOpacity(element, value) { // update layer opacity
    element.element.style.setProperty('--immerse-section-tr-opacity', value);
  };

  function immerseSectionTrCallback(entries) { // intersectionObserver callback
    if(entries[0].isIntersecting) {
      if(this.scrollingFn) return; // listener for scroll event already added
      immerseSectionTrScrollEvent(this);
    } else {
      if(!this.scrollingFn) return; // listener for scroll event already removed
      window.removeEventListener('scroll', this.scrollingFn);
      this.scrollingFn = false;
    }
  };

  function immerseSectionTrScrollEvent(element) { // listen to scroll when asset element is inside the viewport
    element.scrollingFn = immerseSectionTrScrolling.bind(element);
    window.addEventListener('scroll', element.scrollingFn);
  };

  function immerseSectionTrScrolling() { // update asset scale on scroll
    if(this.scrolling) return;
    this.scrolling = true;
    window.requestAnimationFrame(setScaleValue.bind(this));
  };

  function initContainer(element) {
    // add a padding to the container to fix the collapsing-margin issue
    if(parseInt(window.getComputedStyle(element.element).getPropertyValue('padding-top')) == 0) element.element.style.paddingTop = '1px';
  };

  function checkEffectActive(element) { //check if effect needs to be activated
    element.active = true;
    if(element.visibleFigure.offsetHeight >= window.innerHeight) element.active = false;
    if( window.innerHeight - element.visibleFigure.offsetHeight >= 600) element.active = false;
  };

  //initialize the ImmerseSectionTr objects
  var immerseSections = document.getElementsByClassName('js-immerse-section-tr'),
    reducedMotion = Util.osHasReducedMotion(),
    intObserverSupported = ('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype);

  if(immerseSections.length < 1 ) return;
	if( !reducedMotion && intObserverSupported) {
    var immerseSectionsArray = [];
		for( var i = 0; i < immerseSections.length; i++) {
      (function(i){immerseSectionsArray.push(new ImmerseSectionTr(immerseSections[i]));})(i);
    }

    if(immerseSectionsArray.length > 0) {
      var resizingId = false,
        customEvent = new CustomEvent('update-immerse-section');
      
      window.addEventListener('resize', function() {
        clearTimeout(resizingId);
        resizingId = setTimeout(doneResizing, 500);
      });

      function doneResizing() {
        for( var i = 0; i < immerseSectionsArray.length; i++) {
          (function(i){immerseSectionsArray[i].element.dispatchEvent(customEvent)})(i);
        };
      };
    };
  } else { // effect deactivated
    for( var i = 0; i < immerseSections.length; i++) Util.addClass(immerseSections[i], 'immerse-section-tr--disabled');
  }
}());

// Place any jQuery/helper plugins in here.
