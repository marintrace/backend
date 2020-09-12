var auth0 = null;

const configureClient = async () => {
    auth0 = await createAuth0Client({
        domain: 'marintrace.us.auth0.com',
        client_id: 'rWrCmqGLtWscSLirUNufXW8p63R7xyCj',
        scope: 'openid profile email',
        audience: 'tracing-rest-api'
    }).catch(function (error) {
        //TODO - ENABLE BEFORE RELEASE
        alert("Couldn't initialize authentication");
        console.log(error);
        window.location = 'index.html'; //couldn't auth go to login
    });
}


//register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('service-worker.js').then(function (registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function (err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAb7kW9g741aeWlVXoaTaAGZvyHQe55J6Q",
    authDomain: "marintrace-7c31a.firebaseapp.com",
    databaseURL: "https://marintrace-7c31a.firebaseio.com",
    projectId: "marintrace-7c31a",
    storageBucket: "marintrace-7c31a.appspot.com",
    messagingSenderId: "932772973963",
    appId: "1:932772973963:web:90dd713cc42c2a4c2c738e",
    measurementId: "G-RQSKEVJ22B"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

function createHTTPClientInstance() {
    var token = ""
    if (typeof authToken !== "undefined") { //to prevent crashes if its null, will return unauth error instead
			token = authToken
    } else {
			alert("Couldn't verify authentication status. Please log in again.")
			document.location.href="/index.html"
		}
		console.log(token)
    return axios.create({
        baseURL: 'https://api.marintracingapp.org',
        headers: {'Content-type': 'application/json', 'Authorization': 'Bearer ' + token},
        timeout: 1000 * 10
    });
}

/*//', 'Access-Control-Allow-Credentials':true, 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': ['GET', 'POST', 'OPTIONS']*/

async function reportTest(testType) {
    const instance = createHTTPClientInstance();
    await instance.post('/test', {
        'test_type': testType
    })
        .then(function (response) {
            console.log(response);
            $('#positiveModal').modal('hide'); //close modals
            $('#negativeModal').modal('hide'); //close modals
        })
        .catch(function (error) {
            alert("Couldn't report test result. Make sure you're connected to internet and log out and log in again. If the error persists please contact us. " + error);
            console.log(error);
        })
}

async function getContacts() {
    if (localStorage.getItem("users") == null) {
        const t = createHTTPClientInstance();
        await t.get("/list/users").then(function (t) {
            console.log("Cache not found... building");
            localStorage.setItem("users", JSON.stringify(t.data.users));
        }).catch(function (t) {
            alert("Couldn't get list of potential contacts. Make sure you're connected to internet and log out and log in again. If the error persists please contact us. " + t), console.log(t)
        })
    } else {
        console.log("Using Cache...")
    }
}

async function reportContacts(targets) {
    const instance = createHTTPClientInstance()
    await instance.post('/interaction', {
        'targets': targets
    }).then(function (response) {
        document.location.href = "/home.html";
        console.log(response);
    })
        .catch(function (error) {
            alert("Couldn't report contacts. Make sure you're connected to internet and log out and log in again. If the error persists please contact us. " + error);
            console.log(error);
        })
}

async function reportSymptoms(object) {
    const instance = createHTTPClientInstance()
    instance.data = object
    await instance.post('/symptoms', object)
        .then(function (response) {
            document.location.href = "/home.html";
            console.log(response);
        })
        .catch(function (error) {
            alert("Couldn't report symptoms. Make sure you're connected to internet and log out and log in again. If the error persists please contact us. " + error);
            console.log(error);
        })
}

async function markUserAsActive() {
    const instance = createHTTPClientInstance()
    await instance.post('/set-active-user')
        .then(function (response) {
            document.location.href = "/home.html";
            console.log(response);
        })
        .catch(function (error) {
            alert("Couldn't mark you as an active user. Make sure you're connected to internet and log out and log in again. If the error persists please contact us. " + error);
            console.log(error);
        })
}


//
// Layout
//

'use strict';

var Layout = (function () {

    function pinSidenav() {
        $('.sidenav-toggler').addClass('active');
        $('.sidenav-toggler').data('action', 'sidenav-unpin');
        $('body').removeClass('g-sidenav-hidden').addClass('g-sidenav-show g-sidenav-pinned');
        $('body').append('<div class="backdrop d-xl-none" data-action="sidenav-unpin" data-target=' + $('#sidenav-main').data('target') + ' />');

        // Store the sidenav state in a cookie session
        Cookies.set('sidenav-state', 'pinned');
    }

    function unpinSidenav() {
        $('.sidenav-toggler').removeClass('active');
        $('.sidenav-toggler').data('action', 'sidenav-pin');
        $('body').removeClass('g-sidenav-pinned').addClass('g-sidenav-hidden');
        $('body').find('.backdrop').remove();

        // Store the sidenav state in a cookie session
        Cookies.set('sidenav-state', 'unpinned');
    }

    // Set sidenav state from cookie

    var $sidenavState = Cookies.get('sidenav-state') ? Cookies.get('sidenav-state') : 'pinned';

    if ($(window).width() > 1200) {
        if ($sidenavState == 'pinned') {
            pinSidenav()
        }

        if (Cookies.get('sidenav-state') == 'unpinned') {
            unpinSidenav()
        }

        $(window).resize(function () {
            if ($('body').hasClass('g-sidenav-show') && !$('body').hasClass('g-sidenav-pinned')) {
                $('body').removeClass('g-sidenav-show').addClass('g-sidenav-hidden');
            }
        })
    }

    if ($(window).width() < 1200) {
        $('body').removeClass('g-sidenav-hide').addClass('g-sidenav-hidden');
        $('body').removeClass('g-sidenav-show');
        $(window).resize(function () {
            if ($('body').hasClass('g-sidenav-show') && !$('body').hasClass('g-sidenav-pinned')) {
                $('body').removeClass('g-sidenav-show').addClass('g-sidenav-hidden');
            }
        })
    }


    $("body").on("click", "[data-action]", function (e) {

        e.preventDefault();

        var $this = $(this);
        var action = $this.data('action');
        var target = $this.data('target');


        // Manage actions

        switch (action) {
            case 'sidenav-pin':
                pinSidenav();
                break;

            case 'sidenav-unpin':
                unpinSidenav();
                break;

            case 'search-show':
                target = $this.data('target');
                $('body').removeClass('g-navbar-search-show').addClass('g-navbar-search-showing');

                setTimeout(function () {
                    $('body').removeClass('g-navbar-search-showing').addClass('g-navbar-search-show');
                }, 150);

                setTimeout(function () {
                    $('body').addClass('g-navbar-search-shown');
                }, 300)
                break;

            case 'search-close':
                target = $this.data('target');
                $('body').removeClass('g-navbar-search-shown');

                setTimeout(function () {
                    $('body').removeClass('g-navbar-search-show').addClass('g-navbar-search-hiding');
                }, 150);

                setTimeout(function () {
                    $('body').removeClass('g-navbar-search-hiding').addClass('g-navbar-search-hidden');
                }, 300);

                setTimeout(function () {
                    $('body').removeClass('g-navbar-search-hidden');
                }, 500);
                break;
        }
    })


    // Add sidenav modifier classes on mouse events

    $('.sidenav').on('mouseenter', function () {
        if (!$('body').hasClass('g-sidenav-pinned')) {
            $('body').removeClass('g-sidenav-hide').removeClass('g-sidenav-hidden').addClass('g-sidenav-show');
        }
    })

    $('.sidenav').on('mouseleave', function () {
        if (!$('body').hasClass('g-sidenav-pinned')) {
            $('body').removeClass('g-sidenav-show').addClass('g-sidenav-hide');

            setTimeout(function () {
                $('body').removeClass('g-sidenav-hide').addClass('g-sidenav-hidden');
            }, 300);
        }
    })


    // Make the body full screen size if it has not enough content inside
    $(window).on('load resize', function () {
        if ($('body').height() < 800) {
            $('body').css('min-height', '100vh');
            $('#footer-main').addClass('footer-auto-bottom')
        }
    })

})();

'use strict';

var CopyIcon = (function () {

    // Variables

    var $element = '.btn-icon-clipboard',
        $btn = $($element);


    // Methods

    function init($this) {
        $this.tooltip().on('mouseleave', function () {
            // Explicitly hide tooltip, since after clicking it remains
            // focused (as it's a button), so tooltip would otherwise
            // remain visible until focus is moved away
            $this.tooltip('hide');
        });

        var clipboard = new ClipboardJS($element);

        clipboard.on('success', function (e) {
            $(e.trigger)
                .attr('title', 'Copied!')
                .tooltip('_fixTitle')
                .tooltip('show')
                .attr('title', 'Copy to clipboard')
                .tooltip('_fixTitle');

            e.clearSelection()
        });
    }


    // Events
    if ($btn.length) {
        init($btn);
    }

})();

//
// Navbar
//

'use strict';

var Navbar = (function () {

    // Variables

    var $nav = $('.navbar-nav, .navbar-nav .nav');
    var $collapse = $('.navbar .collapse');
    var $dropdown = $('.navbar .dropdown');

    // Methods

    function accordion($this) {
        $this.closest($nav).find($collapse).not($this).collapse('hide');
    }

    function closeDropdown($this) {
        var $dropdownMenu = $this.find('.dropdown-menu');

        $dropdownMenu.addClass('close');

        setTimeout(function () {
            $dropdownMenu.removeClass('close');
        }, 200);
    }


    // Events

    $collapse.on({
        'show.bs.collapse': function () {
            accordion($(this));
        }
    })

    $dropdown.on({
        'hide.bs.dropdown': function () {
            closeDropdown($(this));
        }
    })

})();


//
// Navbar collapse
//


var NavbarCollapse = (function () {

    // Variables

    var $nav = $('.navbar-nav'),
        $collapse = $('.navbar .navbar-custom-collapse');


    // Methods

    function hideNavbarCollapse($this) {
        $this.addClass('collapsing-out');
    }

    function hiddenNavbarCollapse($this) {
        $this.removeClass('collapsing-out');
    }


    // Events

    if ($collapse.length) {
        $collapse.on({
            'hide.bs.collapse': function () {
                hideNavbarCollapse($collapse);
            }
        })

        $collapse.on({
            'hidden.bs.collapse': function () {
                hiddenNavbarCollapse($collapse);
            }
        })
    }

    var navbar_menu_visible = 0;

    $(".sidenav-toggler").click(function () {
        if (navbar_menu_visible == 1) {
            $('body').removeClass('nav-open');
            navbar_menu_visible = 0;
            $('.bodyClick').remove();

        } else {

            var div = '<div class="bodyClick"></div>';
            $(div).appendTo('body').click(function () {
                $('body').removeClass('nav-open');
                navbar_menu_visible = 0;
                $('.bodyClick').remove();

            });

            $('body').addClass('nav-open');
            navbar_menu_visible = 1;

        }

    });

})();

//
// Popover
//

'use strict';

var Popover = (function () {

    // Variables

    var $popover = $('[data-toggle="popover"]'),
        $popoverClass = '';


    // Methods

    function init($this) {
        if ($this.data('color')) {
            $popoverClass = 'popover-' + $this.data('color');
        }

        var options = {
            trigger: 'focus',
            template: '<div class="popover ' + $popoverClass + '" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
        };

        $this.popover(options);
    }


    // Events

    if ($popover.length) {
        $popover.each(function () {
            init($(this));
        });
    }

})();

//
// Scroll to (anchor links)
//

'use strict';

var ScrollTo = (function () {

    //
    // Variables
    //

    var $scrollTo = $('.scroll-me, [data-scroll-to], .toc-entry a');


    //
    // Methods
    //

    function scrollTo($this) {
        var $el = $this.attr('href');
        var offset = $this.data('scroll-to-offset') ? $this.data('scroll-to-offset') : 0;
        var options = {
            scrollTop: $($el).offset().top - offset
        };

        // Animate scroll to the selected section
        $('html, body').stop(true, true).animate(options, 600);

        event.preventDefault();
    }


    //
    // Events
    //

    if ($scrollTo.length) {
        $scrollTo.on('click', function (event) {
            scrollTo($(this));
        });
    }

})();

//
// Tooltip
//

'use strict';

var Tooltip = (function () {

    // Variables

    var $tooltip = $('[data-toggle="tooltip"]');


    // Methods

    function init() {
        $tooltip.tooltip();
    }


    // Events

    if ($tooltip.length) {
        init();
    }

})();

//
// Form control
//

'use strict';

var FormControl = (function () {

    // Variables

    var $input = $('.form-control');


    // Methods

    function init($this) {
        $this.on('focus blur', function (e) {
            $(this).parents('.form-group').toggleClass('focused', (e.type === 'focus'));
        }).trigger('blur');
    }


    // Events

    if ($input.length) {
        init($input);
    }

})();

//
// Form control
//

'use strict';

var noUiSlider = (function () {

    // Variables


    if ($(".input-slider-container")[0]) {
        $('.input-slider-container').each(function () {

            var slider = $(this).find('.input-slider');
            var sliderId = slider.attr('id');
            var minValue = slider.data('range-value-min');
            var maxValue = slider.data('range-value-max');

            var sliderValue = $(this).find('.range-slider-value');
            var sliderValueId = sliderValue.attr('id');
            var startValue = sliderValue.data('range-value-low');

            var c = document.getElementById(sliderId),
                d = document.getElementById(sliderValueId);

            noUiSlider.create(c, {
                start: [parseInt(startValue)],
                connect: [true, false],
                //step: 1000,
                range: {
                    'min': [parseInt(minValue)],
                    'max': [parseInt(maxValue)]
                }
            });

            c.noUiSlider.on('update', function (a, b) {
                d.textContent = a[b];
            });
        })
    }

    if ($("#input-slider-range")[0]) {
        var c = document.getElementById("input-slider-range"),
            d = document.getElementById("input-slider-range-value-low"),
            e = document.getElementById("input-slider-range-value-high"),
            f = [d, e];

        noUiSlider.create(c, {
            start: [parseInt(d.getAttribute('data-range-value-low')), parseInt(e.getAttribute('data-range-value-high'))],
            connect: !0,
            range: {
                min: parseInt(c.getAttribute('data-range-value-min')),
                max: parseInt(c.getAttribute('data-range-value-max'))
            }
        }), c.noUiSlider.on("update", function (a, b) {
            f[b].textContent = a[b]
        })
    }

})();

//
// Scrollbar
//

'use strict';

var Scrollbar = (function () {

    // Variables

    var $scrollbar = $('.scrollbar-inner');


    // Methods

    function init() {
        $scrollbar.scrollbar().scrollLock()
    }


    // Events

    if ($scrollbar.length) {
        init();
    }

})();
