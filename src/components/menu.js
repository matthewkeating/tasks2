const { clipboard, Menu, shell } = require('electron/main');

// initialize menu settings object
let menuSettings = {
  "showing-completed": false,
  "showing-deleted": false,
  "window-active": false
};

function updateMenuSettings(setting, value) {
  menuSettings[setting] = value;
}

function showHideTasks(mainWindow) {
  if (mainWindow.isVisible()) {
    // hide window
    mainWindow.hide();
  } else {
    // show window
    mainWindow.show();
    mainWindow.focus();
  }
}

function createMenuTemplate(mainWindow) {

  // Set dynamic labels
  let showHideTasksAppLabel = 'Show Tasks';
  if (menuSettings["window-active"]) {
    showHideTasksAppLabel = 'Hide Tasks App';
  }

  let showHideCompletedTasksLabel = "Show Completed Tasks";
  if (menuSettings["showing-completed"]) {
    showHideCompletedTasksLabel = "Hide Completed Tasks";
  }

  let showHideDeletedTasksLabel = "Show Deleted Tasks";
  if (menuSettings["showing-deleted"]) {
    showHideDeletedTasksLabel = 'Hide Deleted Tasks';
  }

  let menuTemplate = [

    {
      label: showHideTasksAppLabel,
      click: () => {
        showHideTasks(mainWindow);
      },
      accelerator: 'CmdOrCtrl+Shift+\'',
    },
    { type: 'separator' },
    {
      id: 'view-menu',
      label: 'View',
      visible: true,
      submenu: [
        {
          id: 'toggle-show-completed',
          label: showHideCompletedTasksLabel,
          click: () => {
            mainWindow.webContents.send('toggle-show-completed');
          },
          accelerator: 'CmdOrCtrl+Shift+C',
        },
        {
          id: 'toggle-show-deleted',
          label: showHideDeletedTasksLabel,
          click: () => {
            mainWindow.webContents.send('toggle-show-deleted');
          },
          accelerator: 'CmdOrCtrl+Shift+D',
        }
      ]
    },
    { type: 'separator' },
    {
      id: 'task-menu',
      label: 'Task',
      visible: true,
      submenu: [
        {
          label: 'New Task',
          click: () => {
            mainWindow.webContents.send('new-task');
          },
          accelerator: 'CmdOrCtrl+N',
        },
        { type: 'separator' },
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        {
          label: 'Paste as Plain Text',
          accelerator: 'CmdOrCtrl+Shift+V',
          click: (menuItem, browserWindow) => {
            if (browserWindow) {
              const text = clipboard.readText(); // Grabs text without formatting
              browserWindow.webContents.insertText(text); // Inserts at cursor
            }
          }
        },
        { role: 'selectall' },
        { type: 'separator' },
        {
          id: 'task-toggle-complete',
          label: 'Toggle Completed',
          click: () => {
            mainWindow.webContents.send('toggle-completed');
          },
          accelerator: 'CmdOrCtrl+Shift+K',
        },
        {
          id: 'task-toggle-flag',
          label: 'Toggle Flag',
          click: () => {
            mainWindow.webContents.send('toggle-flag');
          },
          accelerator: 'CmdOrCtrl+Shift+F',
        },
        { type: 'separator' },
        {
          id: 'task-next-task',
          label: 'Next Task',
          click: () => {
            mainWindow.webContents.send('next-task');
          },
          accelerator: 'CmdOrCtrl+Shift+]',
        },
        {
          id: 'task-previous-task',
          label: 'Previous Task',
          click: () => {
            mainWindow.webContents.send('previous-task');
          },
          accelerator: 'CmdOrCtrl+Shift+[',
        },
        { type: 'separator' },
        {
          id: 'task-delete-task',
          label: 'Delete Task',
          click: () => {
            mainWindow.webContents.send('delete-task');
          },
          accelerator: 'CmdOrCtrl+Backspace',
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Purge Deleted Tasks',
      click: () => {
        mainWindow.webContents.send('purge-deleted-tasks');
      },
    },
    { type: 'separator' },
    {
      id: 'dev-tools',
      label: 'Developer Tools',
      visible: true,
      submenu: [
        {
          role: 'reload',
          accelerator: 'CmdOrCtrl+R',
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Option+I',
          click: () => {
              mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    { type: 'separator' },
    { role: 'about' },
    {
      label: 'View Read Me (on GitHub)...',
      click: () => {
        shell.openExternal("https://github.com/matthewkeating/tasks2");
      },
    },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ];

  return menuTemplate;

}

module.exports = { createMenuTemplate, showHideTasks, updateMenuSettings };
