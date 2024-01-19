
// Query tab stops (elements with tabindex) in #movie_player
let elems=$$('#movie_player [tabindex]')
let tabindexList= elems.map( e=>e.tagName + (!e.id ? "" : "#"+e.id) + (!e.classList.length ? "" : "." + Array.from(e.classList).join('.')) + '    tabindex= ' + e.getAttribute('tabindex') ).join('\n') + '\n' )
copy( tabindexList );



// Log every focus change to console
function FocusWatcher() {
  let self={}; self.last=null; self.update = function update(e) {
    if (self.last !== document.activeElement) { self.last=document.activeElement; console.log("[FocusWatcher]  activeElement=", [self.last, e??"no event"]) }
  }
  document.addEventListener('focus', self.update, true)
  self.interval=setInterval(self.update, 300);
  self.stop = function stop() { document.removeEventListener('focus', self.update); clearInterval(self.interval) }
  return self;
}
var focusWatcher = FocusWatcher();

