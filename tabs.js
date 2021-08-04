const TabGroup = require("electron-tabs")
const tabGroup = new TabGroup({})
const { ipcRenderer } = require("electron")
const timeRemainingMessage = require("./timeRemaining")
let windowState = {
    contentsHandlers: []
}


ipcRenderer.on("open-tab", (event, {url, tabNumber, profile, expiryTime}) => {
    if(profile != undefined) {
        // we are given a window number when opening the winow
        windowState.profile = profile

        if(expiryTime != undefined) {
            windowState.expiryTime = expiryTime

            if(windowState.expiryUpdateInterval != undefined) {
                window.clearInterval(windowState.expiryUpdateInterval)
                windowState.expiryUpdateInterval = undefined
            }
        }

        if(windowState.expiryUpdateInterval == undefined) {
            // set the expiry timer and message
            windowState.expiryUpdateInterval = setInterval(() => {
                const currentTime = new Date().getTime()
                const timeToGo = windowState.expiryTime - currentTime
                if (timeToGo < 1000) {
                    clearInterval(windowState.expiryUpdateInterval)
                    windowState.expiryUpdateInterval = undefined
                } else {
                    document.getElementById("timeRemaining").innerHTML = (
                        timeRemainingMessage(timeToGo)
                    )
                }
            }, 1000)
        }
    }

    tabGroup.addTab({
        title: "AWS Console",
        src: url,
        active: true,
        visible: true,
        webviewAttributes: {
            nodeintegration: false,
            partition: windowState.profile
        },
        ready: tab => {
            tab.on("webview-dom-ready", async () => {
                const title = tab.webview.getTitle()
                if(!title.toLowerCase().startsWith("http")) {
                    tab.setTitle(
                        await ipcRenderer.invoke(
                            "get-title",
                            {title, profile: windowState.profile}
                        )
                    )
                }

                const contentsId = tab.webview.getWebContentsId()
                if(!windowState.contentsHandlers.includes(contentsId)) {
                    ipcRenderer.send("add-context-menu", {contentsId})
                    ipcRenderer.send("add-zoom-handlers", {contentsId, profile: windowState.profile})
                    windowState.contentsHandlers.push(contentsId)
                }
            })
            tab.on("close", () => ipcRenderer.send(
                "close-tab", {profileName: windowState.profile, tabNumber}
            ))
        }
    })
    ipcRenderer.send("add-tab", {profileName: windowState.profile, tabNumber})
})
