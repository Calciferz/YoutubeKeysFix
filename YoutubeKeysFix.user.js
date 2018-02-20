// ==UserScript==
// @name         Youtube key shortcuts FIX
// @namespace    https://github.com/Calciferz
// @downloadURL  https://github.com/Calciferz/YoutubeKeysFix/raw/master/YoutubeKeysFix.user.js
// @version      1.0.2
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

Click outside movie frame to get standard page controls: Space (page down), Up, Down, Left, Right (scroll)

Fixes the following awkward behaviour of Youtube player controls after clicking them (making the individual control focused):
- after clicking the mute button Space toggles mute instead of pausing
- after clicking the volume slider Left-Right will change the volume instead of stepping the video.
- after clicking subtitle button Space will toggle subtitles
- after clicking settings button Space will toggle settings
*/
/*
Changelog:
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
var lastFocused, mouseDownElem;


(function () {
    function initPlayer() {
        'use strict';
        
        // The movie player frame '#movie_player', might not be generated yet.
        var playerElem= document.getElementById('movie_player');
        if (playerElem) {
            // Movie player frame (element) is focused when loading the page to get movie player keyboard controls.
            playerElem.focus();
            $(playerElem).attr('tabindex', 1);
            $(playerElem).select('.caption-window').attr('tabindex', -1);
            return true;
        } else {
            console.log("Youtube keys fix failed to find '#movie_player' element: not generated yet");
        }
    }
    
    
    function onMouse(event) {
        // While bubbling, event is sent for all parent elements, only handle the first event sent for the child.
        if (event.target !== event.currentTarget)  return;
        
        // Debug feedback on mouse button event
        console.log("Youtube keys fix: " + event.type + " ->", event.currentTarget);
        
        // false after released
        mouseDownElem= event.type == 'mousedown' && event.target;
    }
    
    function onFocus(event) {
        // While bubbling, event is sent for all parent elements, only handle the first event sent for the child.
        if (event.target !== event.currentTarget)  return;
        
        // Called when a sub-element of the player gets focus (by clicking or TAB). 
        var playerElem= document.getElementById('movie_player');
        // Avoid infinite recursion of playerElem.focus() -> onFocus()
        if  (event.target === playerElem)  return;
        
        //var stealFocus= $(mouseDownElem).closest(event.target)[0];
        var stealFocus= ancestorOf(mouseDownElem, event.target);
        
        // Debug feedback on last focused element
        console.log("Youtube keys fix: " + event.type + " ->", event.currentTarget);
        if (lastFocused)  lastFocused.style.background= null;  lastFocused= stealFocus && event.target;  if (lastFocused)  lastFocused.style.background= 'rgba(100, 255, 100, 0.5)';
        
        // Focus the player if focusing the element receiving the mousedown event
        if (stealFocus)  playerElem.focus();
    }
    
    function ancestorOf(sibling, ancestor) {
        while (sibling) {
            if (sibling === ancestor)  return true;
            sibling= sibling.parentElement;
        }
    }
    
    
    function chainFunc(f1, f2) {
        return (function() {
            if (f1)  f1.apply(this, arguments);
            if (f2)  f2.apply(this, arguments);
        });
    }
    
    //document.addEventListener("DOMContentLoaded", function() {
    $(document).ready(function () {
        //console.log("Youtube keys fix: $(document).ready()");
        // Requires jquery for .on('focusin', ...).  addEventListener('focusin', ...), addEventListener('focus', ..., true) failed to work in chromium-based Vivaldi
        // '#player-api' is part of html source and always available, while its child '#movie_player' is generated by javascript
        var onElem= '#player-api';
        //var onElem= '#movie_player';
        var selector= '#movie_player *';
        //var selector= '*';
        $(document).on('mousedown', selector, onMouse);
        $(document).on('mouseup', selector, onMouse);
        $(document).on('focus', '*', onFocus);
        
        $(document.head).append('<style type="text/css">:focus { background-color: rgba(120, 180, 255, 0.6) }</style>');
        
        // Init if '#movie_player' is created.
        var initDone= initPlayer();
        // Run init on onYouTubePlayerReady if '#movie_player' not yet created.
        if (!initDone)  window.onYouTubePlayerReady= chainFunc(initPlayer, window.onYouTubePlayerReady);
    });

})();


