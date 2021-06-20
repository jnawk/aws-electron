const { ipcRenderer, contextBridge } = require("electron")

contextBridge.exposeInMainWorld("backend", {
    getAWSConfig: () => ipcRenderer.invoke("get-aws-config"),
    launchConsole: ({profileName, mfaCode, configType}) => ipcRenderer.send(
        "launch-console",
        {profileName, mfaCode, configType}
    ),
    getUsableProfiles: ({config, credentialsProfiles}) => ipcRenderer.invoke(
        "get-usable-profiles", {config, credentialsProfiles}
    )
})
