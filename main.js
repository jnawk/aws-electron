const { app, BrowserWindow } = require('electron');

app.on('ready', () => {
    const options = {
        width: 1280,
        height: 1024,
    };

    var win = new BrowserWindow(options);
    win.loadURL(`file://${__dirname}/index.html`);
    win.toggleDevTools();
});
