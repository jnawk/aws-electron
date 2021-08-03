const {
    BrowserWindow,
    Menu,
    app,
    ipcMain,
    webContents
} = require("electron")

const contextMenu = require("electron-context-menu")
const debounce = require("debounce")
const settings = require("electron-settings")

const { getAWSConfig, getUsableProfiles } = require("./AWSConfigReader")
const { getConsoleUrl } = require("./getConsoleURL")
const { appMenu } = require("./menu")

// ipcMain.handle deals with ipcRenderer.invoke - these things expect an answer
ipcMain.handle("get-aws-config", () => getAWSConfig())
ipcMain.handle("get-preferences", () => settings.get("preferences"))
ipcMain.handle(
    "get-usable-profiles",
    (
        event,
        {config, credentialsProfiles}
    ) => getUsableProfiles({config, credentialsProfiles})
)
ipcMain.handle("get-title", async (event, {title, profile}) => {
    const tabTitlePreference = await settings.get("preferences.tabTitlePreference")
    if(tabTitlePreference === "{profile} - {title}") {
        return `${profile} - ${title}`
    } else if(tabTitlePreference === "{title} - {profile}") {
        return `${title} - ${profile}`
    } else {
        return title
    }
})

app.windows = {}
let nextTabNumber = 0

app.openPreferences = () => {
    if(app.preferencesWindow === undefined) {

        const options = {
            width: 1280,
            height: 1024,
            webPreferences: {
                preload: `${__dirname}/preload.js`,
                worldSafeExecuteJavaScript: true,
                contextIsolation: true
            }
        }

        const win = app.preferencesWindow = new BrowserWindow(options)
        win.loadURL(`file://${__dirname}/index.html#/settings`)
        win.on("close", () => {
            delete app.preferencesWindow
        })
    }
}

const launchConsole = async ({profileName, url, expiryTime}) => {
    const openTabArguments = {
        url,
        profile: profileName,
        tabNumber: nextTabNumber++,
        expiryTime
    }

    const profileSession = app.windows[profileName]
    if(profileSession) {
        // we already have a window open for this session, reuse it.
        profileSession.window.webContents.send("open-tab", openTabArguments)
        return
    }

    const bounds = await settings.get(`bounds.${profileName}`)

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
        },
        show: false,
        ...bounds.bounds
    }

    const win = new BrowserWindow(windowOptions)

    // save details of this profile's wind
    app.windows[profileName] = {
        tabs: [],
        window: win,
    }

    win.loadURL(`file://${__dirname}/tabs.html`)
    win.webContents.on("did-finish-load", () => {
        win.webContents.send("open-tab", openTabArguments)
    })
    win.on("close", () => {
        // delete the window state from the app when it is closed
        delete app.windows[profileName]
    })

    win.on("ready-to-show", () => {
        if (!app.windows[profileName].boundsChangedHandlerBound) {
            const boundsChangedFunction = debounce(
                () => windowBoundsChanged({window: win, profileName}),
                100
            )

            if(bounds) {
                if(bounds.maximised) {
                    win.maximize()
                }
            }
            win.show();

            ["move", "restore", "maximize", "unmaximize", "resize"].map(event => win.on(event, boundsChangedFunction))
            app.windows[profileName].boundsChangedHandlerBound = true
        }
    })

}

const windowBoundsChanged = ({window, profileName}) => {
    const bounds = window.getBounds()
    const maximised = window.isMaximized()
    settings.set(`bounds.${profileName}`, {bounds, maximised})
}


// ipcMain.on deals with ipcRenderer.send - these things don't want an answer
ipcMain.on(
    "set-preference",
    async (event, preference) => settings.set("preferences", {
        // existing preferences
        ...await settings.get("preferences"),
        // plus the one we are setting
        ...preference
    })
)

ipcMain.on(
    "launch-console",
    async (
        event,
        {profileName, mfaCode, configType}
    ) => {
        const config = getAWSConfig()[configType]
        const targetProfileConfig = config[profileName]

        // const config = getAWSConfig()[configType][profileName]
        const expiryTime = new Date().getTime() + (
            targetProfileConfig.duration_seconds || 3600
        ) * 1000

        try {
            const url = await getConsoleUrl(config, mfaCode, profileName)
            launchConsole({profileName, url, expiryTime})
        } catch (error) {
            console.error(error, error.stack)
        }
    }
)

ipcMain.on("add-tab", (event, {profileName, tabNumber}) => {
    // we want to track the tabs a profile has open so when the last one closes
    // we can close the window.
    app.windows[profileName].tabs.push(tabNumber)
})

ipcMain.on("add-zoom-handlers", async (event, {contentsId, profile}) => {
    const contents = webContents.fromId(contentsId)
    contents.setZoomLevel(await settings.get(`zoomLevels.${profile}`) || 0)
    contents.on("zoom-changed", (event, direction) => {
        let newZoomLevel = contents.getZoomLevel()
        if(direction === "in") {
            ++newZoomLevel
        } else {
            --newZoomLevel
        }
        contents.setZoomLevel(newZoomLevel)
        settings.set(`zoomLevels.${profile}`, newZoomLevel)
    })
    contents.on("before-input-event", (event, input) => {
        if(input.control) {
            if(input.type == "keyUp"){
                if(input.key === "+" || input.key === "-") {
                    settings.set(`zoomLevels.${profile}`, contents.getZoomLevel())
                }
            }
        }
    })
})

ipcMain.on("add-context-menu", (event, {contentsId}) => {
    const contents = webContents.fromId(contentsId)
    contextMenu({
        window: contents,
        prepend: (defaultActions, parameters /*, browserWindow*/ ) => {
            return [
                {
                    label: "Open in new tab",
                    click: () => {
                        BrowserWindow.getFocusedWindow().webContents.send(
                            "open-tab", {url: parameters.linkURL, tabNumber: nextTabNumber++}
                        )
                    },
                    // Only show it when right-clicking links
                    visible: parameters.linkURL != ""
                },
                {
                    label: "Back",
                    click: () => contents.goBack(),
                    visible: contents.canGoBack()
                },
                {
                    label: "Forwards",
                    click: () => contents.goForward(),
                    visible: contents.canGoForward()
                }
            ]
        }
    })
})

ipcMain.on("close-tab", (event, {profileName, tabNumber}) => {
    // remove the tab tracking
    app.windows[profileName].tabs = (
        app.windows[profileName].tabs.filter(num => tabNumber != num)
    )

    if(app.windows[profileName].tabs.length == 0) {
        // no more tabs; close the window
        app.windows[profileName].window.close()
        // the close window handler will delete the window information
    }
})

app.on("ready", async () => {
    Menu.setApplicationMenu(appMenu)
    const launchWindowBounds = await settings.get("launchWindowBounds")
    const options = {
        width: 1280,
        height: 1024,
        webPreferences: {
            preload: `${__dirname}/preload.js`,
            worldSafeExecuteJavaScript: true,
            contextIsolation: true
        },
        show: false,
        ...launchWindowBounds.bounds
    }

    const win = new BrowserWindow(options)
    win.loadURL(`file://${__dirname}/index.html`)
    // win.toggleDevTools();

    win.on("ready-to-show", () => {
        if (!app.launchWindowBoundsChangedHandlerBound) {
            const boundsChangedFunction = debounce(
                () => {
                    const bounds = win.getBounds()
                    const maximised = win.isMaximized()
                    settings.set("launchWindowBounds", {bounds, maximised})
                },
                100
            )

            if(launchWindowBounds) {
                if(launchWindowBounds.maximised) {
                    win.maximize()
                }
            }
            win.show();

            ["move", "restore", "maximize", "unmaximize", "resize"].map(event => win.on(event, boundsChangedFunction))
            app.launchWindowBoundsChangedHandlerBound = true
        }
    })

})

app.on("window-all-closed", () => app.quit())

app.on("web-contents-created", (wccEvent, contents) => {
    contents.on("new-window", (newWindowEvent, url) => {
        if(newWindowEvent) {
            // if we receive a new window event, we want to cancel it and ...
            newWindowEvent.preventDefault()
        }
        // ... open a tab in our current window instead.
        // (assumes windows are only created in response to the user actually
        // doing something - seems reasonable)
        BrowserWindow.getFocusedWindow().webContents.send(
            "open-tab", {url, tabNumber: nextTabNumber++}
        )
    })
})
