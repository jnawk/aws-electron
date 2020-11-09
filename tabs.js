const TabGroup = require("electron-tabs")
const tabGroup = new TabGroup({})
const { ipcRenderer } = require("electron")

let myWindowNumber

ipcRenderer.on("open-tab", (event, {url, tabNumber, windowNumber, profile}) => {
    if(windowNumber != undefined) {
        myWindowNumber = windowNumber
    }
    tabGroup.addTab({
        title: "AWS Console",
        src: url,
        active: true,
        visible: true,
        webviewAttributes: {
            nodeintegration: false,
            partition: profile
        },
        ready: tab => {
            tab.on("webview-dom-ready", () => {
                let title = tab.webview.getTitle()
                if(!title.toLowerCase().startsWith("http")) {
                    tab.setTitle(title)
                }
            })
            tab.on("close", () => {
                ipcRenderer.send("close-tab", {windowNumber: myWindowNumber, tabNumber})
            })
        }
    })
    ipcRenderer.send("add-tab", {windowNumber: myWindowNumber, tabNumber})
})
