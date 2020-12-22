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

let nextTabNumber = 0


const launchConsole = ({profileName, url, expiryTime}) => {
    const openTabArguments = {
        url,
        profile: profileName,
        tabNumber: nextTabNumber++,
        expiryTime
    }

    const profileSession = appState.windows[profileName]
    if(profileSession) {
        // we already have a window open for this session, reuse it.
        profileSession.window.webContents.send("open-tab", openTabArguments)
        return
    }

    // we do not have a window open for this session; need to open one
    const windowOptions = {
        width: 1280,
        height: 1024,
        title: `AWS Console - ${profileName}`,
        webPreferences: {
            partition: profileName,
            nodeIntegration: true,
            webviewTag: true//, // TODO we aren't ready for this yet
            // worldSafeExecuteJavaScript: true,
            // contextIsolation: true
        }
    }

    const win = new BrowserWindow(windowOptions)

    win.loadURL(`file://${__dirname}/tabs.html`)
    win.webContents.on("did-finish-load", () => {
        win.webContents.send("open-tab", openTabArguments)
    })
    win.on("close", event => {
        // delete the window state from the app when it is closed
        delete appState.windows[profileName]
    })

    // when the window regains focus, update which window is the current window
    // so that a new-window event is sent to the right place.
    win.on("focus", () => setCurrentWindow(win))

    // save details of this profile's wind
    appState.windows[profileName] = {
        tabs: [],
        window: win
    }
}

ipcMain.on("launch-console", (event, {profileName, mfaCode, configType}) => {
    const config = getAWSConfig()[configType][profileName]
    const expiryTime = new Date().getTime() + (
        config.duration_seconds || 3600
    ) * 1000

    getConsoleURL(config, mfaCode, profileName)
        .then(url => launchConsole({profileName, url, expiryTime}))
        .catch(error => {
            console.error(error, error.stack)
            //app.quit();
        })
})

ipcMain.on("add-tab", (event, {profileName, tabNumber}) => {
    // we want to track the tabs a profile has open so when the last one closes
    // we can close the window.
    appState.windows[profileName].tabs.push(tabNumber)
})

ipcMain.on("close-tab", (event, {profileName, tabNumber}) => {
    // remove the tab tracking
    appState.windows[profileName].tabs = (
        appState.windows[profileName].tabs.filter(num => tabNumber != num)
    )

    if(appState.windows[profileName].tabs.length == 0) {
        // no more tabs; close the window
        appState.windows[profileName].window.close()
        // the close window handler will delete the window information
        // delete appState.windows[profileName]
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
    contents.on("new-window", (newWindowEvent, url) => {
        if(newWindowEvent) {
            // if we receive a new window event, we want to cancel it and ...
            newWindowEvent.preventDefault()
        }
        // ... open a tab in our current window instead.
        // (assumes windows are only created in resoonse to the user actually
        // doing something - seems reasonable)
        appState.currentWindow.webContents.send(
            "open-tab", {url, tabNumber: nextTabNumber++}
        )
    })
})
