const { app, BrowserWindow, ipcMain } = require("electron")

const { getAWSConfig } = require("./AWSConfigReader")
const launchConsole = require("./launchConsole")

ipcMain.handle("get-aws-config", () => getAWSConfig())

// need to track the current window so that a new-window event is turned
// into an openTab event in the right webContents.
let currentWindow

const setCurrentWindow = win => {
    currentWindow = win
}

ipcMain.on("launch-console", (event, {profileName, mfaCode, configType}) => {
    launchConsole({profileName, mfaCode, configType, setCurrentWindow})
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
//    win.toggleDevTools();
})

app.on("web-contents-created", (wccEvent, contents) => {
    contents.on("new-window", (nwEvent, navigationUrl) => {
        if(nwEvent) {
            nwEvent.preventDefault()
        }
        currentWindow.webContents.send("openTab", navigationUrl)
    })
})
