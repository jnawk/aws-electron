const { app, BrowserWindow } = require('electron');

const getAWSConfig = require('./AWSConfigReader');
const getConsoleURL = require('./getConsoleURL');

global.getAWSConfig = getAWSConfig;
// TODO need to be able to support multiple windows
let win;

// TODO extract this
global.launchConsole = (profileName, mfaCode) => {
    const options = {
        width: 1280,
        height: 1024,
        webPreferences: {
            partition: profileName,
            nodeIntegration: true
        }
    };

    const config = getAWSConfig()[profileName];

    getConsoleURL(config, mfaCode, profileName)
        .then(url => {
            win = new BrowserWindow(options);
            win.loadURL(`file://${__dirname}/tabs.html`);
            win.webContents.on('did-finish-load', () => {
                win.webContents.send('openTab', url);
            });
        })
        .catch(error => {
            console.error(error, error.stack);
            //app.quit();
        });
};

app.on('ready', () => {
    const options = {
        width: 1280,
        height: 1024,
    };

    var win = new BrowserWindow(options);
    win.loadURL(`file://${__dirname}/index.html`);
//    win.toggleDevTools();
});

app.on('web-contents-created', (wccEvent, contents) => {
    contents.on('new-window', (nwEvent, navigationUrl) => {
        if(nwEvent) {
            nwEvent.preventDefault();
        }
        win.webContents.send('openTab', navigationUrl);
    });
});
