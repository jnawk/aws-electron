const { app, BrowserWindow } = require('electron');

const getAWSConfig = require('./AWSConfigReader');
const getConsoleURL = require('./getConsoleURL');

global.getAWSConfig = getAWSConfig;

// need to track the current window so that a new-window event is turned
// into an openTab event in the right webContents.
let currentWindow;

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
            let win = new BrowserWindow(options);

            win.loadURL(`file://${__dirname}/tabs.html`);
            win.webContents.on('did-finish-load', () => {
                win.webContents.send('openTab', url);
            });

            // when the window regains focus, update which window
            // is the current window so that a new-window event is
            // sent to the right place.
            win.on('focus', () => {
                currentWindow = win;
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
        currentWindow.webContents.send('openTab', navigationUrl);
    });
});
