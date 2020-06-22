const { app, BrowserWindow } = require('electron');

const getAWSConfig = require('./AWSConfigReader');
global.getAWSConfig = getAWSConfig;
app.on('ready', () => {
    const options = {
        width: 1280,
        height: 1024,
    };

    var win = new BrowserWindow(options);
    win.loadURL(`file://${__dirname}/index.html`);
    win.toggleDevTools();
});

app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        console.log(navigationUrl);
        // TODO open in a new tab
    });
});
