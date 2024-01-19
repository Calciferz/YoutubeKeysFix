1.3.0:

1.2.0:
- Title text is now selectable (fix weird issues when clicking).
- Mouse wheel no longer controls the volume (and scrolls the page at the same time :-).
- ESC no longer focuses the player and scrolls to the top of the page.
- Disable focusing certain player controls: volume slider, progress bar, fine seeking bar, subtitle (removeTabStops). It was possible to focus the sliders using TAB, which resulted in the arrow keys for volume and seeking to mix in a confusing manner, creating a miserable UX.
- Minor fixes due to youtube's changing element IDs.

1.1.2: 2024
- README.md: Change wording

1.1.1: 2018
- PageUp/Down redirected to page scroll

1.1:
- tested with classicUI and materialUI on chromium: Opera, Vivaldi, Chrome, gecko: Firefox; Edge-Win10? won't test
  - in Firefox without the userscript: 'F' fails to go fullscreen if focus is outside player
- materialUI: hide focus with .no-focus-outline after clicking, show after Tab and Shift-Esc
- focus player after pageload only on watch page, not on channel page
- focusPlayer(): scroll player into view by focusing it first
- handleEsc(): check for fullscreen, don't consume event if focusPlayer failed (classicUI has this builtin)
- comment cleanup

1.0.4:
- Shift-Esc cycles focus through 3 page areas: videos, masthead (search), content below video
- Mousewheel over player ajusts volume
- Switching to fullscreen focuses the player (enables Up/Down volume control, Left/Right jump)
- player, video, comment focus is visualized (box-shadow style) on both classicUI and materialUI
- clarify capturing event handlers captureKeydown(), captureFocus(): run at earlier phase than onKeydown()
- support embedded player, cache playerElem; channel pages have a second player, that is unsupported yet and has the default behaviour
- documented shortcut behaviour and sources

1.0.3:
- added keydown handler: Esc switches focus between player and page, Space pauses anywhere on page, except textboxes
- arrow keys are redirected from sliders directly to the player, no special behaviour when progressbar/volume slider is focused
- therefore no more need to steal focus from player controls when clicked
- tabindex set for player frame and removed for .caption-window

1.0.2:
- support both classic and material design (polymer) html5 player
- allow focusing by TAB: listen for mousedown & focus events to identify focusing by mouse
- added css: translucent lightblue background for focused element to aid TABing

1.0.1:
- support classic html5 player (#movie_player element is constructed later than userscript loaded)
- also broke material design (polymer) html5 player support
- @match *://

1.0:
- support material design (polymer) html5 player
