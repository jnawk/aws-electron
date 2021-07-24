const { app, Menu } = require("electron")

const isMac = process.platform === "darwin"

const template = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideothers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" }
        ]
    }] : []),
    {
        label: "File",
        submenu: [
            {
                label: "Preferences",
                click: async () => {
                    app.openPreferences()
                }
            },
            isMac ? { role: "close" } : { role: "quit" }
        ]
    },
    {
        label: "Edit",
        submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            ...(isMac ? [
                { role: "pasteAndMatchStyle" },
                { role: "delete" },
                { role: "selectAll" },
                { type: "separator" },
                {
                    label: "Speech",
                    submenu: [
                        { role: "startspeaking" },
                        { role: "stopspeaking" }
                    ]
                }
            ] : [
                { role: "delete" },
                { type: "separator" },
                { role: "selectAll" }
            ])
        ]
    },
    {
        label: "View",
        submenu: [
            { role: "reload" },
            { role: "forcereload" },
            { role: "toggledevtools" },
            { type: "separator" },
            { role: "resetzoom" },
            { role: "zoomin" },
            { role: "zoomout" },
            { type: "separator" },
            { role: "togglefullscreen" }
        ]
    },
    {
        label: "Window",
        submenu: [
            { role: "minimize" },
            { role: "zoom" },
            ...(isMac ? [
                { type: "separator" },
                { role: "front" },
                { type: "separator" },
                { role: "window" }
            ] : [
                { role: "close" }
            ])
        ]
    },
]

module.exports.appMenu = Menu.buildFromTemplate(template)
