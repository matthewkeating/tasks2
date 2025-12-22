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

// Because the hot keys associated with toggle complete and delete task are
// global hot keys on Mac, they must be suppressed when a task is not selected.
// The functions below use the enabled (or disabled) menu items as a proxy
// for a task being selected.
function toggleComplete(mainWindow) {
  if (Menu.getApplicationMenu().getMenuItemById('task-toggle-complete').enabled) {
    mainWindow.webContents.send('toggle-completed');
  }
}
function deleteTask(mainWindow) {
  if (Menu.getApplicationMenu().getMenuItemById('task-delete-task').enabled) {
    mainWindow.webContents.send('delete-task');
  }
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

function createMenuTemplate(mainWindow, forTray) {

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
    },
    { type: 'separator' },
    {
      id: 'task-menu',
      label: 'Task',
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
          enabled: false,
          click: () => {
            toggleComplete();
          },
          accelerator: 'CmdOrCtrl+Shift+O',
        },
        {
          id: 'task-toggle-flag',
          label: 'Toggle Flag',
          enabled: false,
          click: () => {
            mainWindow.webContents.send('toggle-flag');
          },
          accelerator: 'CmdOrCtrl+Shift+F',
        },
        { type: 'separator' },
        {
          id: 'task-next-task',
          label: 'Next Task',
          enabled: false,
          click: () => {
            mainWindow.webContents.send('next-task');
          },
          accelerator: 'CmdOrCtrl+Shift+]',
        },
        {
          id: 'task-previous-task',
          label: 'Previous Task',
          enabled: false,
          click: () => {
            mainWindow.webContents.send('pervious-task');
          },
          accelerator: 'CmdOrCtrl+Shift+[',
        },
        { type: 'separator' },
        {
          id: 'task-delete-task',
          label: 'Delete Task',
          enabled: false,
          click: () => {
            deleteTask();
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
      submenu: [
        { role: 'reload' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Option+I', // Optional shortcut
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

  // remove the 'Task' and 'Developer' menus from the tray menu
  // note: do this because I don't want the 'Task' and 'Developer' menu in the tray but I do
  // want them in the application menu (because I want the hot keys)
  if (forTray) {
    const taskMenuIndex = menuTemplate.findIndex(item => item.id === 'task-menu');

    if (taskMenuIndex !== -1) {
      menuTemplate.splice(taskMenuIndex, 1);  // remove the 'Task' menu
      menuTemplate.splice(taskMenuIndex, 1);  // remove the separator after the 'Task' menu
    }

    const devToolsIndex = menuTemplate.findIndex(item => item.id === 'dev-tools');

    if (devToolsIndex !== -1) {
      menuTemplate.splice(devToolsIndex, 1);  // remove the 'Developer Tools' menu
      menuTemplate.splice(devToolsIndex, 1);  // remove the separator after the 'Developer Tools' menu
    }
  }

  // The application menu serves the purpose of enabling hot keys
  // However, menu items must be nested under a top level menu
  // The logic below takes the entire menuTemplate and nests it under a top level menu item
  if (!forTray) {
    // Wrap the existing template into a new structure
    let nestedTemplate = [
      {
        label: 'Top Level',
        submenu: menuTemplate // This puts all your original items inside
      }
    ];

    // Replace the original menuTemplate with the new nested one
    menuTemplate = nestedTemplate;
  }

  return menuTemplate;

}

function enableTaskMenu(enabled) {
  const m_ttc = Menu.getApplicationMenu().getMenuItemById('task-toggle-complete');
  const m_ttf = Menu.getApplicationMenu().getMenuItemById('task-toggle-flag');
  const m_tnt = Menu.getApplicationMenu().getMenuItemById('task-next-task');
  const m_tpt = Menu.getApplicationMenu().getMenuItemById('task-previous-task');
  const m_tdt = Menu.getApplicationMenu().getMenuItemById('task-delete-task');

  m_ttc.enabled = enabled;
  m_ttf.enabled = enabled;
  m_tnt.enabled = enabled;
  m_tpt.enabled = enabled;
  m_tdt.enabled = enabled;
}

module.exports = { toggleComplete, deleteTask, createMenuTemplate, enableTaskMenu, showHideTasks, updateMenuSettings };
