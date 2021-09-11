const { ipcRenderer, contextBridge } = require("electron")

contextBridge.exposeInMainWorld(
    "backend",
    {
        getAWSConfig: () => ipcRenderer.invoke("get-aws-config"),
        launchConsole: ({profileName, mfaCode, configType}) => ipcRenderer.send(
            "launch-console",
            {profileName, mfaCode, configType}
        ),
        getUsableProfiles: ({config, credentialsProfiles}) => ipcRenderer.invoke(
            "get-usable-profiles", {config, credentialsProfiles}
        ),
        getPreferences: () => ipcRenderer.invoke("get-preferences"),
        setPreference: preference => ipcRenderer.send(
            "set-preference", preference
        ),
        rotateKey: ({profile, aws, local}) => ipcRenderer.invoke(
            "rotate-key", {profile, aws, local}
        ),
    }
)
