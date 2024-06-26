# YouTube arrow keys FIX

This is a userscript for web browsers to:
- make YouTube keyboard controls (arrow keys) more intuitive,
- fix annoyances like focusing volume slider and progressbar,
- make Tab-navigation more user-friendly by highlighting focus on player buttons.

Userscript registry page:  https://greasyfork.org/en/scripts/38643-youtube-arrow-keys-fix

[Installation instructions](#installation) below.



### Features

#### YouTube player keyboard shortcuts will work consistently:
- Left,Right -> jump 5sec backwards / forwards
- Home,End -> jump to video start / end - ONLY WHEN page is scrolled to top, otherwise scrolls page
- Up,Down -> volume up / down - ONLY WHEN page is scrolled to top, otherwise scrolls page
- Can't be focused: video player, volume slider, progress bar, fine seeking bar, subtitle

#### Global keyboard shortcuts, unaffected:
- Space -> play/pause on the whole page, not only when player is focused
- K -> play/pause
- C -> toggle closed captions (subtitles)
- M -> mute
- T -> theater mode
- F -> fullscreen
- +/- -> change subtitle font size
- 0-9 -> jump to 0%-90%
- J,L -> jump 10sec backwards / forwards
- , -> previous frame (when paused)
- . -> next frame (when paused)
- Shift-, -> speed -0.25
- Shift-. -> speed +0.25
- Shift-N -> next video
- Shift-P -> previous video
- / -> focus searchfield
- ? -> show keyboard shortcuts
- ENTER -> push the focused button

#### Fixes the following awkward behaviour of YouTube player controls after clicking them (making the individual control focused):
- After clicking the progressbar Up/Down will jump in the video instead of changing the volume.
- After clicking the volume slider Left/Right will change the volume instead of jumping in the video.

#### YouTube keyboard shortcuts documentation:
- https://shortcutworld.com/Youtube-Player/win/Youtube-Player_Shortcuts
- https://www.hongkiat.com/blog/useful-youtube-keyboard-shortcuts-to-know/
- https://support.google.com/youtube/answer/7631406?hl=en
- 2010 (flash player?) - https://www.makeuseof.com/tag/comprehensive-guide-youtube-player-keyboard-shortcuts/



### Installation

Install an addon to manage userscripts, for example one of the following:
- [Violentmonkey](https://violentmonkey.github.io/)
- [FireMonkey](https://addons.mozilla.org/en-US/firefox/addon/firemonkey/) (FireFox only)
- [Tampermonkey](https://www.tampermonkey.net/)
- [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (FireFox only)

Then install the userscript from the registry:
- https://update.greasyfork.org/scripts/38643/Youtube%20key%20shortcuts%20FIX.user.js

Or install directly from this repository:
- https://github.com/Calciferz/YoutubeKeysFix/raw/main/YoutubeKeysFix.user.js

For the latest in-development version install from the [`dev`](https://github.com/Calciferz/YoutubeKeysFix/tree/dev), branch (not guaranteed to be reliable):
- https://github.com/Calciferz/YoutubeKeysFix/raw/dev/YoutubeKeysFix.user.js

