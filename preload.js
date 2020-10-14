const { ipcRenderer, remote } = require("electron")

window.getAWSConfig = () => ipcRenderer.invoke("get-aws-config")
window.launchConsole = remote.getGlobal("launchConsole")
