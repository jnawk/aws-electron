const { BrowserWindow } = require("electron")

const { getAWSConfig } = require("./AWSConfigReader")
const getConsoleURL = require("./getConsoleURL")

module.exports = ({profileName, mfaCode, configType, setCurrentWindow}) => {
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

    // TODO this needs to know if it is vault-config or aws-config
    const config = getAWSConfig()[configType][profileName]

    getConsoleURL(config, mfaCode, profileName)
        .then(url => {
            let win = new BrowserWindow(options)

            win.loadURL(`file://${__dirname}/tabs.html?profile=${profileName}`)
            win.webContents.on("did-finish-load", () => {
                win.webContents.send("openTab", url)
            })

            // when the window regains focus, update which window
            // is the current window so that a new-window event is
            // sent to the right place.
            win.on("focus", () => setCurrentWindow(win))
        })
        .catch(error => {
            console.error(error, error.stack)
            //app.quit();
        })
}
