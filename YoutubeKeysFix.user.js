// ==UserScript==
// @name         Youtube player control keys FIX
// @namespace    https://github.com/Calciferz
// @version      1.0
// @description  Fix player controls Space, Left, Right, Up, Down to behave consistently after page load or clicking individual controls. Not focusing the mute button anymore.
// @author       Calcifer
// @license      MIT
// @match        https://www.youtube.com/watch*
// @match        http://www.youtube.com/watch*
// @match        https://youtube.com/watch*
// @match        http://youtube.com/watch*
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

(function() {
    'use strict';

    // Movie player frame (element) is focused after loading the page to get movie player keyboard controls.
    document.getElementById('movie_player').focus();
    
    function onFocus(event) {
        // Called when a sub-element of the player gets focus (by clicking or TAB). 
        var playerElem= document.getElementById('movie_player');
        // avoid infinite recursion of playerElem.focus() -> onFocus()
        if  (event.target == playerElem)  return;
        //console.log(event.type + ' ->', event.target);
        // Focus the player to have proper keyboard controls
        playerElem.focus();
    }

    // '.ytp-chrome-bottom' has all the controls that should delegate focus to the player instead of getting focused themselves
    $('#movie_player .ytp-chrome-bottom').on('focusin', onFocus);
    // If there are other controls outside '.ytp-chrome-bottom', use the following instead:
    //$('#movie_player').on('focusin', onFocus);
})();
