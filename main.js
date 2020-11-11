const { app, BrowserWindow, ipcMain } = require("electron")

const { getAWSConfig } = require("./AWSConfigReader")
const getConsoleURL = require("./getConsoleURL")


ipcMain.handle("get-aws-config", () => getAWSConfig())

let appState = {
    // need to track the current window so that a new-window event is turned
    // into an openTab event in the right webContents.
    currentWindow: null,
    windows: {}
}

// TODO might be able to do away with this with some proper tracking of windows
const setCurrentWindow = win => {
    appState.currentWindow = win
}

let nextTabOrWindowNumber = 0

ipcMain.on("launch-console", (event, {profileName, mfaCode, configType}) => {
    const options = {
        width: 1280,
        height: 1024,
        webPreferences: {
            partition: profileName,
            nodeIntegration: true,
            webviewTag: true//, // we aren't ready for this yet
            // worldSafeExecuteJavaScript: true,
            // contextIsolation: true
        }
    }

    const config = getAWSConfig()[configType][profileName]

    getConsoleURL(config, mfaCode, profileName)
        .then(url => {
            let win = new BrowserWindow(options)

            const openTabArguments = {
                url,
                partition: profileName,
                tabNumber: nextTabOrWindowNumber++,
                windowNumber: nextTabOrWindowNumber++,
                expiryTime: new Date().getTime() + (config.duration_seconds || 3600) * 1000
            }

            win.loadURL(`file://${__dirname}/tabs.html`)
            win.webContents.on("did-finish-load", () => {
                win.webContents.send("open-tab", openTabArguments)
            })

            // when the window regains focus, update which window
            // is the current window so that a new-window event is
            // sent to the right place.
            win.on("focus", () => setCurrentWindow(win))
            appState.windows[openTabArguments.windowNumber] = {
                tabs: [],
                window: win
            }
        })
        .catch(error => {
            console.error(error, error.stack)
            //app.quit();
        })

})

ipcMain.on("add-tab", (event, {windowNumber, tabNumber}) => {
    appState.windows[windowNumber].tabs.push(tabNumber)
})

ipcMain.on("close-tab", (event, {windowNumber, tabNumber}) => {
    appState.windows[windowNumber].tabs = appState.windows[windowNumber].tabs.filter(num => tabNumber != num)
    if(appState.windows[windowNumber].tabs.length == 0) {
        // no more tabs
        appState.windows[windowNumber].window.close()
    }
})

app.on("ready", () => {
    const options = {
        width: 1280,
        height: 1024,
        webPreferences: {
            preload: `${__dirname}/preload.js`,
            worldSafeExecuteJavaScript: true,
            contextIsolation: true
        }
    }

    const win = new BrowserWindow(options)
    win.loadURL(`file://${__dirname}/index.html`)
    // win.toggleDevTools();
})

app.on("window-all-closed", () => app.quit())

app.on("web-contents-created", (wccEvent, contents) => {
    contents.on("new-window", (nwEvent, url) => {
        if(nwEvent) {
            nwEvent.preventDefault()
        }
        appState.currentWindow.webContents.send("open-tab", {url, tabNumber: nextTabOrWindowNumber++})
    })
})
