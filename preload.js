const { ipcRenderer, contextBridge } = require("electron")

contextBridge.exposeInMainWorld("backend", {
    getAWSConfig: () => ipcRenderer.invoke("get-aws-config"),
    launchConsole: (profileName, mfaCode) => ipcRenderer.send("launch-console", profileName, mfaCode)
})
