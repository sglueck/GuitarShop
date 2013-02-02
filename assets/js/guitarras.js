//------------------------------------
//
//	Javascript for Guitarras de Luna
//  Flagrantly stolen from Engage Interactive
//  	and modified for class project
//
//	Ordinarily, I'd continue pruning to only
//		leave what I actually need, but I
//		ran out of time.
//
//------------------------------------

//
//	SETTINGS
//

var setting = {
	nav:			{
		trigger:			60,								// The point where we compact the nav
		fullHeight:			100,							// The full size nav height, before the trigger
		compactHeight:		60,								// The compact nav height, after the trigger
		text:				{
			dark:				'dark',
			light:				'light'
		},
		background:			{
			transparent:		'transparent',
			color:				'yellow'
		}
	},
	headerPeek:		100,								// The distance the header will move to peek at the underlaying slide
	darkClass:		'dark',								// The class used for the light nav
	lightClass:		'light',							// Same for the dark nav
	compactClass:	'compact',							// The class to make the nav shrink
	bgClass:		'background',						// The class to show the background
	overlayZ:		100,
	tooltipDelay:	200,
	transitions:	true								// Whether or not to use page transitions
};

var $core,												// The window, document and body
	$site,												// Various site elements
	header,												// The header, only used when there is one
	site,												// Stores various bits of information about the website
	mouse,
	timer,
	ajax;

// 	Global functions

var updateTopNavColor = function(){},
	updateFixedNavHeight = function(){},
	updateFixedNavVisibility = function(){},
	buildSpinner = function(){},
	loadPage = function(){};

//
//	BEGIN JQUERY
//

$(function(){


	//	Core page objects

	$core = {
		win:			$(window),
		doc:			$(document),
		html:			$('html'),
		body:			$('body')
	};


	//	Core site objects

	$site = {
		nav:			{
			top:			$('nav.top:first', $core.body),
			fixed:			$('nav.top:first', $core.body).clone().addClass('fixed').removeClass('top').appendTo($core.body),
			both:			$('nav.primary')
		},
		header:			$core.body.children('header').length > 0 ? $core.body.children('header') : false,
		footer:			$core.body.children('footer'),
		showMeMore:		$core.body.children('.show_me_more').length > 0 ? $core.body.children('.show_me_more') : false,
		overlay:		$('span#overlay'),
		content:		$('.content_wrapper'),
		loading:		false
	};

	//	Site variables

	site = {
		fresh:			true,
		history:		setting.transitions && !$core.html.is('.lt-ie9') ? window.History : false,
		state:			window.History.getState(),
		width:			$core.win.width(),
		height:			$core.win.height(),
		scroll:			0,
		transitions:	$.support.transition,
		overlay:		false,
		content:		{
			current:		$site.content.attr('id'),
			previous:		false,
			// For blog posts
			disqus:			{},
			destroy:		function(){}
		},
		header:			{
			active:			false,
			peek:			false
		},
		player: null
	};

	mouse = {
		ban:	{
			header:	false,
			page:	false,
			nav:	false
		},
		x:		0,
		y:		0
	};

	timer = {
		header:	{
			auto:			false,
			peek:			false,
			tooltip:		false
		},
		ajax:		false,
		tooltip:	false,
		overlay:	false
	};

	ajax = {
		page:	false,
		img:	false,
		all:	false
	};


	//	Header variables

	var setHeader = function(){

		return $site.header.length > 0 ? {
			slide:			$site.header.find('.slide').length > 0 ? $site.header.find('.slide') : false,
			height:			$site.header.height(),
			current:		$site.header.find('.active').length ? $site.header.find('.active').index() : 0,
			total:			$site.header.find('.slide').length - 1
		} : false;

	};

	header = setHeader();


	//	Set up the nav

	setNav = function(){

		return {
			top:	{
				hidden:		header ? true : false,
				text:		header.slide && $(header.slide[header.current]).length > 0 ? $(header.slide[header.current]).data().nav : setting.nav.text.dark

			},
			fixed:	{
				hidden:		header && site.scroll < header.height ? true : false,
				height:		site.scroll < setting.nav.trigger ? setting.nav.fullHeight : setting.nav.compactHeight
			}
		};

	};

	nav = setNav();


	//	Fallback to old jQuery animations

	if ( !site.transitions )
		$.fn.transition = $.fn.animate;


	//
	//	GENERIC FUNCTIONS
	//

	var showOverlay = function(settings){

		var defaults = {
			opacity:	.6,
			zIndex:		false,
			top:		0,
			height:		false,
			color:		'#FFF',
			after:		function(){},
			click:		false
		};

		var option = $.extend(defaults, settings);

		if( !site.overlay ){

			site.overlay = true;

			$site.overlay.css({
				position:	option.height ? 'absolute' : 'fixed',
				top:		option.top,
				height:		option.height ? option.height : '100%',
				opacity:	0,
				background:	option.color,
				zIndex:		option.zIndex ? option.zIndex : setting.overlayZ
			});

			$site.overlay.transition({
				opacity:	option.opacity
			}, 300, 'SmoothFade', function(){

				option.after();

			});

		}else{

			$site.overlay.transition({
				top:		option.top,
				opacity:	option.opacity,
				background:	option.color
			}, 300, 'SmoothFade', function(){

				option.after();

			});

		}

		if( option.click ){

			$site.overlay.on('click', function(){

				option.click();

			});

		}

	};

	var hideOverlay = function(callback){

		if( site.overlay ){

			$site.overlay.transition({
				opacity:	0
			}, 300, 'SmoothFade', function(){

				$site.overlay.css({
					zIndex:		0,
					height:		0
				}).empty();

				site.overlay = false;

				if( callback )
					callback.apply();

			}).off('click');

		}

	};

	var addShowMeMore = function(){

		$site.showMeMore = $('<div/>',{
			'class':	'show_me_more',
			html:		'<a href="#case_study"><em>show me</em> <span>more</span></a>'
		});

		$site.showMeMore.insertAfter($site.header);

	};


	//
	//	GLOBAL FUNCTIONS
	//

	mouseBan = function(range){

		var banned = false;

		// If no range is supplied, loop through all bans
		if( !range )
			range = mouse.ban;

		// Loop through all possible bans
		for( ban in range ){

			if( mouse.ban[range[ban]] )
				banned = true;

		}

		return banned;

	};

	updateFixedNavVisibility = function(animate){

		// Override animation if this is a fresh website
		animate = site.fresh ? false : animate;

		var pos = nav.fixed.hidden ? 0 - ( nav.fixed.height + 10 ) : 0;

		if( animate ){

			$site.nav.fixed.transition({
				marginTop:	pos
			}, 200, 'InOutCubic');

		}else{

			$site.nav.fixed.css({
				marginTop:	pos
			});

		}

	}

	updateFixedNavHeight = function(animate){

		if( animate ){

			$site.nav.fixed.transition({
				height:	nav.fixed.height
			}, 200, 'OutCubic');

			if( $core.html.is('.lt-ie9') ){

				$('a', $site.nav.both).transition({
					height:	nav.fixed.height
				}, 200, 'OutCubic');

			}

		}else{

			$site.nav.fixed.css({
				height:	nav.fixed.height
			});

			if( $core.html.is('.lt-ie9') ){

				$('a', $site.nav.both).css({
					height:	nav.fixed.height
				});

			}

		}

	}

	updateTopNavColor = function(){

		$site.nav.top
			.addClass(nav.top.text)
			.removeClass(nav.top.text == setting.nav.text.dark ? setting.nav.text.light : setting.nav.text.dark);

	}

	buildSpinner = function(){

		return $('<span/>',{
			'class':	'loading',
			html:		'<span></span><i></i>'
		});

	}
	
	//
	//	PAGE LOADING
	//

	var activatePage = function(done){

		console.log('Activating page: ' + site.content.current );

		// Work out if we are changing sections
		var sameSection = site.content.current == site.content.previous;

		// Update the nav
		updateTopNavColor();
		updateFixedNavHeight();
		updateFixedNavVisibility(!sameSection);

		// If there is a header, get all the metrics and status and activate it
		if( header ){

			activateHeader(sameSection);

		}else if( site.header.active ){

			$.coolHeader.destroy();

		}

		// Activate the content
		activateContent();

		if( done )
			done.apply();

	}

	var activateHeader = function(sameSection){

		if( !sameSection && site.header.active )
			$.coolHeader.destroy();


		console.log('>>	Header done');


		//
		//	Homepage
		//

		if( site.content.current == 'home_landing' ){

			$.coolHeader({
				effect:	'fade',
				scroll:	function($slide, slidePosition, opacity){

					if( site.transitions ){

						$slide.find('div').css({
							'y':			slidePosition - Math.round( site.scroll / 2 ),
							'opacity':		opacity
						});

					}else{

						$slide.find('div').css({
							'marginTop':	( 0 - $slide.find('div').height() / 2 ) - slidePosition - Math.round( site.scroll / 2 ),
							'opacity':		opacity
						});

					}

				}
			});

		}


		//
		//	About us
		//

		if( site.content.current == 'about_us_landing' ){

			$.coolHeader();

		}

		if( site.content.current == 'about_us' ){

			if( !sameSection ){

				$.coolHeader({
					showArrows:		true,
					paralax:		4,
					speed:			400
				});

			}else if( site.history ){

				var newHeaderIndex = $(header.slide).filter('.' + site.state.hash.replace('/about/','')).index();

				if( header.current != newHeaderIndex ){

					setTimeout(function(){

						$.coolHeader.headerSlideTo(newHeaderIndex, true);

					}, 500);

				}

			}

		}


		//
		//	CASE STUDIES
		//

		if( site.content.current == 'case_study' ){

			//	Header - only activate if we're new to the case study pages
			if( !sameSection ){

				var $brand,
					$logo,
					$closer,
					showMeMore = true;

				$.coolHeader({
					showArrows:		true,
					paralax:		4,
					speed:			400,
					beforeSlide:	function($new, $old){

						$brand = $new.children('div');
						$logo = $brand.children('img.logo');
						$closer = $brand.children('h2');

						if( site.transitions ){

							$logo.stop([]).css({
								opacity:	0,
								y:			'50%'
							});

							$closer.stop([]).css({
								opacity:	0,
								y:			'-150%'
							});

						}else{

							$logo.stop([]).css({
								opacity:	0,
								marginTop:	'50px'
							});

							$closer.stop([]).css({
								opacity:	0,
								marginTop:			'-100px'
							});

						}

					},
					afterSlide:		function($new, $old){

						if( site.transitions ){

							$logo.transition({
								opacity:	1,
								y:			0,
								delay:		100
							}, 600, 'OutCubic');

							$closer.transition({
								opacity:	1,
								y:			0
							}, 600, 'SmoothFade');

						}else{

							$logo.animate({
								opacity:	1,
								marginTop:	0
							}, 600, 'OutCubic');

							$closer.animate({
								opacity:	1,
								marginTop:	0
							}, 600, 'SmoothFade');

						}

					},
					scroll:			function($slide, slidePosition, opacity){

						if( site.transitions ){

							$brand.css({
								y:			slidePosition - Math.round( site.scroll / 2 ),
								opacity:	opacity
							});

						}else{

							$brand.css({
								marginTop:	-80 - slidePosition - Math.round( site.scroll / 2 ),
								opacity:	opacity
							});

						}

						if( site.scroll > header.height / 2 && showMeMore ){

							showMeMore = false;

							$('a', $site.showMeMore).addClass('hide');

						}else if( site.scroll <= header.height / 2 && !showMeMore ){

							showMeMore = true;

							$('a', $site.showMeMore).removeClass('hide');

						}

					}
				});

				$site.showMeMore = $('.show_me_more');

				$('a', $site.showMeMore).scrollTo({
					offset:	20 - setting.nav.compactHeight,
					before:	function(){

						$site.showMeMore.addClass('hide');

					}
				});

			}

		}

	}

	var activateContent = function(){

		console.log('>>	Content done\n\n─────────────────────────\n');

		// DISQUS GLOBALS
		disqus_shortname = 'engageinteractive';

		if(location.href.search('engageinteractive.co.uk') == '-1'){
			// disqus_developer = 1;
		}

		//
		//	ALL PAGES
		//

		//	Load images  - CHANGE THIS!
		$('span[data-src]').each(function(){

			var $this = $(this);

			$.loadImg({
				src:	$(this).data().src,
				onload:	function($img){

					$img.appendTo($this);

					$this.transition({
						opacity:	1
					});

				}
			});

		});

		//	Various plugins
		$('.slider').slider();
		$('select').simpleSelect();


		//	Set any checkboxes or radio buttons
		$core.body.find('label.checkbox input:checked').parent('label.checkbox').addClass('checked');


		//
		//	CASE STUDIES
		//

		if( site.content.current == 'case_study' ){

			//	Various plugins
			$('#presenter').presenter();
			$('.compare_swipe').compare();

			if( !site.transitions )
				$site.content.find('section:even').addClass('even');

			if( $site.content.is('.clarion') ){

				$core.win.bind('scroll.clarion', function(){

					$('#people .background').css({
						backgroundPosition:	( site.scroll / 3 ) + 'px 0'
					});

				});

			}

		}

	}


	//	HTML Helper
	//	Removes all the unnecessary elements from a loaded page

	var documentHtml = function(html){

		// Prepare
		var result = String(html)
			.replace(/<\!DOCTYPE[^>]*>/i, '')
			.replace(/<(html|head|body|title|meta|script)([\s\>])/gi,'<div class="document-$1"$2')
			.replace(/<\/(html|head|body|title|meta|script)\>/gi,'</div>')
		;

		// Return
		return result;

	};

	loadPage = function(url, done){

		console.log('Loading: ', url ? url : site.state.hash);

		//	Ban the mouse
		mouse.ban.nav = true;

		//	Variables and objects
		var $page = $('<div/>'),
			ajaxData = false;

		var getPage = function(){

			var bumder = url ? url : site.state.hash;

			//	Begin loading the page
			ajax.page = $.ajax({
				url:		url ? url : site.state.hash,
				success:	function(data, textStatus, jqXHR){

					if( ajax.page ){

						ajaxData = data;
						clearTimeout(timer.ajax);
						insertPage();
						ajax.page = false;
						mouse.ban.nav = false;

					}

				},
				error:		function(){

					window.location = '/404';

				}
			});

		}

		//	Insert the new page into the old one
		var insertPage = function(){

			//	Destroy any events that the previous page bound
			site.content.destroy();

			// Prepare
			var $data = $(documentHtml(ajaxData)),
				$dataBody = $data.find('.document-body'),
				$contentWrapper = $data.find('.content_wrapper');

			document.title = $data.find('.document-title').text();


			// Keep a track of the content id for error checking
			site.content.previous = site.content.current;
			site.content.current = $contentWrapper.attr('id');

			// Do we have a header?
			var newPageHasHeader = $dataBody.children('header').length > 0,
				sameSection = site.content.current == site.content.previous;

			if( newPageHasHeader ){

				if( !sameSection ){

					if( $site.header ){

						$site.header.empty().replaceWith($dataBody.children('header'));

					}else{

						$dataBody.children('header').insertAfter($site.nav.top);

					}

					$site.header = $core.body.children('header');
					header = setHeader();

				}

			}else if( !newPageHasHeader && $site.header ){

				$site.header.transition({
					height:	setting.nav.fullHeight
				}, 400, 'InOutCubic', function(){

					$(this).remove();

				});

				$site.header = false;
				header = setHeader();

			}

			// If we are on a case study, add in the show me more circle
			if( site.content.current == 'case_study' ){

				if( !$site.showMeMore ){

					addShowMeMore();

				}

			}else if( $site.showMeMore ){

				$site.showMeMore.remove();
				$site.showMeMore = false;

			}

			// Get the status of the nav
			nav = setNav();

			// Get the status of the header
			if( !sameSection )
				header = setHeader();

			// Replace content
			$site.content.empty().replaceWith($data.find('.content_wrapper'));
			$site.content = $core.body.children('.content_wrapper');

			activatePage(function(){

				// Wait a split second for dom to render then hide the overlay
				timer.overlay = setTimeout(function(){

					hideOverlay();

					if( $site.loading ){

						$site.loading.transition({
							scale:		0,
							opacity:	0
						}, 300, 'InBack', function(){

							$(this).remove();

						});

					}

				}, 100);

			});

			$data = null;

			if( done )
				done.apply();

		}

		// Are we already busy?
		if( ajax.page ){

			console.log('Aborting AJAX request, starting a new one');

			ajax.page.abort();

		}

		if( site.overlay ){

			clearTimeout(timer.overlay);

			getPage();

		} else {

			var footerHeight = $site.footer.height(),
				headerHeight = header ? $site.header.height() : 0;

			showOverlay({
				top:		header ? headerHeight : 0,
				height:		header ? $core.doc.height() - headerHeight - footerHeight : $core.doc.height() - footerHeight,
				opacity:	1,
				after:		function(){

					$.scrollTo({
						speed:	300
					});

					getPage();

				}
			});

			//	Add in a loading spinner if the new page takes longer than half a second to load
			timer.ajax = setTimeout(function(){

				$site.loading = buildSpinner().appendTo($core.body);

			}, 500);

		}

	}


	//
	//	USER INTERACTION
	//

	//	External links
	$core.body.on('click', 'a:external', function(e){

		if( e.which != 2 ){

			window.open( $(this).attr('href') )
			e.preventDefault();

		}

	});


	//	Keeping track of the mouse
	$core.doc.on('mousemove', function(e){

		mouse.x = e.pageX;
		mouse.y = e.pageY;

	});


	//
	//	FORM INTERACTION
	//

	$core.body.on('change', 'label.checkbox input', function(){

		var $input = $(this),
			$label = $input.closest('label');

		if( $input.is(':checked') )
			$label.addClass('checked');

		if( !$input.is(':checked') )
			$label.removeClass('checked');

		if( $input.is('input[type="radio"]') )
			$label.siblings('label.checked').removeClass('checked');

	});


	//
	//	SCROLLING
	//

	$core.win.bind('scroll',function(e){

		// Determine which element will return scrollTop properly
		site.scroll = document.documentElement.scrollTop;
		site.scroll = site.scroll == 0 ? document.body.scrollTop : site.scroll;

		// If there is a header, we need to show and hide the fixed nav
		if( header ){

			if( site.scroll <= header.height - setting.nav.compactHeight && !nav.fixed.hidden ){

				nav.fixed.hidden = true;

				updateFixedNavVisibility(true);

			}else if( site.scroll > header.height - setting.nav.compactHeight && nav.fixed.hidden ){

				nav.fixed.hidden = false;

				updateFixedNavVisibility(true);

			}

		}

		if( site.scroll <= setting.nav.trigger && nav.fixed.height != setting.nav.fullHeight ){

			if( !header ){

				nav.fixed.height = setting.nav.fullHeight;

				updateFixedNavHeight(true);

			}

		}else if( site.scroll > setting.nav.trigger && nav.fixed.height != setting.nav.compactHeight ){

			nav.fixed.height = setting.nav.compactHeight;

			updateFixedNavHeight(true);

		}

	});


	//
	//	AJAX PAGE CHANGE
	//

	if( site.history.enabled ){

		// State change event

		site.history.Adapter.bind(window, 'statechange', function(){

			site.state = site.history.getState();

			var section = site.state.hash.replace('/','').split('/'),
				section = section[0];

			var $on = $site.nav.both.find('a[href*="' + section + '"]');

			if( $on.length > 0 ){

				$on.addClass('on').siblings('.on').removeClass('on');

			}else{

				$site.nav.both.find('.on').removeClass('on');

			}

			loadPage();

		});


		// Link clicking

		$core.body.on('click', 'a:internal:not([href^="#"], [href^="mailto:"], [href^="tel:"])', function(e){

			var $a = $(this),
				url = $a.attr('href'),
				title = $a.attr('title') || null;

			site.history.pushState(null, title, url);

			e.preventDefault();

		});

	}


	//
	// 	READY? GO!
	//

	activatePage(function(){

		site.fresh = false;

	});

	//	Default tooltip style
	$('[data-tooltip]').tooltip();

});


//
//	PLUGINS
//

(function($) {

	//
	//	ARRAYIFY
	//	Converts a set of elements into an array and returns them
	//

	$.fn.arrayify = function(){

		var $items = {};

		// Find all the slides, store them in an array
		$(this).each(function(i){

			$items[i] = $(this);

		});

		return $items;

	}


	//
	//	ASIDE SLIDE
	//	Shows an aside element that has extra info about the content around it
	//

	$.fn.asideSlide = function(settings){

		// Settings
		var defaults = {
			toggle:		false,
			axis:		'x',
			openPos:	false,
			closedPos:	false,
			callback:	function(){}
		};

		// Settings
		var o = $.extend(defaults, settings);

		this.each(function(){

			// The objects involved
			var $this = $(this),
				$aside = $('aside', $this),
				$container = $aside.parent('div');

			// Set it to closed
			$this.data('open', false);

			var done = function(){

				if( !$this.data('open') )
					$container.hide();

				mouse.ban.page = false;

			}

			// The toggles
			$(o.toggle, $this).click(function(e){

				var open = $this.data('open');

				if( !mouse.ban.page ){

					mouse.ban.page = true;

					if( !open )
						$container.show();

					var value = {
						before: {},
						after:	{}
					};

					// Smart browser
					if( site.transitions ){

						value.before[o.axis] = open ? o.openPos : o.closedPos;
						value.after[o.axis] = open ? o.closedPos : o.openPos;

						$aside.css(value.before).transition(value.after,400,ease.InOutQuart,function(){

							done();

						});

					// Dumb browser
					}else{

						var key = o.axis == 'x' ? 'left' : 'top';

						value.before[key] = open ? o.openPos : o.closedPos;
						value.after[key] = open ? o.closedPos : o.openPos;

						$aside.css(value.before).animate(value.after,200,function(){

							done();

						});

					}

					o.callback(open);

					$this.data('open', !open);

				}

				e.preventDefault();

			});

		});

		return this;

	}


	//
	//	SLIDER
	//	A much simpler version of the gallery
	//

	$.fn.slider = function(settings){

		// Settings
		var defaults = {
			'slide':	'img',
			'pause':	3
		};

		// Settings
		var o = $.extend(defaults, settings);

		this.each(function(){

			// Objects
			var $this = $(this),
				$c = $('.content',$this),
				$nav = $('<nav/>');

			// Variables
			var total = $(o.slide, $this).length,
				current = 1,
				navHTML = '',
				w = $this.innerWidth();

			// Build the nav buttons
			for( i = 0; i < total; i++ ){

				navHTML += '<a href="#' + i + '"' + ( i == 0 ? ' class="on"' : '' ) + '><span>' + ( i + 1 ) + '</span></a>';

			}

			// Add the nav to the page
			$nav.html(navHTML).appendTo($this).find('a').click(function(e){

				var $a = $(this);

				if( !$a.is('.on') )
					goto($(this).attr('href').replace('#',''));

				e.preventDefault();

			});

			// Go to!
			function goto(num){

				$c.transition({
					left:	0 - ( $this.width() * num )
				}, 400, 'InOutCubic');

				$('a:eq(' + num + ')', $nav).addClass('on').siblings('.on').removeClass('on');

				current = num;

			}

		});

		return this;

	}


	//
	//	COMPARE
	//	A draggable swiping screenshot comparing plugin
	//

	$.fn.compare = function(settings){

		// Settings
		var defaults = {
			start:	'50%',
			min:	9,
			max:	91
		};

		// Settings
		var o = $.extend(defaults, settings);

		this.each(function(){

			// Objects
			var $compare = $(this)
				$overlay = $compare.children(':first'),
				$grip = $('<div/>',{
					html:	'<span class="grip"></span>'
				});

			// Functions
			var updateLeft = function(){

				return $compare.offset().left;

			}

			var setPosition = function(){

				$overlay.css({
					width:	x
				});

				$grip.css({
					left:	x
				});

			}

			// Variables
			var width = $compare.width(),
				left = updateLeft(),
				dragging = false,
				x = o.start,
				resizeTimer = false;

			// User interaction
			$core.doc.bind('mousemove mouseup', function(e){

				if( e.type == 'mouseup' )
					dragging = false;

				if( dragging ){

					x = ((mouse.x - left ) / width ) * 100;

					x = x > o.max ? o.max : x;
					x = x < o.min ? o.min : x;

					x += '%';

					setPosition();

				}

			});

			$compare.bind('mousedown', function(e){

				e.preventDefault();

			});

			$grip.bind('mousedown', function(e){

				dragging = true;

				e.preventDefault();

			});

			// Indirect interaction
			$core.win.resize(function(){

				clearTimeout(resizeTimer);

				resizeTimer = setTimeout(function(){

					left = updateLeft();

				}, 50);

			});

			// Ready? Go!
			$grip.appendTo($compare);
			setPosition();

		});

		return this;

	}


	//
	//	LOADIMG
	//	Loads an image and then returns the orignal target and the image object
	//

	$.loadImg = function(settings){

		// Settings
		var defaults = {
			'src':		false,
			'onLoad':	function(){}
		};

		// Settings
		var option = $.extend(defaults, settings);

		$('<img/>').load(function(){

			// Callback!
			option.onload($(this));

		}).attr('src', option.src);

	}


	//
	//	COOL HEADER
	//	Animated header
	//

	$.coolHeader = function(settings){

		var defaults = {
			pause:			false,						// If you set a pause, it will automatically slide
			speed:			800,						// The speed of the transition
			effect:			'slide',					// The effect - choose from slide or fade
			paralax:		8,							// Paralax multiplier
			showNav:		false,						// Show the dot navigation?
			showArrows:		false,						// Arrows left and right?
			pauseOnHover:	false,						// Show the timing bar between slides?
			beforeSlide:	function(){},				// Gets called before the slide begins to animate, returns $new and $old slides
			afterSlide:		function(){},				// Gets called after the slide has finished animating, returns $new and $old slides
			scroll:		function(){}
		}

		// Combine options & settings
		var option = $.extend(defaults, settings);

		// Objects
		var $spinner = buildSpinner().appendTo($site.header);

		// Variables
		var auto = option.pause ? true : false;

		// Functions
		var buildLinks = function(){

			var html = '';

			for ( i = 0; i <= header.total; i++ ){

				html += '<a href="#" data-slide="' + i + '">Go to slide ' + ( i + 1 ) + '</a>';

			}

			return html;

		}

		var coolScroll = function(){

			var halfHeader = header.height / 2;
				opacity = ( ( ( site.scroll - halfHeader ) * -1 ) / ( ( header.height - ( setting.nav.fullHeight * 2 ) ) - halfHeader ) ) + 1;

			if( opacity < 0 )
				opacity = 0;

			if( opacity > 1 )
				opacity = 1;

			var slidePosition = Math.round( site.scroll / option.paralax ),
				slidePosition = slidePosition < 0 ? 0 : slidePosition;

			// Position elements
			$(header.slide[header.current]).css({
				y:			0 - slidePosition
			});

			if( option.showArrows ){

				$arrowNav.css({
					y:			0 - Math.round( site.scroll / 2 ),
					opacity:	opacity
				});

			}

			if( option.showNav ){

				$dotNav.css({
					opacity:	opacity
				});

			}

			option.scroll($(header.slide[header.current]), slidePosition, opacity);

		}

		var updateArrowHrefs = function(){

			if( option.showArrows && header.total > 0 ){

				var nextSlide = header.current + 1,
					prevSlide = header.current - 1;

				// Make sure we don't go too far
				if( nextSlide > header.total )
					nextSlide = 0;

				if( prevSlide < 0 )
					prevSlide = header.total;

				$next.attr('href', $(header.slide[nextSlide]).data().href);
				$prev.attr('href', $(header.slide[prevSlide]).data().href);

			}

		}

		$.coolHeader.headerSlideTo = function(newSlide, left, callback){

			mouse.ban.header = true;

			// Make sure we don't go too far
			if( newSlide > header.total )
				newSlide = 0;

			if( newSlide < 0 )
				newSlide = header.total;

			// Find the header.current and new
			var $newSlide = $(header.slide[newSlide]),
				$oldSlide = $(header.slide[header.current]);

			// Callback
			option.beforeSlide($newSlide, $oldSlide);

			// Which direction?
			if( left == undefined )
				left = newSlide > header.current;

			// Get the header.current nav item
			if( option.showNav ){

				$dotNav.find('a').filter(function(){

					return $(this).data('slide') == newSlide;

				}).addClass('on').siblings('a.on').removeClass('on');

			}

			var done = function(){

				$oldSlide.css({
					zIndex:		10,
					x:			'0%',
					left:		0,
					marginLeft:	0
				});

				// Callback
				option.afterSlide($newSlide, $oldSlide);

				updateArrowHrefs();

				mouse.ban.header = false;

				if( callback )
					callback.call();

			}

			var animateSlide = function(){

				// Update the nav text color, if needed
				if( site.scroll < header.height / 2 ){

					nav.top.text = $newSlide.data().nav;
					updateTopNavColor();

				}

				if( option.effect == 'fade' ){

					$oldSlide.css({
						zIndex:		20
					});

					$newSlide.css({
						zIndex:		30,
						opacity:	0
					}).transition({
						opacity:	1
					}, option.speed, function(){

						done();

					});

				}else{

					$newSlide.css({
						zIndex:	20
					});

					$oldSlide.css({
						zIndex:	30
					});

					if( site.transitions ){

						$oldSlide.transition({
							x:		left ? '-100%' : '100%'
						}, option.speed, ease.inOutCubic, function(){

							done();

						});

					}else{

						$oldSlide.transition({
							left:		left ? '-100%' : '100%'
						}, option.speed, ease.inOutCubic, function(){

							done();

						});

					}

				}

			}

			// Do we need to preload?
			if( !$newSlide.data('ready') ){

				// Show a loading spinner if it takes longer than half a second
				setTimeout(function(){

					if( !$newSlide.data('ready') ){

						$spinner.css({
							left:	'50%'
						}).transition({
							opacity:	1
						}, 200, 'SmoothFade');

					}

				}, 200);

				var src = $newSlide.data().bg;

				$.loadImg({
					src:	src,
					onload:	function($img){

						$spinner.transition({
							opacity:	0
						}, 200, 'SmoothFade', function(){

							$spinner.css({
								left:	'-50%'
							});

						});

						$newSlide.data('ready', true).css({
							'background-image':	'url(' + src + ')'
						});

						if( left == 'first' ){

							$newSlide.css({
								'opacity':	0,
								'z-index':	20
							}).transition({
								'opacity':	1,
								'delay':	500
							}, 800, function(){

								// Callback
								option.afterSlide($newSlide);

								mouse.ban.header = false;

								if( callback )
									callback.call();

								if( option.pause && header.total > 0 )
									automatic();

							});

						}else{

							animateSlide();

						}

					}
				});

			}else{

				animateSlide();

			}

			header.current = newSlide;

			coolScroll();

		}

		var automatic = function(stop){

			clearTimeout(timer.header.auto);

			if( option.pause ){

				$('span', $timer).stop([]).animate({
					width:	'0%'
				}, 300, function(){

					if( !stop ){

						$(this).animate({
							width:	'100%'
						}, option.pause * 1000, 'linear');

						timer.header.auto = setTimeout(function(){

							$.coolHeader.headerSlideTo(header.current + 1, true, function(){

								automatic();

							});

						}, option.pause * 1000);

					}

				});

			}

		}

		var removeTooltip = function(){

			var $tooltip = $('span.header_tooltip', $arrowNav);

			if( $tooltip.length > 0 ){

				$tooltip.transition({
					rotate:		$tooltip.data().left ? 90 : -90,
					opacity:	0,
					delay:		100
				}, 270, 'InCubic', function(){

					$(this).remove();

				});

			}

		}

		$.coolHeader.destroy = function(){

			console.log('Removing header functionality');

			// Clear the automatic slide timer
			clearTimeout(timer.header.auto);

			// Remove the scroll event
			$core.win.off('scroll.coolHeader');

			$spinner.remove();

			// Remove the slideto function
			$.coolHeader.headerSlideTo = function(){};

			site.header.active = false;

		}


		//
		//	Create the navigation elements
		//

		if( header.total > 0 ){

			if( option.showNav ){

				// Create the dots nav
				var $dotNav = $('<nav/>',{
					'class':	'dots',
					'html':		buildLinks()
				}).appendTo($site.header);

			}

			if( option.showArrows ){

				// Create the arrows nav
				var $arrowNav = $('<nav/>',{
					'class':	'arrows'
				});

				// Next
				var $next = $('<a/>',{
					'class':	'next',
					'href':		'#'
				}).appendTo($arrowNav);

				// Previous
				var $prev = $('<a/>',{
					'class':	'prev',
					'href':		'#'
				}).appendTo($arrowNav);

				// Add it all into the header
				$arrowNav.appendTo($site.header);

				$arrowNav.css({
					height:	$site.header.height()
				});
			}

			if( option.pause ){

				// Timer bar
				var $timer = $('<span/>',{
					'class':	'timer',
					'html':		'<span></span>'
				}).appendTo($site.header);

			}

		}


		//
		//	SCROLLING
		//

		$core.win.on('scroll.coolHeader',function(e){

			// The paralax effect
			if( site.scroll < header.height ){

				coolScroll();

				if( !auto && option.pause && header.total > 0 )
					automatic();

			}else if( auto && site.scroll > header.height && option.pause && header.total > 0 ){

				automatic(stop);

			}

		});


		//
		//	INTERACTION
		//

		if( header.total > 0 ){

			if( option.showNav ){

				$('a', $dotNav).click(function(e){

					var $a = $(this);

					if( !$a.is('a.on') && !mouseBan() )
						$.coolHeader.headerSlideTo($a.data('slide'));

					e.preventDefault();

				});

			}

			if( option.showArrows ){

				$('a', $arrowNav).on('click mouseenter mouseleave', function(e){

					var $a = $(this),
						left = $a.is('.next'),
						nextSlide = left ? header.current + 1 : header.current - 1;

					// Make sure we don't go too far
					if( nextSlide > header.total )
						nextSlide = 0;

					if( nextSlide < 0 )
						nextSlide = header.total;

					var title = $(header.slide[nextSlide]).data().title;

					if( e.type == 'mouseenter' ){

						$a.addClass('hover');

						clearTimeout(timer.header.peek);

						timer.header.peek = setTimeout(function(){

							if( !site.header.peek ){

								site.header.peek = true;

								var peek = function(){

									$(header.slide[nextSlide]).css({
										zIndex:	15
									});

									if( site.transitions ){

										$(header.slide[header.current]).transition({
											x:	left ? 0 - setting.headerPeek : setting.headerPeek
										}, 200, 'OutQuint');

									}else{

										$(header.slide[header.current]).animate({
											marginLeft:	left ? 0 - setting.headerPeek : setting.headerPeek
										}, 200, 'OutQuint');

									}

								}

								var nextSlideData = $(header.slide[nextSlide]).data();

								if( !nextSlideData.ready ){

									$a.addClass('loading');

									$.loadImg({
										src:	nextSlideData.bg,
										onload:	function($img){

											$a.removeClass('loading');

											$(header.slide[nextSlide]).data('ready', true).css({
												backgroundImage:	'url(' + nextSlideData.bg + ')'
											});

											if( $a.is('.hover') )
												peek();

										}
									});

								}else{

									peek();

								}

								if( title ){

									timer.header.tooltip = setTimeout(function(){

										removeTooltip();

										var $tooltip = $('<span/>', {
											html:		title,
											'class':	'header_tooltip ' + ( left ? 'right' : 'left' )
										}).appendTo($arrowNav).data('left', left);

										$tooltip.css({
											transformOrigin:	( left ? ( $tooltip.outerWidth() + 40 ) + 'px' : '-40px' ) + ' 50%',
											rotate:				left ? -90 : 90,
											opacity:			0
										}).transition({
											rotate:				0,
											opacity:			1
										}, 270, 'OutCubic');

									}, 200);

								}

							}

						}, 200);

					}else if( e.type == 'mouseleave' ){

						var done = function(){

							site.header.peek = false;

							$(header.slide[nextSlide]).css({
								zIndex:	10
							});

							if( $a.is('.hover') ){

								$a.trigger('mouseenter');

							}

						}

						$a.removeClass('hover');

						clearTimeout(timer.header.peek);
						clearTimeout(timer.header.tooltip);

						timer.header.peek = setTimeout(function(){

							if( site.transitions ){

								$(header.slide[header.current]).transition({
									x:		0,
									delay:	200
								}, 200, 'InOutCubic', function(){

									done();

								});

							}else{

								$(header.slide[header.current]).delay(200).animate({
									marginLeft:		0
								}, 200, 'InOutCubic', function(){

									done();

								});

							}

							if( title ){

								removeTooltip();

							}

						}, 200);

					}else if( e.type == 'click' && !mouseBan() ){

						clearTimeout(timer.header.peek);
						clearTimeout(timer.header.tooltip);

						site.header.peek = false;

						var href = $a.attr('href');

						$.coolHeader.headerSlideTo(nextSlide, left, function(){

							timer.header.peek = setTimeout(function(){

								if( $a.is(':hover') ){

									$a.trigger('mouseenter');

								}

							}, 500);

							if( !site.history )
								loadPage(href);

						});

						removeTooltip();

					}

					e.preventDefault();

				});

			}

			if( option.pause && option.pauseOnHover ){

				$site.header.on('mouseenter mouseleave', function(e){

					automatic(e.type == 'mouseenter');

				});

			}

		}

		// Ready? GO!

		site.header.active = true;

		$(header.slide[header.current]).css({
			display:	'block',
			opacity:	0
		});

		$.coolHeader.headerSlideTo(header.current, 'first', function(){

			// Show all the others
			$(header.slide).show();

		});

		updateArrowHrefs();

	}


	//
	//	PAGE SCROLLING
	//

	$.scrollTo = function(settings){

		var defaults = {
			before:	function(){},
			after:	function(){},
			y:		0,
			offset:	0,
			speed:	500
		}

		// Figure out what needs doing
		if( typeof settings == 'object' ){

			var option = $.extend(defaults, settings),
				y = option.y,
				y = typeof y == 'string' ? $(y).offset().top : y,
				y = y + option.offset;

		}else{

			var option = defaults,
				y = typeof settings == 'string' ? $(y).offset().top : settings,
				y = y + option.offset;

		}



		// After we've scrolled, do this
		var done = function(){

			option.after();

			mouse.ban.page = false;
			scrolled = true;

		}

		// Ready? Go!
		mouse.ban.page = true;
		option.before();

		var scrolled = false,
			y = y ? y : 0;

		// Do we actually need to scroll?
		if( y != site.scroll ){

			$('html,body').animate({
				'scrollTop':	y
			}, option.speed, 'easeInOutExpo', function(){

				if( !scrolled )
					done();

			});

		// Nope
		}else{

			done();

		}

	}

	$.fn.scrollTo = function(settings){

		var defaults = {
			offset:	0,
			speed:	500,
			before:	function(){},
			after:	function(){}
		}

		var option = $.extend(defaults, settings);

		$core.body.on('click', this.selector, function(e){

			var $a = $(this);

			if( !mouse.ban.page ){

				option.before($a);

				var id = $a.attr('href'),
					id = id.substring(id.indexOf('#'));

				$.scrollTo({
					y:		id,
					offset:	option.offset,
					after:	function(){

						option.after($a);

					}
				});

			}

			e.preventDefault();

		});

		return this;

	}


	//
	// 	PRESENTER
	// 	A very pretty way of showing off features and assets for our websites
	//

	$.fn.presenter = function(){

		// Options
		var o = {
			slide:		'.slides > div',							// The element to slide around
			items:		'img, .browser, .text, .video, .person',	// The direct decendant items inside each slide that will be animated
			speed:		400,										// The speed for the transition
			arrows:		false,										// Adds in the quick arrow nav
			dots:		false,										// Adds in a navigation dot link for each slide
			easeIn:		'OutCubic',									// The ease-in cubic bezier
			easeOut:	'InCubic',									// The ease-out cubic bezier
			slideOut:	function(){},								// A function that returns the slide object just before it is animated away
			slideIn:	function(){}								// Same as the last one, but just before it is animated in
		};

		// The cleverrest of the clevers
		$.fn.goto = function(next, dev){

			mouse.ban.page = true;

			this.each(function(){

				// The slides we'll be working with
				var $new = $(this),
					$old = $new.siblings('div:visible');

				// The show
				function done(){

					$new.css({
						'display':	'block',
						'opacity':	0,
						'x':		next ? 100 : -100
					}).transition({
						'opacity':	1,
						'x':		0
					},o.speed,o.easeIn);

					// Animate the contents of the new slide
					$new.children(o.items).css({
						'x':	next ? '50%' : '-50%'
					}).transition({
						'x':	0
					},800,'OutCubic');

					mouse.ban.page = false;

					if( dev ){

						var gWidth = $new.closest('.slides').children('div').width();

						$new.children(o.items).each(function(){

							var $item = $(this),
								newItem = $item.data().edited == undefined && $item.css('margin-left') == '0px';

							if( newItem ){

								$item.css({
									left:		'50%',
									marginLeft:	0 - Math.round( $item.outerWidth(true) / 2 )
								});

							}else{

								var left = ( ( $item.position().left - ( $item.width() / 2 ) ) / gWidth ) * 100,
									left = ( Math.round( left * 100 ) / 100 ) + '%';

								$item.css({
									left:		left
								});

							}

						});

					}

				}

				// Is there an old one?
				if( $old.length > 0 ){

					$old.transition({
						'opacity':	0,
						'x':		next ? -100 : 100
					},o.speed,o.easeOut,function(){

						$old.hide();

						done();

					});

					// Animate the contents of the old slide
					$old.children(o.items).transition({
						'x':	next ? '-50%' : '50%'
					},800,'InCubic');

				}else{

					done();

				}

			});

			return this;

		}

		this.each(function(){

			//
			//	GO!
			//

			// Create an object where we can store the slides
			var $presenter = $(this),
				$slide = {};

			// Some variables
			var dev = $presenter.is('.dev_mode'),
				current = 0,
				total = -1;

			// Find all the slides, store them in an array
			$(o.slide, $presenter).each(function(i){

				$slide[i] = $(this);

				total++;

			});

			// Navigation
			$('.slides a', $presenter).click(function(e){

				if( !mouse.ban.page ){

					// The clicked
					var $a = $(this);

					// Get the new current
					current = $a.is('.next') ? current + 1 : current - 1;

					// Stop it going too far
					current = current > total ? 0 : current;
					current = current < 0 ? total : current;

					// Do it!
					$slide[current].goto($a.is('.next'), dev);

				}

				// Stop badness
				e.preventDefault();

			});

			if( !dev ){

				// Go to the first slide
				$slide[current].goto(true, dev);

			}else{

				//
				//	DEV MODE?
				//	Add the class of dev_mode to the process container
				//

				$core.win.load(function(){

					// Go to the first slide
					$slide[current].goto(true, dev);

					var $g = $('.slides > div', $presenter);

					var $asset = false,
						hovered = false,
						dragging = false,
						startX = 0,
						startY = 0,
						gWidth = $g.width();

					$core.win.resize(function(){
						gWidth = $g.width();
					});

					var $options = $('<div/>',{
						'class':	'options',
						'html':		'<span class="up">Up &#11014;</span> <span class="down">Down &#11015;</span> <span class="save">Save &#10004;</span>'
					}).appendTo($presenter);

					$options.on('click','.up, .down',function(){

						var action = $(this).attr('class'),
							z = parseFloat( $asset.css('z-index') );

						if( action == 'up' ){

							z = z + 1 > 20 ? 20 : z + 1;

						}else if( action == 'down' ){

							z = z - 1 < 0 ? 0 : z - 1;

						}

						$asset.css({
							'z-index':	z
						});

					}).on('click','.save',function(){

						var data = {};

						$presenter.find('.active').removeClass('active');

						$('.slides > div', $presenter).each(function(){

							var $slide = $(this);

							data[$slide.attr('class')] = {};

							$slide.children().each(function(i){

								var $this = $(this),
									name = $this.attr('class'),
									name = name.replace(' ', '.'),
									left = $this[0].style.left,
									left = left ? left : '50%';

								data[$slide.attr('class')][name] = {
									'left':			left,
									'top':			$this.css('top'),
									'margin-left':	$this.css('margin-left'),
									'z-index':		$this.css('z-index')
								};

								if( $this.is('.text') ){

									data[$slide.attr('class')][$this.attr('class')].width = $this.css('width');

								}

							});

						});


						// Build the SCSS
						var scss = '';

						for( slide in data ){

							var theSlide = data[slide];

							scss = scss + '\n.' + slide + ' {\n';

							for( asset in theSlide ){

								var theAsset = theSlide[asset];

								scss = scss + '\n	.' + asset + ' {\n';

								for( attr in theAsset ){

									scss = scss + '		' + attr + ': ' + theAsset[attr] + ';\n';

								}

								scss = scss + '	}\n';

							}

							scss = scss + '}\n'

						}

						// Spit it out
						$('<textarea/>',{
							value:	scss,
							id:		'output'
						}).appendTo($core.body).select().click(function(){
							$(this).remove();
						});

					});

					// Apply dev mode positioning
					$('.slides > div', $presenter).children('img, .browser, .text, .video, .person').on('mousedown', function(e){

						$asset = $(this);

						startX = e.pageX - $asset.position().left;
						startY = e.pageY - $asset.position().top;

						dragging = true;

						$asset.addClass('active').siblings('.active').removeClass('active');

						$asset.bind('mouseup mousemove',function(e){

							if( e.type == 'mouseup' ){

								dragging = false;

								$asset.unbind('mouseup mousemove');

								var left = getPercentage($asset.position().left);

								$asset.css({
									left:	left
								}).data('edited', true);

							}else if( e.type == 'mousemove' && dragging ){

								var x = e.pageX - startX,
									y = e.pageY - startY;

								$asset.css({
									top:	y,
									left:	x
								});

							}

							e.preventDefault();

						});

						e.preventDefault();

					});

					function getPercentage(val){

						var temp = ( val / gWidth ) * 100,
							temp = ( Math.round( temp * 1000 ) / 1000 ) + '%';

						return temp;

					}

				});

			}

		});

		return this;

	}


	//
	//	Tooltips
	//

	$.fn.tooltip = function(settings){

		if( settings == 'remove' ){

			this.each(function(){

				$('#' + $(this).data().tooltipid).remove();

			});

		}else{

			// Settings
			var defaults = {
				data:		'tooltip',
				style:		null,
				offset:		-20
			};

			// Settings
			var option = $.extend(defaults, settings);

			$core.body.on('mouseenter mouseleave', this.selector, function(e){

				var $target = $(this);

				if( e.type == 'mouseenter' ){

					var $tooltip,
						id = 'tooltip_' + new Date().getTime();
						content = $target.data(option.data);

					clearTimeout(timer.tooltip);

					timer.tooltip = setTimeout(function(){

						$target.data('tooltipid', id);

						$tooltip = $('<div/>',{
							id:			id,
							'class':	'tooltip ' + ( option.style ? option.style : '' ),
							html:		content
						}).appendTo($core.body);

						$tooltip.css({
							top:		$target.offset().top - $tooltip.outerHeight() + option.offset,
							left:		$target.offset().left + ( $target.outerWidth() / 2 ),
							marginLeft:	0 - ( $tooltip.outerWidth() / 2 )
						});

					}, 100);

				}else if( e.type == 'mouseleave' ){

					clearTimeout(timer.tooltip);

					$target.tooltip('remove');

				}

			});

		}

		return this;

	}


	//
	//	SIMPLE SELECT
	// 	Author: Will
	//

	$.fn.simpleSelect=function(e){var t={defaultText:null,ready:function(){},click:function(){},change:function(){}};var n=$.extend(t,e);return this.each(function(){var e=$(this),t="select "+(e.attr("class")?e.attr("class"):""),r=n.defaultText===null?e.find("option:selected").text():n.defaultText,i;e.wrap('<label class="'+t+'"/>');i=e.parent(".select");i.prepend("<span>"+r+"</span>");e.css({width:i.outerWidth(),height:i.outerHeight(),opacity:0}).on({change:function(){i.find("span").text(e.find("option:selected").text());n.change.apply(e)},click:function(){n.click.apply(e)},focus:function(){i.addClass("focus")},blur:function(){i.removeClass("focus")},mouseenter:function(){i.addClass("hover")},mouseleave:function(){i.removeClass("hover")}});n.ready.apply(e)})}

})(jQuery);


//
//	STALK
//

;(function(g,k){g.fn.stalk=function(t){var a=g.extend(!0,{},{top:0,bottom:0,container:null,travelDistance:null},t),d=g(k),n=d.height();return this.each(function(){function h(a){switch(a){case "above":c.css({position:"fixed",left:e.left,top:j,marginTop:0,marginLeft:0});break;case "below":c.css({position:"relative",left:"auto",top:b,marginTop:l,marginLeft:p});break;case "in":c.css({position:"static",left:"auto",top:"auto",marginTop:l,marginLeft:p,marginBottom:q})}}var c=g(this),e=c.offset(),f="",l=c.css("marginTop"),
q=c.css("marginBottom"),p=c.css("marginLeft"),j=a.top?a.top:parseInt(l,10),k=a.bottom?a.bottom:parseInt(q,10),r=e.top-j,m,b=a.travelDistance?a.travelDistance:null,s;c.add(a.container).on("resize.stalk",function(){m=c.outerHeight();null===a.travelDistance&&(a.container&&a.container.length)&&(b=e.top-a.container.offset().top,b=a.container.outerHeight()-b,b-=parseInt(a.container.css("paddingBottom"),10),b=b-m-k);f="";d.trigger("scroll.stalk")}).trigger("resize.stalk");d.on("scroll.stalk",function(){(s=
n>m&&(b&&0<b||!a.container))&&b&&d.scrollTop()+j>=e.top+b?"below"!==f&&h("below"):s&&d.scrollTop()>=r?"above"!==f&&h("above"):"in"!==f&&h("in")}).trigger("scroll.stalk").on("resize.stalk",function(){h("in");e=c.offset();r=e.top-j;f="";n=d.height();d.trigger("scroll.stalk")})})}})(jQuery,window);

//
//	Isotope custom layout
//	Corner stamp
//

$.Isotope.prototype._masonryResizeChanged = function() {

	return true;

};

$.Isotope.prototype._masonryReset = function() {

	// layout-specific props
	this.masonry = {};
	this._getSegments();
	var i = this.masonry.cols;
	this.masonry.colYs = [];
	while (i--) {
		this.masonry.colYs.push( 0 );
	}

	if ( this.options.masonry.cornerStampSelector ) {
		var $cornerStamp = this.element.find( this.options.masonry.cornerStampSelector ),
			stampWidth = $cornerStamp.outerWidth(true) - ( this.element.width() % this.masonry.columnWidth ),
			cornerCols = Math.ceil( stampWidth / this.masonry.columnWidth ),
			cornerStampHeight = $cornerStamp.outerHeight(true);
		for ( i = ( this.masonry.cols - cornerCols ); i < this.masonry.cols; i++ ) {
		this.masonry.colYs[i] = cornerStampHeight;
		}
	}
}

//
//	EXTERNAL LINKS
//

jQuery.extend( jQuery.expr[':'],{
	external: function(obj, index, meta, stack){

		return /:\/\//.test($(obj).attr('href'));

	},
	internal: function(obj, index, meta, stack){

		return !/:\/\//.test($(obj).attr('href'));

	}
});


//
//	EASING
//

jQuery.extend( jQuery.easing, {
	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	}
});


//
//	CUBIC BEZIERS
//

var ease = {

	// Cubic
	InCubic:	'cubic-bezier(.550,.055,.675,.19)',
	OutCubic:	'cubic-bezier(.215,.61,.355,1)',
	InOutCubic:	'cubic-bezier(.645,.045,.355,1)',

	// Circ
	InCirc:		'cubic-bezier(.6,.04,.98,.335)',
	OutCirc:	'cubic-bezier(.075,.82,.165,1)',
	InOutCirc:	'cubic-bezier(.785,.135,.15,.86)',

	// Expo
	InExpo:		'cubic-bezier(.95,.05,.795,.035)',
	OutExpo:	'cubic-bezier(.190,1,.22,1)',
	InOutExpo:	'cubic-bezier(1,0,0,1)',

	// Quad
	InQuad:		'cubic-bezier(.55,.085,.68,.53)',
	OutQuad:	'cubic-bezier(.25,.46,.450,.94)',
	InOutQuad:	'cubic-bezier(.455,.03,.515,.955)',

	// Quart
	InQuart:	'cubic-bezier(.895,.03,.685,.22)',
	OutQuart:	'cubic-bezier(.165,.84,.44,1)',
	InOutQuart:	'cubic-bezier(.77,0,.175,1)',

	// Quint
	InQuint:	'cubic-bezier(.755,.05,.855,.06)',
	OutQuint:	'cubic-bezier(.23,1,.320,1)',
	InOutQuint:	'cubic-bezier(.86,0,.07,1)',

	// Sine
	InSine:		'cubic-bezier(.47,0,.745,.715)',
	OutSine:	'cubic-bezier(.39,.575,.565,1)',
	InOutSine:	'cubic-bezier(.445,.05,.55,.95)',

	// Back
	InBack:		'cubic-bezier(.5,-.5,1,0)',
	OutBack:	'cubic-bezier(0,1,.5,1.5)',
	InOutBack:	'cubic-bezier(.68,-0.55,.265,1.55)',

	SmoothFade:	'cubic-bezier(.365,.005,.355,1)'
}

for( each in ease ){

	$.cssEase[each] = ease[each];

}


//
//	ANIMATION EASING
//

jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	def: 'OutQuad',
	swing: function (x, t, b, c, d) {
		//alert(jQuery.easing.default);
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	InQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	OutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	InOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	InCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	OutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	InOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	InQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	OutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	InOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	InQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	OutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	InOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	InSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	OutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	InOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	InExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	OutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	InOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	InCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	OutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	InOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	InElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	OutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	InOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	InBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	OutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	InOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	InBounce: function (x, t, b, c, d) {
		return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},
	OutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	InOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	},
	SmoothFade: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	}
});


//
//	FIX CONSOLE LOG ERROR
//

if (typeof console === "undefined" || typeof console.log === "undefined") {

	console = {};
	console.log = function(){};

}