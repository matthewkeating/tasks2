var _sidebarShown = false;

export function showSidebar() {
  window.electronAPI.showSidebar();
  _sidebarShown = true;
}

export function hideSidebar() {
  window.electronAPI.hideSidebar();
  _sidebarShown = false;
}

export function isShown() {
  return _sidebarShown;
}

function registerRightClickAndDrag() {

  // window level handling of right click drag
  let rightClickDragging = false;
  let startX = 0;
  let startY = 0;

  // right click drag
  window.addEventListener("mousedown", (event) => {
    if (event.target.classList.contains("task-title-is-editing")) return;

    if (event.button == 2) {  // 2 is a right click
      rightClickDragging = true;
      startX = event.clientX;
      startY = event.clientY;
    }
  });

  // right click drag
  window.addEventListener('mousemove', (event) => {
    if (!rightClickDragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    // Live drag info: dx > 0 means moving right
  });

  // right click drag
  window.addEventListener('mouseup', (event) => {

    if (event.button !== 2 || !rightClickDragging)  // 2 is a right click
      return;  
    
    rightClickDragging = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    const THRESHOLD = 50;
    const mostlyHorizontal = Math.abs(dx) > Math.abs(dy);

    if (mostlyHorizontal && dx > THRESHOLD) {
      // Right-click drag right detected
      showSidebar();
    } else if (mostlyHorizontal && dx < -THRESHOLD) {
      // Right-click drag left detected
      hideSidebar();
    }

  }); 

}

function registerTwoFingerSwipe() {

  let accumX = 0;
  window.addEventListener('wheel', (e) => {
    // Trackpad swipes typically have small, continuous deltaX
    accumX += e.deltaX;
    if (Math.abs(accumX) > 100) {
      accumX > 0 ? hideSidebar() : showSidebar();
      accumX = 0;
    }
  }, { passive: true });

}

function registerHotKeys() {

  window.addEventListener("keydown", event => {
    if (event.metaKey && event.shiftKey && event.code === "Period") {
      event.preventDefault(); // optional: stop browser default behavior
      showSidebar();
    }
    if (event.metaKey && event.shiftKey && event.code === "Comma") {
      event.preventDefault(); // optional: stop browser default behavior
      hideSidebar();
    }
  });

}

/*
 * This fuction binds/registers:
 *   - Right click and drag
 *   - Two finger swipe (on Mac)
 * that allows user to show/hide the sidebar
 */
export function registerGesturesAndHotKeys() {

  registerRightClickAndDrag();
  registerTwoFingerSwipe();
  registerHotKeys();

}