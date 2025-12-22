const { app, BrowserWindow, globalShortcut, ipcMain, Menu, nativeImage, screen, shell, Tray } = require('electron/main');
const { toggleComplete, deleteTask, createMenuTemplate, enableTaskMenu, showHideTasks, updateMenuSettings } = require('./components/menu.js');
const path = require('node:path');
const Store = require('./js/electron-store.js');
const store = new Store();
const Utils = require('./js/utils.js');
const utils = new Utils();

let mainWindow = null;
let tray = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {

  // the app is designed be small and unobtrusive
  // set window size parameters to disallow users from making the window too big or too small
  const minimumWidth = 780;
  const maximumWidth = 780;
  const minimumHeight = 518;
  const maximumHeight = 1200;

  // gather information about the user's screen size
  const primaryScreen = screen.getPrimaryDisplay()
  const screenDimensions = primaryScreen.workAreaSize;
  const menuBarHeight = primaryScreen.bounds.height - primaryScreen.workArea.height;  // this code is specific to mac
  const screenWidth = screenDimensions.width;
  const screenHeight = screenDimensions.height;

  // set sensible defaults for window size and position
  var width = maximumWidth;
  var height = 800;
  let x = (screenWidth - width) / 2;
  let y = ((screenHeight - height) / 2) + menuBarHeight;
  
  // override defaults if the window has previously been positioned by the user
  const windowBounds = store.get('windowBounds');
  if (windowBounds !== undefined) {
    // set the window position and height using the values on the last application exit
    width = windowBounds.width;
    height = windowBounds.height;

    // make sure the previous window position is inside the screen (this is important for users that use multiple monitors)
    const windowUpperLeft = [windowBounds.x, windowBounds.y];
    const screenRectangle = [[0, 0], [screenWidth-width, screenHeight-height+menuBarHeight]]
    const isWindowPositionedInScreen = utils.isPointInRectangle(windowUpperLeft, screenRectangle);

    if (isWindowPositionedInScreen) {
      // move the window to its previous position
      x = windowBounds.x;
      y = windowBounds.y;
    } else {
      // center the window to the screen
      y = Math.round(((screenHeight - windowBounds.height) / 2) + menuBarHeight);
    }

  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: width,
    minWidth: minimumWidth,
    maxWidth: maximumWidth,
    height: height,
    minHeight: minimumHeight,
    maxHeight: maximumHeight,

    x: x,
    y: y,

    resizable: false,
    frame: false,
    show: false,  // don't show the window until the html is loaded (see the 'ready-to-show' method below)

    nodeIntegration: false, // for additional security
    contextIsolation: false, // important for using IPC

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, './pages/tasks.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('hide', () => {
    updateMenuSettings("window-active", false);
    const contextMenu = Menu.buildFromTemplate(createMenuTemplate(mainWindow, true));
    tray.setContextMenu(contextMenu);
  });

  mainWindow.on('focus', () => {
    updateMenuSettings("window-active", true);
    const contextMenu = Menu.buildFromTemplate(createMenuTemplate(mainWindow, true));
    tray.setContextMenu(contextMenu);
  });

  // automatically hide when the window loses focus
  mainWindow.on('blur', () => {
    mainWindow.hide();
  });

  mainWindow.on('close', () => {
    store.set('windowBounds', mainWindow.getBounds());
  });

  ipcMain.on('enable-task-menu', (event) => {
    enableTaskMenu(true);
  });

  ipcMain.on('disable-task-menu', (event) => {
    enableTaskMenu(false);
  });

  ipcMain.on('hide-window', (event) => {
    mainWindow.hide();
  });

  ipcMain.on("update-tray-labels", (event, { showingCompleted, showingDeleted }) => {
    updateMenuSettings("showing-completed", showingCompleted);
    updateMenuSettings("showing-deleted", showingDeleted)  
    const contextMenu = Menu.buildFromTemplate(createMenuTemplate(mainWindow, true));
    tray.setContextMenu(contextMenu);
  });

  ipcMain.on("open-link-externally", (event, url) => {
    shell.openExternal(url.url);
  });

  ipcMain.on("quit-app", (event) => {
    app.quit();
  });

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  createWindow();

  // initialize the tray
  const iconPath = path.join(__dirname, '../assets/TrayIconTemplate@2x.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  // create the tray menu from template
  const contextMenu = Menu.buildFromTemplate(createMenuTemplate(mainWindow, true));
  tray.setContextMenu(contextMenu);

  // create the application (aka Mac) menu from the same template
  // note: you need to set the application menu on Mac even if you don't want to show it (because of hot keys)
  const menu = Menu.buildFromTemplate(createMenuTemplate(mainWindow, false));
  Menu.setApplicationMenu(menu);
  
  // Register a global shortcuts
  globalShortcut.register('CommandOrControl+Shift+\'', () => {
    showHideTasks(mainWindow);
  });

  // Because the hot keys associated with toggle complete and delete task are
  // global hot keys on Mac, they must be suppressed when a task is not selected.
  // The functions below use the enabled (or disabled) menu items as a proxy
  // for a task being selected.
  globalShortcut.register('CommandOrControl+Shift+O', () => {
    toggleComplete(mainWindow);
  });
  globalShortcut.register('CommandOrControl+Backspace', () => {
    deleteTask(mainWindow);
  });

});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts when quitting
  globalShortcut.unregisterAll();
});