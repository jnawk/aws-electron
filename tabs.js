const TabGroup = require("electron-tabs");
const tabGroup = new TabGroup({});
const { remote, ipcRenderer } = require('electron');
ipcRenderer.on('openTab', (event, url) => {
  tabGroup.addTab({
    title: 'AWS Console',
    src: url,
    active: true,
    visible: true,
    webviewAttributes: {
        nodeintegration: false
    },
    ready: tab => {
      tab.on('webview-dom-ready', t => {
        let title = tab.webview.getTitle();
        if(!title.toLowerCase().startsWith('http')) {
          tab.setTitle(title);
        }
      });
    }
  });
});
