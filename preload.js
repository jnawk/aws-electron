const { remote } = require('electron');
window.getAWSConfig = remote.getGlobal('getAWSConfig');
window.launchConsole = remote.getGlobal('launchConsole');
