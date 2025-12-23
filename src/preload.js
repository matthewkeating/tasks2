const { contextBridge, ipcRenderer } = require('electron/renderer');

const api = {

  // calls from MacOS application menu
  newTask: (callback) => {
    ipcRenderer.removeAllListeners('new-task');
    ipcRenderer.on('new-task', callback);
  },
  
  // settings actions
  toggleShowCompleted: (callback) => {
    ipcRenderer.removeAllListeners('toggle-show-completed');
    ipcRenderer.on('toggle-show-completed', callback);
  },
  toggleShowDeleted: (callback) => {
    ipcRenderer.removeAllListeners('toggle-show-deleted');
    ipcRenderer.on('toggle-show-deleted', callback);
  },
  
  // task actions
  toggleCompleted: (callback) => {
    ipcRenderer.removeAllListeners('toggle-completed');
    ipcRenderer.on('toggle-completed', callback);
  },
  toggleFlag: (callback) => {
    ipcRenderer.removeAllListeners('toggle-flag');
    ipcRenderer.on('toggle-flag', callback);
  },
  deleteTask: (callback) => {
    ipcRenderer.removeAllListeners('delete-task');
    ipcRenderer.on('delete-task', callback);
  },
  purgeDeletedTasks: (callback) => {
    ipcRenderer.removeAllListeners('purge-deleted-tasks');
    ipcRenderer.on('purge-deleted-tasks', callback);
  },
  
  // navigation actions
  selectNextTask: (callback) => {
    ipcRenderer.removeAllListeners('next-task');
    ipcRenderer.on('next-task', callback);
  },
  selectPreviousTask: (callback) => {
    ipcRenderer.removeAllListeners('pervious-task');
    ipcRenderer.on('pervious-task', callback);
  },
 
  // menu actions
  enableTaskMenu: () => ipcRenderer.send('enable-task-menu'),
  disableTaskMenu: () => ipcRenderer.send('disable-task-menu'),
  hideWindow: () => ipcRenderer.send('hide-window'),
  updateTrayLabels: (showingCompleted, showingDeleted) => ipcRenderer.send('update-tray-labels', { showingCompleted, showingDeleted }),

  // call for opening links externally
  openLinkExternal: (url) => ipcRenderer.send('open-link-externally', { url }),

  // call to quit the applications
  quitApp: () => ipcRenderer.send('quit-app'),

};
contextBridge.exposeInMainWorld( 'electronAPI', api );