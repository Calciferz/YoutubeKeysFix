// ==UserScript==
// @name         Youtube key shortcuts FIX
// @namespace    https://github.com/Calciferz
// @downloadURL  https://github.com/Calciferz/YoutubeKeysFix/raw/master/YoutubeKeysFix.user.js
// @version      1.0.3
// @description  Fix player controls Space, Left, Right, Up, Down to behave consistently after page load or clicking individual controls. Not focusing the mute button anymore.
// @author       Calcifer
// @license      MIT
// @match        *://www.youtube.com/watch*
// @match        *://youtube.com/watch*
// @grant        none
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==
/*
Youtube player controls will work consistently after page load and after clicking controls:
- Space (play/pause), F (fullscreen), M (mute), Left (jump backwards), Right (jump forwards), Up (volume up), Down (volume down)

Press ESC to switch between player and webpage mode. PageDown also switches to webpage mode.
Click outside movie frame to get standard page controls: Space (page down), Up, Down, Left, Right (scroll)

Fixes the following awkward behaviour of Youtube player controls after clicking them (making the individual control focused):
- after clicking the mute button Space toggles mute instead of pausing
- after clicking the volume slider Left-Right will change the volume instead of stepping the video.
- after clicking subtitle button Space will toggle subtitles
- after clicking settings button Space will toggle settings
*/
/*
Changelog:
1.0.3:
     added keydown handler: ESC switches focus between player and page, SPACE pauses anywhere on page, except textboxes
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


    var playerFocused, playerFocusedSibling, pageFocusedSibling;

		function getPageFocus(oldFocus, playerElem) {
            // was the focus inside the player? (sibling of player)
            // select the last focused element outside, or the first button below the player (in #info)
            if (oldFocus !== playerElem && oldFocus !== playerFocusedSibling) {
						    playerElem.focusedSibling = playerFocusedSibling = oldFocus;
						    // this is kinda unexpected
						    console.log('Youtube keys fix: getPageFocus() saved oldFocus=', oldFocus);
						}
            // avoid body; gives focus to player, would return to the initial state
            if (pageFocusedSibling && pageFocusedSibling !== document.body)  return pageFocusedSibling;
            else  return document.getElementById('menu');
		}
		function getPlayerFocus(oldFocus, playerElem) {
            // select the last focused element in the player or the player itself
            if (oldFocus !== document.body && oldFocus !== pageFocusedSibling) {
                pageFocusedSibling= oldFocus;
						    // this is kinda unexpected
						    console.log('Youtube keys fix: getPlayerFocus() saved oldFocus=', oldFocus);
						}
            return playerFocusedSibling || playerElem;
		}

    function switchFocus(event, playerElem) {
        // event.target received the keypress -> was focused
        // If the focus was inside the player, move to page focus, otherwise move to player focus
        var newFocus=  (siblingOf(event.target, playerElem)) ?
            getPageFocus(event.target, playerElem)  :  getPlayerFocus(event.target, playerElem);
        console.log('Youtube keys fix: switchFocus=', newFocus);

        if (!newFocus)  return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        newFocus.focus();
    }

    function redirectEvent(event, playerElem) {
        //var cloneEvent= $.extend(new Event(event.type), event);
        var cloneEvent= new Event(event.type);
        cloneEvent.redirectedEvent= event;
        // shallow copy every property
        for (var k in event)  if (!(k in cloneEvent))  cloneEvent[k]= event[k];

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log('Youtube keys fix: dispatch cloneEvent=', cloneEvent);
        playerElem.dispatchEvent(cloneEvent);
    }


    function onKeydown(event) {
        // Debug log of key event
        console.log("Youtube keys fix: " + event.type + " " + event.which + " ->", event.target, event);

        var playerElem= document.getElementById('movie_player');

        // ignore TAB: do the default
        if (event.which == 9)  return;
        // ESC switches focus between player(player-container(movie_player)) and webpage outside the player(masthead(buttons)/main(related/info/meta/comments))
        if (event.which == 27)  return switchFocus(event, playerElem);
        // PageDown leaves player focus
        if (event.which == 33 && siblingOf(document.activeElement, playerElem)) {
            var newFocus= getPageFocus(document.activeElement, playerElem);
            if (newFocus) newFocus.focus();
            // event IS propagated
        }

        // Ignore events for the playerElem to avoid recursion
        //if (playerElem == document.activeElement)  return;
        if (playerElem === event.target)  return;

        var textbox= keyHandlingElements[event.target.tagName]  ||  event.target.isContentEditable;//  ||  event.target.getAttribute('role') == 'textbox';
        // Redirect Space (32) to pause video, if not in a textbox
        var redirectSpace= 32 == event.which && !textbox;
        // Sliders' key handling behaviour is inconsistent with the default player behaviour. To disable them
        // arrowkey events are redirected: Home/End/Left/Up/Right/Down (35-40) to video position/volume
        var redirectArrows= 35 <= event.which && event.which <= 40 && event.target.getAttribute('role') == 'slider' && siblingOf(event.target, playerElem);
        if (redirectSpace || redirectArrows)  return redirectEvent(event, playerElem);
    }

    // Solution from Youtube Plus: https://github.com/ParticleCore/Particle/blob/master/src/Userscript/YouTubePlus.user.js#L885
    //var arrowKeys= { home/end/left/up/right/down };
    var keyHandlingElements= { INPUT:1, TEXTAREA:1, IFRAME:1, OBJECT:1, EMBED:1 };
    var clickedElem, lastFocused;

    function onMouse(event) {
        // Called when mouse button is pressed/released over an element.
        // Debug log of mouse button event
        //console.log("Youtube keys fix: " + event.type + " ->", event.target);

        // false after released
        clickedElem= event.type == 'mousedown' && event.target;
    }

    function onFocus(event) {
        // Called when an element gets focus (by clicking or TAB)
        // Debug log of focused element
        //console.log("Youtube keys fix: " + event.type + " ->", event.target);

        var playerElem= document.getElementById('movie_player');

        // Focus player if focusing body (default focus, eg. pressing ESC)
        if  (event.target === document.body) {
            return  (playerFocusedSibling || playerElem).focus();
        }
        playerFocused= siblingOf(event.target, playerElem);
        if (playerFocused)  playerElem.focusedSibling = playerFocusedSibling = event.target;
        else  pageFocusedSibling = event.target;

        // Avoid infinite recursion of playerElem.focus() -> onFocus()
        if  (event.target === playerElem)  return;
   
        // If focused with mouseclick: mousedown event was received for the element or a sibling
        //var mouseFocused= $(clickedElem).closest(event.target)[0];
        //var mouseFocused= siblingOf(clickedElem, event.target);

        //if (lastFocused)  lastFocused.style.background= null;  lastFocused= mouseFocused && event.target;  if (lastFocused)  lastFocused.style.background= 'rgba(100, 255, 100, 0.5)';

        // Focusing the player if clicking a control is not necessary since slider key events are redirected to the player.
        //if (mouseFocused)  playerElem.focus();
    }

    function siblingOf(sibling, ancestor) {
        for (; sibling; sibling= sibling.parentElement) {
            if (sibling === ancestor)  return true;
        }
    }


    //document.addEventListener("DOMContentLoaded", function() {
    $(document).ready(function () {
        //console.log("Youtube keys fix: $(document).ready()");
        // Handlers are capture type: keydown is first to have a chance to modify the events.
        // And onFocus captures focus changes before the event is handled.
        document.addEventListener('mousedown', onMouse, true);
        document.addEventListener('mouseup', onMouse, true);
        document.addEventListener('focus', onFocus, true);
        //document.addEventListener('focusin', onFocus);
        document.addEventListener('keydown', onKeydown, true);

        //$(document.head).append('<style type="text/css">.ytp-probably-keyboard-focus :focus { background-color: rgba(120, 180, 255, 0.6) }  watch-discussion:focus { background-color: }</style>');
        $(document.head).append('<style type="text/css">.ytp-probably-keyboard-focus :focus { background-color: rgba(120, 180, 255, 0.6) }</style>');

        // Init if '#movie_player' is created.
        //var initDone= initPlayer();  if (!initDone)
    });

    function initPlayer() {
        // The movie player frame '#movie_player', might not be generated yet.
        var playerElem= document.getElementById('movie_player');
        if (!playerElem) {
            console.log("Youtube keys fix failed to find '#movie_player' element: not generated yet");
            return false;
        }

        // Movie player frame (element) is focused when loading the page to get movie player keyboard controls.
        playerElem.focus();
        playerElem.setAttribute('tabindex', 0);

        $('#movie_player .caption-window').attr('tabindex', '-1');
        //document.querySelector('#movie_player .caption-window').setAttribute('tabindex', -1);
    
        // #movie_player: ?->out-page:info/related
        // #related: left->info/meta/comments, up/down->step-scroll
        //document.getElementById('related').setAttribute('tabindex', 0);
        // #info/meta/comments: right->related, up/down->step-scroll
        // #info: right->related, up->movie_player?, down->meta
        //document.getElementById('info').setAttribute('tabindex', 0);
        // #meta: right->related, up->info, down->meta
        //document.getElementById('meta').setAttribute('tabindex', 0);
        // #comments: right->related, up->meta, up/down->step-scroll
        //document.getElementById('comments').setAttribute('tabindex', 0);
        return true;
    }

    function chainInitFunc(f1, f2) {
        return (function() {
            $(document).ready(f1);
            //if (f1)  f1.apply(this, arguments);
            if (f2)  f2.apply(this, arguments);
        });
    }

    // Run init on onYouTubePlayerReady ('#movie_player' created).
    console.log("onYouTubePlayerReady=", window.onYouTubePlayerReady);
    window.onYouTubePlayerReady= chainInitFunc(initPlayer, window.onYouTubePlayerReady);

})();


