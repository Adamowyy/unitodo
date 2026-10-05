// Desktop wrapper that opens a UniTodo deployment; the address comes from the environment.
const { app, BrowserWindow, shell, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'unitodo.config.json');
const WINDOW_WIDTH = 1200;
const WINDOW_HEIGHT = 800;
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;

let mainWindow = null;

/** Returns the deployment address, or null when the app is not configured yet. */
function resolveAppUrl() {
  if (process.env.UNITODO_URL) return process.env.UNITODO_URL;
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (config.url) return config.url;
  } catch (err) { /* no config file, handled by the caller */ }
  return null;
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'UniTodo',
    autoHideMenuBar: true,
    show: false
  });

  mainWindow.loadURL(url + '?from=app');

  // External links open in the default browser, only for target="_blank"
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target);
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const url = resolveAppUrl();
  if (!url) {
    dialog.showErrorBox(
      'UniTodo is not configured',
      'Set the UNITODO_URL environment variable or create unitodo.config.json with {"url": "https://your-instance"} next to the app.'
    );
    app.quit();
    return;
  }
  createWindow(url);
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow(resolveAppUrl());
  }
});
