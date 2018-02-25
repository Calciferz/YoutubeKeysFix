/* To test classicUI add to url:
&disable_polymer=1
?disable_polymer=1
*/
// ==UserScript==
// @name         Youtube key shortcuts FIX
// @namespace    https://github.com/Calciferz
// @downloadURL  https://github.com/Calciferz/YoutubeKeysFix/raw/master/YoutubeKeysFix.user.js
// @version      1.0.4
// @description  Fix player controls Space, Left, Right, Up, Down to behave consistently after page load or clicking individual controls. Not focusing the mute button anymore.
// @author       Calcifer
// @license      MIT
// @copyright    2023, Calcifer (https://github.com/Calciferz)
// @match        *://*.youtube.com/*
// @exclude      *://*.youtube.com/tv*
// @exclude      *://*.youtube.com/live_chat*
// @grant        none
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==
/*
Player is focused right after pageload, no need to click in player frame.
Click outside movie frame to get standard page controls: Up, Down, Left, Right (scroll)
Press Esc to focus player, Shift-Esc to cycle other areas.
Space pauses video on the whole webpage except textboxes

Youtube player controls will work consistently when player is focused:
- Left / Right (5sec backwards / forwards), Up / Down (volume up / down), Home (restart video), End (skip to end)
  After clicking (focusing) progressbar/volume slidebars this is no longer changed: in progressbar Up / Down (jump 10 sec), in volume Left / Right (volume down / up)
- 0-9 (jump to 0%-90%), C (switch closed captions/subtitles), +/- (change cc font size)  --  unaffected

Global shortcuts:
- Esc (exit fullscreen)  --  now additionally focuses player when not in fullscreen
- Space (play/pause)  --  now on whole page, not only when player is focused
Global shortcuts, unaffected:
- F (fullscreen), M (mute)
- K (play/pause)
- J / L (10sec backwards / forwards)
- , (previous frame), . (next frame)
- Shift-, (speed -0.25), Shift-. (speed +0.25)
- Shift-N (next video), Shift-P (previous video)
- / (focus searchfield, only in classic ui)
- ENTER (push the focused button)

Fixes the following awkward behaviour of Youtube player controls after clicking them (making the individual control focused):
- after clicking the mute button Space toggles mute instead of pausing
- after clicking the progressbar Up/Down will jump 10 sec in the video instead of changing the volume
- after clicking the volume slider Left/Right will change the volume instead of jumping the video.
- after clicking subtitle button Space will toggle subtitles
- after clicking settings button Space will toggle settings

Sources of youtube shortcut behaviour:
https://shortcutworld.com/Youtube-Player/win/Youtube-Player_Shortcuts
https://www.hongkiat.com/blog/useful-youtube-keyboard-shortcuts-to-know/
https://support.google.com/youtube/answer/7631406?hl=en
2010: flash player?  https://www.makeuseof.com/tag/comprehensive-guide-youtube-player-keyboard-shortcuts/
*/
/*
Changelog:
1.0.4:
		 Shift-Esc cycles focus through 3 page areas: videos, masthead (search), content below video
		 Mousewheel over player ajusts volume
		 Switching to fullscreen focuses the player (enables Up/Down volume control, Left/Right jump)
     player, video, comment focus is visualized (box-shadow style) on both classicUI and materialUI
     clarify capturing event handlers captureKeydown(), captureFocus(): run at earlier phase than onKeydown()
		 support embedded player, cache playerElem; channel pages have a second player, that is unsupported yet and has the default behaviour
		 documented shortcut behaviour and sources
1.0.3:
     added keydown handler: Esc switches focus between player and page, Space pauses anywhere on page, except textboxes
     arrow keys are redirected from sliders directly to the player, no special behaviour when progressbar/volume slider is focused
     therefore no more need to steal focus from player controls when clicked
     tabindex set for player frame and removed for .caption-window
1.0.2:
     support both classic and material design (polymer) html5 player
     allow focusing by TAB: listen for mousedown & focus events to identify focusing by mouse
     added css: translucent lightblue background for focused element to aid TABing
1.0.1:
     support classic html5 player (#movie_player element is constructed later than userscript loaded)
     also broke material design (polymer) html5 player support
     @match *://
1.0: support material design (polymer) html5 player
*/

// Debug log
//console.log("Youtube keys fix: loaded");

(function () {
    'use strict';


    var playerContainer;  // = document.getElementById('player-container') || document.getElementById('player') in embeds
    var playerElem;  // = document.getElementById('movie_player') || playerContainer.querySelector('.html5-video-player') in embeds
    //var playerFocused;
    var isMaterialUI, isClassicUI;
    var lastFocusedPageArea;
    var areaOrder= [ null ], areaContainers= [ null ], areaFocusDefault= [ null ], areaFocusedSubelement= [ null ];
    //var areaContainers= {}, areaFocusedSubelement= {};

    function isSubelementOf(elementWithin, ancestor) {
        if (!ancestor)  return null;
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
        if (!newFocus.length)  return null;
        if (!newFocus.is(':visible()'))  return false;
        //var oldFocus= document.activeElement;
        newFocus.focus();
        // document.activeElement is not updated yet?
        //console.log('Youtube keys fix: new activeElement=', document.activeElement);
        return true;
        /*
				var done= (document.activeElement !== document.body && (document.activeElement !== oldFocus || oldFocus === newFocus));
        if (done)  console.log('Youtube keys fix: focused', document.activeElement);
        else  console.log('Youtube keys fix: failed to focus', newFocus);
        return done;
				*/
    }

    function focusNextArea() {
        // Focus next area's areaFocusedSubelement (activeElement)
        var currentArea= getFocusedArea() || 0;
        var nextArea= (lastFocusedPageArea && lastFocusedPageArea !== currentArea) ? lastFocusedPageArea : currentArea + 1;
        // captureFocus() will store lastFocusedPageArea again if moving to a non-player area
        // if moving to the player then lastFocusedPageArea resets, Shift-Esc willmove to movie list (2)
        lastFocusedPageArea= null;
        // To enter player at end of round: nextArea= 1;  To skip player: nextArea= 2;
        if (nextArea >= areaContainers.length)  nextArea= 2;

        var done= tryFocus( areaFocusedSubelement[nextArea] );
        if (!done)  done= tryFocus( $(areaFocusDefault[nextArea]) );
        //if (!done)  done= tryFocus( areaContainers[nextArea] );
    }

    function focusAreaDefaultElement() {
        // Reset focus to area's default
        var area= getFocusedArea();
        // If not in area then focus player
        if (area === 0)  area= 1;

        var done= tryFocus( $(areaFocusDefault[area]) );
        if (!done)  done= tryFocus( document.getElementById(areaContainers[area]) );
        if (!done && area !== 1)  done= tryFocus( $(areaFocusDefault[1]) );
    }

    function focusPlayer() {
        // Reset focus to player if focus is inside player area
        // Focus player's areaFocusedSubelement if outside
        var done= (getFocusedArea() !== 1) && tryFocus( areaFocusedSubelement[1] );
        if (!done)  done= tryFocus( $(areaFocusDefault[1]) );
    }

    function handleEsc(event) {
        event.preventDefault();
        event.stopPropagation();
        // Shift-Esc resets page focus to watch next video
        if (event.shiftKey)  focusNextArea();
        //else if (??)  focusAreaDefaultElement();
        else  focusPlayer();

        // Show that focus indicator blue frame and background
        $(playerElem).addClass('ytp-probably-keyboard-focus');
        // Show focus border - it shows by default after pressing Tab
        //$(document.documentElement).removeClass('no-focus-outline');
    }

    function onKeydown(event) {
        // Debug log of key event
        //if (event.key != 'Shift')  console.log("Youtube keys fix: " + event.type + " " + event.which + " ->", event.target, event);

        // Esc switches focus between player(player-api/player-container(movie_player)) and webpage outside the player(masthead(buttons)/main(related/info/meta/comments))
        // event.target is focused (received the keypress)
        // onKeydown not executed when fullscreen, and this should not handle Esc
        if (event.which == 27)  return handleEsc(event);
    }


    function redirectEvent(event, cloneEvent) {
        if (!playerElem)  initPlayer();
        if (!playerElem || !$(playerElem).is(':visible()'))  return;
        //var cloneEvent= $.extend(new Event(event.type), event);
        cloneEvent= cloneEvent || new Event(event.type);
        cloneEvent.redirectedEvent= event;
        // shallow copy every property
        for (var k in event)  if (!(k in cloneEvent))  cloneEvent[k]= event[k];

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        //console.log('Youtube keys fix: dispatch cloneEvent=', cloneEvent);
        playerElem.dispatchEvent(cloneEvent);
    }

    // Solution from Youtube Plus: https://github.com/ParticleCore/Particle/blob/master/src/Userscript/YouTubePlus.user.js#L885
    //var arrowKeys= { home/end/left/up/right/down };
    var keyHandlingElements= { INPUT:1, TEXTAREA:1, IFRAME:1, OBJECT:1, EMBED:1 };

    function captureKeydown(event) {
        // Debug log of key event
        //if (event.key != 'Shift')  console.log("Youtube keys fix: capture " + event.type + " " + event.which + " ->", event);  //, event);

        // Esc switches focus between player(player-api/player-container(movie_player)) and webpage outside the player(masthead(buttons)/main(related/info/meta/comments))
        // event.target is focused (received the keypress)
        // captureKeydown not executed when fullscreen, and this should not handle Esc
        var textbox= keyHandlingElements[event.target.tagName]  ||  event.target.isContentEditable;//  ||  event.target.getAttribute('role') == 'textbox';
        // capture only in textboxes to override their behaviour, general handling in onKeydown()
        if (event.which == 27 && textbox)  return handleEsc(event);

        // TAB: do the default
        //if (event.which == 9)  return;

        // Ignore events for the playerElem to avoid recursion
        //if (playerElem == document.activeElement)  return;
        if (playerElem === event.target)  return;

        // Redirect Space (32) to pause video, if not in a textbox
        var redirectSpace= 32 == event.which && !textbox;
        // Sliders' key handling behaviour is inconsistent with the default player behaviour. To disable them
        // arrowkey events are redirected: Home/End/Left/Up/Right/Down (35-40) to video position/volume
        var redirectArrows= 35 <= event.which && event.which <= 40 && event.target.getAttribute('role') == 'slider' && isSubelementOf(event.target, 'player');
        if (redirectSpace || redirectArrows)  return redirectEvent(event);
    }


    function captureMouse(event) {
        // Called when mouse button is pressed/released over an element.
        // Debug log of mouse button event
        console.log("Youtube keys fix: capture " + event.type + " ->", event.target);
    }


    function redirectFocus(event, newFocus) {
        if (!newFocus)  return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        //console.log('Youtube keys fix: redirect focus=', newFocus);
        newFocus.focus();
    }

    function onMouse(event) {
        // Called when mouse button is pressed/released over an element.
        // Debug log of mouse button event
        //console.log("Youtube keys fix: " + event.type + " ->", event.target);

        // click outside of areas focuses player
        if (0 === getAreaOf(event.target))  return redirectFocus(event, playerElem);
    }

    function onWheel(event) {
        //console.log("Youtube keys fix: " + event.type + " " + event.deltaY + " phase " + event.eventPhase + " ->", event.currentTarget, event);
        if (!playerElem.contains(event.target))  return;
        var deltaY= null !== event.deltaY ? event.deltaY : event.wheelDeltaY;
        /*
        if (!playerElem || !playerElem.setVolume || !playerElem.getVolume)  return;
        //var videoElem= playerElem.querySelector('video');
        //if (event.target !== videoElem)  return;

        var sign= Math.sign(deltaY);
        var newVol= playerElem.getVolume() * 100 - (sign * 5);
        console.log("Youtube keys fix: " + event.type + " set volume " + newVol, event);
        playerElem.setVolume(newVol);
				*/

        var up= deltaY <= 0;		// null == 0 -> up
        var cloneEvent= new Event('keydown');
        cloneEvent.which= cloneEvent.keyCode= up ? 38 : 40;
        cloneEvent.key= up ? 'ArrowUp': 'ArrowDown';
        redirectEvent(event, cloneEvent);
    }

    function onFullscreen(event) {
        if (document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
            if (getFocusedArea() !== 1) {
                onFullscreen.prevFocus= document.activeElement;
                focusPlayer();
            }
        } else if (onFullscreen.prevFocus) {
            onFullscreen.prevFocus.focus();
            onFullscreen.prevFocus= null;
        }
    }

    function captureFocus(event) {
        // Called when an element gets focus (by clicking or TAB)
        // Debug log of focused element
        //console.log("Youtube keys fix: capture " + event.type + " ->", event.target);

        // Window will focus the activeElement, do nothing at the moment
        if (event.target === window)  return;

        // Focus player if focusing body (default focus, eg. pressing Esc)
        if (event.target === document.body)  return redirectFocus(event, areaFocusedSubelement[1] || playerElem);

        // Cycle back focus when stepping out of player (Tab) -- not only for Tab, causes unexpected behaviour
        //var newPlayerFocused= isSubelementOf(event.target, playerElem);
        //if (playerFocused && !newPlayerFocused && areaFocusedSubelement[1] != playerElem)  return redirectFocus(event, playerElem);
        // areaFocusedSubelement[1] == playerElem: Shift-Tab would get stuck on the player, todo: find last element to focus
        // -> $(playerElem).select('[tabindex][tabindex!=-1]').last()

        // Save focused element inside player or on page
        var area= getAreaOf(event.target);
        //if (0 === area)  return redirectFocus(event, playerElem);
        if (0 !== area) {
            areaFocusedSubelement[area]= event.target;
            //if (areaContainers[area])  document.getElementById(areaContainers[area]).activeElement= event.target;
            // store if not focusing player area
            if (area !== 1)  lastFocusedPageArea= area;
        }
    }



    function chainInitFunc(f1, f2) {
        return (function() {
            $(document).ready(f1);
            //if (f1)  f1.apply(this, arguments);
            if (f2)  f2.apply(this, arguments);
        });
    }

    // Run init on onYouTubePlayerReady ('#movie_player' created).
    //console.log("onYouTubePlayerReady=", window.onYouTubePlayerReady);
    window.onYouTubePlayerReady= chainInitFunc(initPlayer, window.onYouTubePlayerReady);
    initEvents();
    initStyle();
    initDom();

    //document.addEventListener("DOMContentLoaded", function() {
    $(document).ready(function () {
        //console.log("Youtube keys fix: $(document).ready()");
        // Init if '#movie_player' is created.
				//initDom();
        initPlayer();
    });

    function initEvents() {
        // Handlers are capture type to see all events before they are consumed
        //document.addEventListener('mousedown', captureMouse, true);
        //document.addEventListener('mouseup', captureMouse, true);
        // captureFocus captures focus changes before the event is handled
        document.addEventListener('focus', captureFocus, true);		// does not capture body.focus() in Opera, material design
        //window.addEventListener('focusin', captureFocus);
        // captureKeydown is run before original handlers to have a chance to modify the events
        document.addEventListener('mousedown', onMouse);
        // mousewheel on player adjusts volume
        document.addEventListener('wheel', onWheel, true);
        document.addEventListener('keydown', captureKeydown, true);
        // onKeydown handles keypress in the bubbling phase to handle Esc.
        document.addEventListener('keydown', onKeydown);
        if (document.onwebkitfullscreenchange !== undefined)  document.addEventListener('webkitfullscreenchange', onFullscreen);
        if (document.onmozfullscreenchange !== undefined)  document.addEventListener('mozfullscreenchange', onFullscreen);
        if (document.MSFullscreenChange !== undefined)  document.addEventListener('MSFullscreenChange', onFullscreen);
    }

    function initStyle() {
        // Style for materialUI player, video list item, comment highlight:
        // #masthead-container is present on all materialUI pages: index, watch, etc.
        if (document.getElementById('masthead'))  $(document.head).append('<style name="yt-fix-materialUI type="text/css">\n\
html:not(.no-focus-outline) #player-container:focus-within { box-shadow: 0 0 20px 0px rgba(0,0,0,0.8); }\n\
.ytp-probably-keyboard-focus :focus { background-color: rgba(120, 180, 255, 0.6); }\n\
html:not(.no-focus-outline) ytd-video-primary-info-renderer #container:focus-within, \n\
html:not(.no-focus-outline) ytd-video-secondary-info-renderer #container:focus-within { box-shadow: 0 0 10px 0px rgba(0,0,0,0.4); }\n\
html:not(.no-focus-outline) ytd-comment-renderer:focus-within { box-shadow: 0 0 10px 0px rgba(0,0,0,0.3); }\n\
html:not(.no-focus-outline) ytd-compact-video-renderer #dismissable:focus-within { box-shadow: 0 0 15px 1px rgba(0,0,100,0.4); }\n\
a.yt-simple-endpoint.ytd-compact-video-renderer { margin-top: 3px; }\n\
</style>');

        // Style for classicUI player, video list item, comment-simplebox highlight and layout rearranging for the highlight:
        // #yt-masthead-container is present on all classicUI pages: index, watch, etc.
        if (document.getElementById('yt-masthead-container'))  $(document.head).append('<style name="yt-fix-classicUI" type="text/css">\n\
#player-api:focus-within { box-shadow: 0 0 20px 0px rgba(0,0,0,0.8); }\n\
.ytp-probably-keyboard-focus :focus { background-color: rgba(120, 180, 255, 0.6); }\n\
html:not(.no-focus-outline) #masthead-search-terms.masthead-search-terms-border:focus-within { border: 1px solid #4d90fe; box-shadow: inset 0px 0px 10px 2px #4d90fe; }\n\
html:not(.no-focus-outline) #watch-header:focus-within, \n\
html:not(.no-focus-outline) #action-panel-details:focus-within { box-shadow: 0 0 10px 0px rgba(0,0,0,0.4); }\n\
#watch-discussion { padding: 10px; }\n\
.comments-header-renderer { padding: 5px; }\n\
.comment-simplebox-renderer:focus-within .comment-simplebox-renderer-collapsed-content, \
.comment-simplebox-renderer:focus-within .comment-simplebox-frame { border-width: 3px; }\n\
.comment-simplebox-renderer:focus-within .comment-simplebox-arrow .arrow-inner { left: 7px; top: 3px; }\n\
.comment-section-sort-menu { margin-bottom: 10px; }\n\
.yt-alert-naked.yt-alert.zero-step-tooltip { margin-top: 20px; }\n\
html:not(.no-focus-outline) .comment-renderer:focus-within { box-shadow: 0 0 10px 0px rgba(0,0,0,0.3); }\n\
.comment-thread-renderer { margin: 0 0 25px 0; }\n\
.comment-renderer { padding: 5px; }\n\
.comment-renderer-content { position: relative; }\n\
.comment-replies-renderer .comment-renderer/*, .comment-replies-renderer .feedback-banner*/ { margin: 2px 0; }\n\
.comment-replies-renderer-view, .comment-replies-renderer-hide { margin: 1px 0 7px 5px; }\n\
.comment-replies-renderer-paginator { margin-top: 1px; margin-left: 5px; }\n\
html:not(.no-focus-outline) .video-list-item:focus-within { box-shadow: 0 0 15px 1px rgba(0,0,100,0.4); }\n\
html:not(.no-focus-outline) .video-list-item:focus-within .related-item-action-menu .yt-uix-button { opacity: 1; }\n\
html:not(.no-focus-outline) .video-list-item:focus-within .video-actions { right: 2px; }\n\
html:not(.no-focus-outline) .video-list-item:focus-within .video-time, \n\
html:not(.no-focus-outline) .related-list-item:focus-within .video-time-overlay { right: -60px; }\n\
#watch7-sidebar-contents { padding-right: 10px; }\n\
#watch7-sidebar-contents .checkbox-on-off { margin-right: 5px; }\n\
#watch7-sidebar .watch-sidebar-head { margin-bottom: 5px; margin-left: 0; }\n\
#watch7-sidebar .watch-sidebar-section { padding-left: 5px; margin-bottom: 0; }\n\
#watch7-sidebar .watch-sidebar-separation-line { margin: 10px 5px; }\n\
.video-list-item .thumb-wrapper { margin: 0; }\n\
.video-list-item { margin-left: 5px; }\n\
.video-list-item .content-wrapper a { padding-top: 3px; min-height: 91px; }\n\
.related-list-item .content-wrapper { margin-left: 176px; margin-right: 5px; }\n\
.related-list-item .related-item-action-menu { top: 3px; right: 0; }\n\
.related-item-dismissable .related-item-action-menu .yt-uix-button { margin: 0; height: 20px; width: 20px; }\n\
</style>');
    }

    function initDom() {
        // @match        *://*.youtube.com/embed/*
        isMaterialUI= (null != document.getElementById('masthead'));
        isClassicUI= (null != document.getElementById('yt-masthead-container'));
				// with MaterialUI there is a leftover, emptied #player-api element
        playerContainer= isMaterialUI ? document.getElementById('player-container') : isClassicUI ? document.getElementById('player-api') : document.getElementById('player');
        // isEmbeddedUI= !isMaterialUI && !isClassicUI;

        // Areas' root elements
        areaOrder= [ null, 'player', 'masthead', 'videos', 'content' ];
        areaContainers= isMaterialUI ? [ null, 'player', 'masthead-container', 'related', 'main' ]
        : [ null, 'player', 'yt-masthead-container', 'watch7-sidebar', 'watch7-content' ];
        /*
        areaOrder= [ null, 'player', 'videos', 'masthead', 'title', 'description', 'comments' ];
        areaContainers[1]= areaContainers.player= playerContainer;
        areaContainers[2]= areaContainers.masthead= document.getElementById('masthead-container') || document.getElementById('yt-masthead-container');
        areaContainers[3]= areaContainers.videos= document.getElementById('related') || document.getElementById('watch7-sidebar');
        areaContainers[4]= areaContainers.content= document.getElementById('main') || document.getElementById('watch7-content');
        areaContainers.length= 5;
        areaContainers[4]= areaContainers.title= document.getElementById('info') || document.getElementById('watch-header');
        areaContainers[5]= areaContainers.description= document.getElementById('meta') || document.getElementById('action-panel-details');
        areaContainers[6]= areaContainers.comments= document.getElementById('comments') || document.getElementById('watch-discussion');
        areaContainers.length= 7;
        */

        // Areas' default element to focus
        areaFocusDefault[0]= null;
        areaFocusDefault[1]= isMaterialUI || isClassicUI ? '#movie_player' : '#player .html5-video-player';
        areaFocusDefault[2]= isMaterialUI ? '#masthead input#search' : '#masthead-search-term';
        areaFocusDefault[3]= isMaterialUI ? '#items a.ytd-compact-video-renderer:first()' : '#watch7-sidebar-modules a.content-link:first()';
        areaFocusDefault[4]= isMaterialUI ? '#info #menu #top-level-buttons button:last()' : '#watch8-action-buttons button:first()';
        /*
        areaFocusDefault[5]= isMaterialUI ? '#meta paper-button:visible():last()' : '#action-panel-details button:visible():last()';
        areaFocusDefault[6]= isMaterialUI ? '#comments #header #sort-menu paper-button:first()' : '#watch-discussion .comment-section-sort-menu button:first()';
        */
        areaFocusDefault.length= 5;
    }

    function initPlayer() {
        if (playerElem)  return;

        // The movie player frame '#movie_player', might not be generated yet.
        playerElem= document.getElementById('movie_player') || $('#player .html5-video-player')[0];
        if (!playerElem) {
            console.log("Youtube keys fix failed to find '#movie_player' element: not created yet");
            return false;
        }

        //console.log("Youtube keys fix: initPlayer()");
        // Movie player frame (element) is focused when loading the page to get movie player keyboard controls.
        playerElem.focus();

        $('#player .caption-window').attr('tabindex', '-1');
        //var caption= playerElem.querySelector && playerElem.querySelector('.caption-window');  if (caption)  caption.setAttribute('tabindex', -1);
    }

})();


