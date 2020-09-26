const { remote, ipcRenderer } = require('electron');
window.getAWSConfig = remote.getGlobal('getAWSConfig');
window.launchConsole = remote.getGlobal('launchConsole');
window.ipcRenderer = ipcRenderer;

window.TabGroupC = () => { return require('electron-tabs'); };
