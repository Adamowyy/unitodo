const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
let expressProcess = null;
let mainWindow = null;

function startExpress() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'server.js');
    expressProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: String(PORT) }
    });

    let started = false;

    expressProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Express] ${output.trim()}`);
      if (!started && output.includes('running on')) {
        started = true;
        resolve();
      }
    });

    expressProcess.stderr.on('data', (data) => {
      console.error(`[Express] ${data.toString().trim()}`);
    });

    expressProcess.on('error', (err) => {
      console.error('[Express] Failed to start:', err);
      reject(err);
    });

    expressProcess.on('exit', (code) => {
      console.log(`[Express] Exited with code ${code}`);
      if (!started) reject(new Error(`Express exited with code ${code}`));
    });

    // Timeout after 15s
    setTimeout(() => {
      if (!started) reject(new Error('Express startup timeout'));
    }, 15000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'UniTodo',
    autoHideMenuBar: true,
    show: false
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startExpress();
    createWindow();
  } catch (err) {
    console.error('Failed to start:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (expressProcess) {
    expressProcess.kill();
    expressProcess = null;
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
