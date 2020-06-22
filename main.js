const { app, BrowserWindow } = require('electron');

const getAWSConfig = require('./AWSConfigReader');
const getConsoleURL = require('./getConsoleURL');

global.getAWSConfig = getAWSConfig;

// TODO extract this
global.launchConsole = (profileName, mfaCode) => {
    const options = {
        width: 1280,
        height: 1024,
        webPreferences: {
            partition: profileName,
            nodeIntegration: false
        }
    };

    const config = getAWSConfig()[profileName];

    const nw = (e, url) => {
        if(e) {
            e.preventDefault();
        }
        let win = new BrowserWindow(options);
        win.loadURL(url);
        win.webContents.on('new-window', nw);
    };

    getConsoleURL(config, mfaCode, profileName)
        .then(url => nw(null, url))
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
        console.log(navigationUrl);
        // TODO open in a new tab
    });
});
