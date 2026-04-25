export let showingCompleted = JSON.parse(localStorage.getItem("show_completed")) || false;
export let showingDeleted = JSON.parse(localStorage.getItem("show_deleted")) || false;
export var sidebarVisibility = JSON.parse(localStorage.getItem("sidebar_visibility")) || "sidebar-in";

export function restoreDefaultSettings() {
  setShowingCompleted(false);
  setShowingDeleted(false);
  setSidebarVisibility("sidebar-in");
}

function setShowingCompleted(value) {
  showingCompleted = value;
  localStorage.setItem("show_completed", showingCompleted);
}

export function setSidebarVisibility(value) {
  sidebarVisibility = value;
  localStorage.setItem("sidebar_visibility", JSON.stringify(sidebarVisibility));
}

export function toggleShowCompleted() {
  showingCompleted = !showingCompleted;
  localStorage.setItem("show_completed", showingCompleted);
}

function setShowingDeleted(value) {
  showingDeleted = value;
  localStorage.setItem("show_deleted", showingDeleted);
}

export function toggleShowDeleted() {
  showingDeleted = !showingDeleted;
  localStorage.setItem("show_deleted", showingDeleted);
}