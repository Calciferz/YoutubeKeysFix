# Youtube key shortcuts FIX
This is a userscript for web browsers
- to fix inconsistent keyboard shortcuts of youtube,
- enable volume control by mousewheel scrolling over the player,
- make Tab-navigation more user-friendly by visualizing focus on player, video list items, comments with frame shadow.

[TamperMonkey](https://tampermonkey.net/) / [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (FireFox only)  addon enables your browser to use this and other userscripts. Installing one of these is necessary.

### [Description](Description.md):
Player is focused right after pageload, no need to click in player frame.
Click outside player frame to get standard page controls: Up, Down, Left, Right (scroll)
Press Esc to focus player, Shift-Esc to cycle search box, video list, like buttons / comments.
Space pauses video on the whole webpage except textboxes.

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
