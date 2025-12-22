export var showingCompleted = JSON.parse(localStorage.getItem("show_completed")) || false;
export var showingDeleted = JSON.parse(localStorage.getItem("show_deleted")) || false;

export function restoreDefaultSettings() {
  setShowingCompleted(false);
  setShowingDeleted(false);
}

function setShowingCompleted(value) {
  showingCompleted = value;
  localStorage.setItem("show_completed", showingCompleted);
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