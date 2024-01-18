// ==UserScript==
// @name         YouTube arrow keys FIX
// @version      1.3.0
// @description  Fix YouTube keyboard controls (arrow keys) to be more consistent (Left,Right - jump, Up,Down - volume) after page load or clicking individual controls.
// @author       Calcifer
// @license      MIT
// @namespace    https://github.com/Calciferz
// @homepageURL  https://github.com/Calciferz/YoutubeKeysFix
// @supportURL   https://github.com/Calciferz/YoutubeKeysFix/issues
// @downloadURL  https://github.com/Calciferz/YoutubeKeysFix/raw/main/YoutubeKeysFix.user.js
// @icon         http://youtube.com/yts/img/favicon_32-vflOogEID.png
// @include      https://*.youtube.com/*
// @include      https://youtube.googleapis.com/embed*
// @grant        none
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

/* eslint-disable  no-multi-spaces */
/* eslint-disable  no-multi-str */


(function () {
    'use strict';

    var playerContainer;  // = document.getElementById('player-container') || document.getElementById('player') in embeds
    var playerElem;  // = document.getElementById('movie_player')
    var isEmbeddedUI;
    var subtitleObserver;
    var subtitleContainer;

    var lastFocusedPageArea;
    var areaOrder= [ null ],
        areaContainers= [ null ],
        areaFocusDefault= [ null ],
        areaFocusedSubelement= [ null ];



    function formatElemIdOrClass(elem) {
      return   elem.id ?  '#' + elem.id
      : elem.className ?  '.' + elem.className.replace(' ', '.')
      : elem.tagName;
    }

    function formatElemIdOrTag(elem) {
      return   elem.id ?  '#' + elem.id
      : elem.tagName;
    }

    function isSubelementOf(elementWithin, ancestor) {
        if (! ancestor)  return null;
        for (; elementWithin; elementWithin= elementWithin.parentElement) {
            if (elementWithin.id == ancestor)  return true;
        }
        return false;
    }

    function getAreaOf(elementWithin) {
        for (var i= 1; i<areaContainers.length; i++)  if (isSubelementOf(elementWithin, areaContainers[i]))  return i;
        return 0;
        //for (var area in areaContainers)  if (isSubelementOf(document.activeElement, areaContainers[area]))  return area;
    }
    function getFocusedArea() { return getAreaOf(document.activeElement); }

    function tryFocus(newFocus) {
        newFocus= $(newFocus);
        if (! newFocus.length)  return null;
        if (! newFocus.is(':visible()'))  return false;
        //var oldFocus= document.activeElement;
        newFocus.focus();
        var done= (newFocus[0] === document.activeElement);
        if (! done)  console.error("[YoutubeKeysFix]  tryFocus():  Failed to focus newFocus=", [newFocus[0]], "activeElement=", [document.activeElement]);
        return done;
    }

    function focusNextArea() {
        // Focus next area's areaFocusedSubelement (activeElement)
        var currentArea= getFocusedArea() || 0;
        var nextArea= (lastFocusedPageArea && lastFocusedPageArea !== currentArea) ? lastFocusedPageArea : currentArea + 1;
        // captureFocus() will store lastFocusedPageArea again if moving to a non-player area
        // if moving to the player then lastFocusedPageArea resets, Shift-Esc will move to search bar (area 2)
        lastFocusedPageArea= null;
        // To enter player after last area: nextArea= 1;  To skip player: nextArea= 2;
        if (nextArea >= areaContainers.length)  nextArea= 2;

        var done= tryFocus( areaFocusedSubelement[nextArea] );
        if (! done)  done= tryFocus( $(areaFocusDefault[nextArea]) );
        //if (! done)  done= tryFocus( areaContainers[nextArea] );
        return done;
    }


    function redirectEvent(event, cloneEvent) {
        if (! playerElem)  initPlayer();
        if (! playerElem || ! $(playerElem).is(':visible()'))  return;
        cloneEvent= cloneEvent || new Event(event.type);
        //var cloneEvent= $.extend(cloneEvent, event);
        cloneEvent.redirectedEvent= event;
        // shallow copy every property
        for (var k in event)  if (! (k in cloneEvent))  cloneEvent[k]= event[k];

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        //console.log("[YoutubeKeysFix]  redirectEvent():  type=" + cloneEvent.type, "key='" + cloneEvent.key + "' from=", [event.target, event, cloneEvent]);
        playerElem.dispatchEvent(cloneEvent);
    }


    function handleShiftEsc(event) {
        // Shift-Esc only implemented for watch page
        if (window.location.pathname !== "/watch")  return;
        // Not in fullscreen
        if (getFullscreen())  return;
        // Bring focus to next area
        focusNextArea();
        event.preventDefault();
        event.stopPropagation();
    }


    // Tag list from YouTube Plus: https://github.com/ParticleCore/Particle/blob/master/src/Userscript/YouTubePlus.user.js#L885
    var keyHandlingElements= { INPUT:1, TEXTAREA:1, IFRAME:1, OBJECT:1, EMBED:1 };

    function onKeydown(event) {
        // Debug log of key event
        //if (event.key != 'Shift')  console.log("[YoutubeKeysFix]  onKeydown():  type=" + event.type, "key='" + event.key + "' target=", [event.target, event]);

        // Space -> pause video except when writing a comment - Youtube takes care of this
    }


    function captureKeydown(event) {
        // Debug log of key event
        //if (event.key != 'Shift')  console.log("[YoutubeKeysFix]  captureKeydown():  type=" + event.type, "key='" + event.key + "' target=", [event.target, event]);

        let keyCode = event.which;

        // Shift-Esc -> cycle through search box, videos, comments
        // Event is not received when fullscreen in Opera (already handled by browser)
        if (keyCode == 27 && event.shiftKey) {
          return handleShiftEsc(event);
        }

        // Ignore events for the playerElem to avoid recursion
        //if (playerElem == document.activeElement)  return;
        if (playerElem === event.target)  return;

        // Sliders' key handling behaviour is inconsistent with the default player behaviour
        // Redirect arrow keys (33-40: PageUp,PageDown,End,Home,Left,Up,Right,Down) to page scroll/video player (position/volume)
        var redirectArrows= 33 <= event.which && event.which <= 40 && event.target.getAttribute('role') == 'slider' && isSubelementOf(event.target, playerElem.id);
        if (redirectArrows)  return redirectEvent(event);
    }


    function captureMouse(event) {
        // Called when mouse button is pressed/released over an element.
        // Debug log of mouse button event
        //console.log("[YoutubeKeysFix]  captureMouse():  type=" + event.type, "button=" + event.button, "target=", [event.target, event]);
    }


    function onMouse(event) {
        // Called when mouse button is pressed over an element.
        // Debug log of mouse button event
        //console.log("[YoutubeKeysFix]  onMouse():  type=" + event.type, "button=" + event.button, "target=", [event.target, event]);
    }

    function onWheel(event) {
        //console.log("[YoutubeKeysFix]  onWheel():  deltaY=" + Math.round(event.deltaY), "phase=" + event.eventPhase, "target=", [event.currentTarget, event]);
        if (! playerElem || ! playerElem.contains(event.target))  return;

        var deltaY= null !== event.deltaY ? event.deltaY : event.wheelDeltaY;
        var up= deltaY <= 0;    // null == 0 -> up
        var cloneEvent= new Event('keydown');
        cloneEvent.which= cloneEvent.keyCode= up ? 38 : 40;
        cloneEvent.key= up ? 'ArrowUp': 'ArrowDown';
        redirectEvent(event, cloneEvent);
    }

    function getFullscreen() {
        return document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    }

    function onFullscreen(event) {
        var fullscreen= getFullscreen();
        if (fullscreen) {
            if ( !fullscreen.contains(document.activeElement) ) {
                onFullscreen.prevFocus= document.activeElement;
                fullscreen.focus();
            }
        } else if (onFullscreen.prevFocus) {
            onFullscreen.prevFocus.focus();
            onFullscreen.prevFocus= null;
        }
    }

    function captureFocus(event) {
        // Called when an element gets focus (by clicking or TAB)
        // Debug log of focused element
        //console.log("[YoutubeKeysFix]  captureFocus():  target=", [event.target, event]);

        // Window will focus the activeElement, do nothing at the moment
        if (event.target === window)  return;

        // Save focused element inside player or on page
        var area= getAreaOf(event.target);
        if (0 !== area) {
            areaFocusedSubelement[area]= event.target;
            //if (areaContainers[area])  document.getElementById(areaContainers[area]).activeElement= event.target;
            // store if not focusing player area
            if (area !== 1)  lastFocusedPageArea= area;
        }
    }



    function initEvents() {
        // Handlers are capture type to see all events before they are consumed
        document.addEventListener('mousedown', captureMouse, true);
        //document.addEventListener('mouseup', captureMouse, true);

        // captureFocus captures focus changes before the event is handled
        // does not capture body.focus() in Opera, material design
        document.addEventListener('focus', captureFocus, true);
        //window.addEventListener('focusin', captureFocus);

        document.addEventListener('mousedown', onMouse);
        // mousewheel over player area adjusts volume
        // Passive event handler can call preventDefault() on wheel events to prevent scrolling the page
        //document.addEventListener('wheel', onWheel, { passive: false, capture: true });

        // captureKeydown is run before original handlers to capture key presses before the player does
        document.addEventListener('keydown', captureKeydown, true);
        // onKeydown handles Tab in the bubbling phase after other elements (textbox, button, link) got a chance.
        document.addEventListener('keydown', onKeydown);

        if (document.onfullscreenchange !== undefined)  document.addEventListener('fullscreenchange', onFullscreen);
        else if (document.onwebkitfullscreenchange !== undefined)  document.addEventListener('webkitfullscreenchange', onFullscreen);
        else if (document.onmozfullscreenchange !== undefined)  document.addEventListener('mozfullscreenchange', onFullscreen);
        else if (document.MSFullscreenChange !== undefined)  document.addEventListener('MSFullscreenChange', onFullscreen);
    }


    function initStyle() {
        let s= document.createElement('style');
        s.name= 'YoutubeKeysFix-styles';
        s.type= 'text/css';
        s.textContent= `

#player-container:focus-within { box-shadow: 0 0 20px 0px rgba(0,0,0,0.8); }

/* Highlight focused button in player */
.ytp-probably-keyboard-focus :focus {
  background-color: rgba(120, 180, 255, 0.6);
}

        `;
        document.head.appendChild(s);
    }


    function initDom() {

        // Area names
        areaOrder= [
            null,
            'player',
            'header',
            'videos',
            'comments',
        ];

        // Areas' root elements
        areaContainers= [
            null,
            'player-container',    // player
            'masthead-container',  // header
            'related',   // videos
            'sections',  // comments
        ];

        // Areas' default element to focus
        areaFocusDefault= [
            null,
            '#movie_player',           // player
            '#masthead input#search',  // header
            '#items a.ytd-compact-video-renderer:first()',   // videos
            '#info #menu #top-level-buttons button:last()',  // comments
        ];
    }


    function initPlayer() {
        // Path (on page load):  body  >  ytd-app  >  div#content  >  ytd-page-manager#page-manager
        // Path (created 1st step):  >  ytd-watch-flexy.ytd-page-manager  >  div#full-bleed-container  >  div#player-full-bleed-container
        // Path (created 2nd step):  >  div#player-container  >  ytd-player#ytd-player  >  div#container  >  div#movie_player.html5-video-player  >  html5-video-container
        // Path (created 3rd step):  >  video.html5-main-video

        // The movie player frame #movie_player is not part of the initial page load.
        playerElem= document.getElementById('movie_player');
        if (! playerElem) {
            console.error("[YoutubeKeysFix]  initPlayer():  Failed to find #movie_player element: not created yet");
            return false;
        }

        if (previousPlayerReadyCallback) {
            try { previousPlayerReadyCallback.call(arguments); }
            catch (err) { console.error("[YoutubeKeysFix]  initPlayer():  Original onYouTubePlayerReady():", previousPlayerReadyCallback, "threw error:", err); }
            previousPlayerReadyCallback = null;
        }

        isEmbeddedUI= playerElem.classList.contains('ytp-embed');

        playerContainer= document.getElementById('player-container')  // full-bleed-container > player-full-bleed-container > player-container > ytd-player > container > movie_player
          || isEmbeddedUI && document.getElementById('player');  // body > player > movie_player.ytp-embed

        console.log("[YoutubeKeysFix]  initPlayer():  player=", [playerElem]);

        // Movie player frame (element) is focused when loading the page to get movie player keyboard controls.
        if (window.location.pathname === "/watch")  playerElem.focus();

        removeTabStops();
    }

    // Disable focusing certain player controls: volume slider, progress bar, fine seeking bar, subtitle.
    // It was possible to focus these using TAB, but the controls (space, arrow keys)
    // change in a confusing manner, creating a miserable UX.
    // Maybe this is done for accessibility reasons? The irony...
    // Youtube should have rethought this design for a decade now.
    function removeTabStops() {
        //console.log("[YoutubeKeysFix]  removeTabStops()");

        function removeTabIndexWithSelector(rootElement, selector) {
            for (let elem of rootElement.querySelectorAll(selector)) {
                console.log("[YoutubeKeysFix]  removeTabIndexWithSelector():", "tabindex=", elem.getAttribute('tabindex'), [elem]);
                elem.removeAttribute('tabindex');
            }
        }

        // Remove tab stops from progress bar
        //removeTabIndexWithSelector(playerElem, '.ytp-progress-bar[tabindex]');
        removeTabIndexWithSelector(playerElem, '.ytp-progress-bar');

        // Remove tab stops from fine seeking bar
        //removeTabIndexWithSelector(playerElem, '.ytp-fine-scrubbing-container [tabindex]');
        //removeTabIndexWithSelector(playerElem, '.ytp-fine-scrubbing-thumbnails[tabindex]');
        removeTabIndexWithSelector(playerElem, '.ytp-fine-scrubbing-thumbnails');

        // Remove tab stops from volume slider
        //removeTabIndexWithSelector(playerElem, '.ytp-volume-panel[tabindex]');
        removeTabIndexWithSelector(playerElem, '.ytp-volume-panel');

        // Remove tab stops of non-buttons and links (inclusive selector)
        //removeTabIndexWithSelector(playerElem, '[tabindex]:not(button):not(a):not(div.ytp-ce-element)');

        // Make unfocusable all buttons in the player
        //removeTabIndexWithSelector(playerElem, '[tabindex]');

        // Make unfocusable all buttons in the player controls (bottom bar)
        //removeTabIndexWithSelector(playerElem, '.ytp-chrome-bottom [tabindex]');
        //removeTabIndexWithSelector(playerElem.querySelector('.ytp-chrome-bottom'), '[tabindex]');

        // Remove tab stops from subtitle element when created
        function mutationHandler(mutations, observer) {
            for (let mut of mutations) {
                //console.log("[YoutubeKeysFix]  mutationHandler():\n", mut);  // spammy
                //removeTabIndexWithSelector(mut.target, '.caption-window[tabindex]');
                removeTabIndexWithSelector(mut.target, '.caption-window');

                if (subtitleContainer)  continue;
                subtitleContainer = playerElem.querySelector('#ytp-caption-window-container');
                // If subtitle container is created
                if (subtitleContainer) {
                    console.log("[YoutubeKeysFix]  mutationHandler():  Subtitle container created, stopped observing #movie_player", [subtitleContainer]);
                    // Observe subtitle container instead of movie_player
                    observer.disconnect();
                    observer.observe(subtitleContainer, { childList: true });
                }
            }
        }

        // Subtitle container observer setup
        // #movie_player > #ytp-caption-window-container > .caption-window
        subtitleContainer = playerElem.querySelector('#ytp-caption-window-container');
        if (!subtitleObserver && window.MutationObserver) {
            subtitleObserver = new window.MutationObserver( mutationHandler );
            // Observe movie_player because subtitle container is not created yet
            subtitleObserver.observe(subtitleContainer || playerElem, { childList: true, subtree: !subtitleContainer });
        }
    }


    console.log("[YoutubeKeysFix]  loading:  onYouTubePlayerReady=", window.onYouTubePlayerReady);
    // Run initPlayer() on onYouTubePlayerReady (#movie_player created)
    let previousPlayerReadyCallback = window.onYouTubePlayerReady;
    window.onYouTubePlayerReady = initPlayer;
    //let playerReadyPromise = new Promise( function(resolve, reject) { window.onYouTubePlayerReady = resolve; } );
    //playerReadyPromise.then( previousPlayerReadyCallback ).then( initPlayer );

    //initPlayer();
    initDom();
    initEvents();
    initStyle();


})();

