const TabGroup = require('electron-tabs');
const tabGroup = new TabGroup({});
const { ipcRenderer } = require('electron');
const partition = new URL(window.location.href).searchParams.get('profile')

ipcRenderer.on('openTab', (event, url) => {
    tabGroup.addTab({
        title: 'AWS Console',
        src: url,
        active: true,
        visible: true,
        webviewAttributes: {
            nodeintegration: false,
            partition: partition
        },
        ready: tab => {
            tab.on('webview-dom-ready', () => {
                let title = tab.webview.getTitle();
                if(!title.toLowerCase().startsWith('http')) {
                    tab.setTitle(title);
                }
            });
        }
    });
});
