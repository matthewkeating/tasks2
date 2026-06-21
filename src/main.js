const { app, BrowserWindow, globalShortcut, ipcMain, Menu, nativeImage, screen, shell, Tray } = require('electron/main');
const { createMenuTemplate, showHideTasks, showSidebar, hideSidebar, updateMenuSettings } = require('./components/menu.js');
const { WIDTH_WITHOUT_SIDEBAR, WIDTH_WITH_SIDEBAR, MIN_HEIGHT, MAX_HEIGHT } = require('./config.js');
const log = require('electron-log');
const path = require('node:path');
const fs = require('node:fs');
const Store = require('./js/electron-store.js');
const store = new Store();
const Utils = require('./js/utils.js');
const utils = new Utils();
const { db } = require('./firebase.js');
const { collection, doc, writeBatch, onSnapshot } = require('firebase/firestore');

// Placeholder until Firebase Authentication is added (see: https://firebase.google.com/docs/auth).
// At that point, replace with the signed-in user's UID so each user's tasks are isolated.
const FIREBASE_USER_ID = 'default';
const firestoreTaskIds = new Set();

// Writes the full task list to Firestore as individual documents using a single batch commit.
// updatedAt is used for last-write-wins conflict resolution when both devices edit the same task.
// Also deletes any Firestore documents whose IDs are no longer in the task list (e.g. after a purge).
async function syncTasksToFirestore(tasks) {
  const tasksCol = collection(db, 'users', FIREBASE_USER_ID, 'tasks');
  const batch = writeBatch(db);
  const currentIds = new Set(tasks.map(t => t.id));

  for (const task of tasks) {
    batch.set(doc(tasksCol, task.id), { ...task, updatedAt: Date.now() });
  }
  for (const id of firestoreTaskIds) {
    if (!currentIds.has(id)) batch.delete(doc(tasksCol, id));
  }

  await batch.commit();
}

let mainWindow = null;
let tray = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {

  // the app is designed be small and unobtrusive
  // set window size parameters to disallow users from making the window too big or too small
  const minimumWidth = WIDTH_WITHOUT_SIDEBAR;
  const maximumWidth = WIDTH_WITH_SIDEBAR;
  const minimumHeight = MIN_HEIGHT;
  const maximumHeight = MAX_HEIGHT;

  // gather information about the user's screen size
  const primaryScreen = screen.getPrimaryDisplay()
  const screenDimensions = primaryScreen.workAreaSize;
  const menuBarHeight = primaryScreen.bounds.height - primaryScreen.workArea.height;  // this code is specific to mac
  const screenWidth = screenDimensions.width;
  const screenHeight = screenDimensions.height;

  // set sensible defaults for window size and position
  let width = minimumWidth;
  let height = 800;
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
    contextIsolation: true, // important for using IPC

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, './pages/tasks.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('hide', () => {
    updateMenuSettings("window-active", false);
    const contextMenu = Menu.buildFromTemplate(createMenuTemplate(mainWindow));
    tray.setContextMenu(contextMenu);
  });

  mainWindow.on('focus', () => {
    updateMenuSettings("window-active", true);
    const contextMenu = Menu.buildFromTemplate(createMenuTemplate(mainWindow));
    tray.setContextMenu(contextMenu);
  });

  // automatically hide when the window loses focus
  if (app.isPackaged) {
    mainWindow.on('blur', () => {
      mainWindow.hide();
    });
  }

  mainWindow.on('close', () => {
    store.set('windowBounds', mainWindow.getBounds());
  });

  ipcMain.on('hide-window', (event) => {
    mainWindow.hide();
  });

  ipcMain.on('show-sidebar', () => { showSidebar(mainWindow); });
  ipcMain.on('hide-sidebar', () => { hideSidebar(mainWindow); });

  // Tasks are stored at ~/Library/Application Support/tasks/tasks.json on macOS.
  // This is a stable path that external tools (e.g. a Raycast extension) can read and write.
  const tasksPath = path.join(app.getPath('userData'), 'tasks.json');

  // ipcMain.handle is used here (instead of ipcMain.on) because the renderer needs
  // to wait for the file contents to be returned before it can render the task list.
  ipcMain.handle('load-tasks', () => {
    if (!fs.existsSync(tasksPath)) return [];
    return JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  });

  // ipcMain.on is used here (instead of ipcMain.handle) because saving is fire-and-forget —
  // the renderer doesn't need to wait for confirmation that the write completed.
  let appIsWriting = false;
  ipcMain.on('save-tasks', (event, tasks) => {
    appIsWriting = true;
    fs.writeFileSync(tasksPath, JSON.stringify(tasks));
    // Sync to Firestore after writing locally. Fire-and-forget — errors go to the log
    // so a Firestore outage doesn't block the user from saving tasks locally.
    syncTasksToFirestore(tasks).catch(err => log.error('Firestore sync failed:', err));
  });

  // Watch for external changes to tasks.json (e.g. from a Raycast extension).
  // Watching the directory (rather than the file) works even if tasks.json doesn't exist yet.
  // appIsWriting suppresses notifications for changes the app made itself.
  // The debounce prevents multiple rapid firings from a single external write.
  let watchDebounce = null;
  fs.watch(path.dirname(tasksPath), (eventType, filename) => {
    if (filename !== 'tasks.json' || eventType !== 'change') return;
    if (appIsWriting) {
      appIsWriting = false;
      return;
    }
    clearTimeout(watchDebounce);
    watchDebounce = setTimeout(() => {
      if (mainWindow) mainWindow.webContents.send('tasks-changed');
    }, 100);
  });

  // Listen for task changes pushed from other devices (e.g. the Android app).
  // Firestore calls this listener immediately on attach (initial snapshot) and again
  // whenever a document in the collection changes.
  const tasksCol = collection(db, 'users', FIREBASE_USER_ID, 'tasks');
  onSnapshot(tasksCol, (snapshot) => {
    // Keep firestoreTaskIds current so syncTasksToFirestore knows which docs to delete.
    snapshot.docChanges().forEach(change => {
      if (change.type === 'removed') firestoreTaskIds.delete(change.doc.id);
      else firestoreTaskIds.add(change.doc.id);
    });

    // hasPendingWrites is true when the change originated on this device.
    // Filtering these out prevents us from processing our own writes as if they were remote.
    const remoteChanges = snapshot.docChanges().filter(
      change => !change.doc.metadata.hasPendingWrites
    );
    if (remoteChanges.length === 0) return;

    let localTasks = [];
    if (fs.existsSync(tasksPath)) {
      localTasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    }

    // Merge remote changes into local tasks using last-write-wins (by updatedAt).
    // Tasks without updatedAt (created before Firestore sync was added) treat as 0,
    // so any remote version with a real timestamp takes precedence.
    const localMap = new Map(localTasks.map(t => [t.id, t]));
    for (const change of remoteChanges) {
      if (change.type === 'removed') {
        localMap.delete(change.doc.id);
      } else {
        const remoteTask = change.doc.data();
        const localTask = localMap.get(remoteTask.id);
        if (!localTask || (remoteTask.updatedAt ?? 0) > (localTask.updatedAt ?? 0)) {
          localMap.set(remoteTask.id, remoteTask);
        }
      }
    }

    // Preserve the local task order, excluding any tasks removed above.
    // New tasks from remote are appended at the end.
    const knownIds = new Set(localTasks.map(t => t.id));
    const updatedTasks = localTasks.filter(t => localMap.has(t.id)).map(t => localMap.get(t.id));
    for (const [id, task] of localMap) {
      if (!knownIds.has(id)) updatedTasks.push(task);
    }

    // Setting appIsWriting suppresses the fs.watch notification for this write,
    // since the renderer will be notified directly on the next line.
    appIsWriting = true;
    fs.writeFileSync(tasksPath, JSON.stringify(updatedTasks));
    if (mainWindow) mainWindow.webContents.send('tasks-changed');
  });

  ipcMain.on("update-tray-labels", (event, { showingCompleted, showingDeleted }) => {
    updateMenuSettings("showing-completed", showingCompleted);
    updateMenuSettings("showing-deleted", showingDeleted);
    const contextMenu = Menu.buildFromTemplate(createMenuTemplate(mainWindow));
    tray.setContextMenu(contextMenu);
  });

  ipcMain.on("open-link-externally", (event, url) => {
    shell.openExternal(url.url);
  });

  // Listen for the log event from the Renderer
  // write to ~/Library/Logs/<app name>/main.log
  ipcMain.on('write-log', (event, message) => {
      log.info(`[Renderer]: ${message}`);
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
  const contextMenu = Menu.buildFromTemplate(createMenuTemplate(mainWindow));
  tray.setContextMenu(contextMenu);

  // create the application (aka Mac) menu from the same template
  // note: you need to set the application menu on Mac even if you don't want to show it (because of hot keys)
  const menu = Menu.buildFromTemplate(createMenuTemplate(mainWindow));
  Menu.setApplicationMenu(menu);

  // Register a global shortcuts
  globalShortcut.register('CommandOrControl+Shift+\'', () => {
    showHideTasks(mainWindow);
  });
  mainWindow.on('focus', () => {
    globalShortcut.register('CommandOrControl+Q', () => {
      app.quit();
    });
  });
  mainWindow.on('blur', () => {
    globalShortcut.unregister('CommandOrControl+Q');
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