const { remote, ipcRenderer } = require('electron');
window.getAWSConfig = remote.getGlobal('getAWSConfig');
window.launchConsole = remote.getGlobal('launchConsole');
