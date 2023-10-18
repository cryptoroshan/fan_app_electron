'use strict';

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const log = require('electron-log');
const unhandled = require('electron-unhandled');
unhandled();

const process = require('process');

process.on('uncaughtException', (err, origin) => {
  log.error(err);
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;


log.info('Hello, log');
log.warn('Some problem appears');
console.log = log.log;
Object.assign(console, log.functions);
log.catchErrors({
  showDialog: false,
  onError(error, versions, submitIssue) {
    log.error(error.message)
    log.error(error.stack)
  }
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    icon: __dirname + '/img/fan_icon.ico',
    title: "Pixus Technologies Fan Controller Console",
    webPreferences: {
      // 2. Enable Node.js integration
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.removeMenu();

  mainWindow.onerror = function(error, url, line) {
    log.error(error);
  };

  mainWindow.webContents.session.on('serial-port-added', (event, port) => {
    console.log('serial-port-added FIRED WITH', port)
  })


  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  ipcMain.on("toggle-maximize-window", function (event) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on("close-window", function (event) {
    mainWindow.close();
  });
  ipcMain.on("minimize-window", function (event) {
    mainWindow.minimize();
  });


  ipcMain.handle('show-dialog', (event) => {
    var dialogOptions = {
      title: 'Select the File to be uploaded',
      buttonLabel: 'Upload',
      // Restricting the user to only Text Files.
      filters: [
          {
              name: 'Bin Files',
              extensions: ['bin']
          }, ],
      // Specifying the File Selector Property
      properties: ['openFile']
    }


    dialog.showOpenDialog(mainWindow, dialogOptions)
      .then(file => {
        console.log(file.canceled);
        if (!file.canceled) {
          var filepath = file.filePaths[0].toString();
          event.sender.send('selected-file', filepath)
        }
      }).catch(err => {
        console.log(err)
      });;    
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
