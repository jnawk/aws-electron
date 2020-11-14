const TabGroup = require("electron-tabs")
const tabGroup = new TabGroup({})
const { ipcRenderer } = require("electron")

let myWindowNumber
let myProfile

ipcRenderer.on("open-tab", (event, {url, tabNumber, windowNumber, profile, expiryTime}) => {
    if(windowNumber != undefined) {
        // we are given a window number when opening the winow
        myWindowNumber = windowNumber
        myProfile = profile

        // set the expiry timer and message
        const interval = setInterval(() => {
            const currentTime = new Date().getTime()
            const timeToGo = expiryTime - currentTime
            if (timeToGo < 1000) {
                clearInterval(interval)
            } else {
                const hoursRemaining = Math.floor(timeToGo / 3600000)
                const minutesRemaining = Math.floor(
                    (timeToGo - (hoursRemaining * 3600000)) / 60000
                )
                const secondsRemaining = Math.floor(
                    (timeToGo - ((hoursRemaining * 3600000) + (minutesRemaining * 60000))) / 1000
                )
                const hoursMessage = hoursRemaining > 0 ? `${hoursRemaining} hours ` : ""
                const minutesMessage = hoursRemaining > 0 && minutesRemaining > 0 ? `${minutesRemaining} minutes, ` : ""
                const message = `Time remaining: ${hoursMessage}${minutesMessage}${secondsRemaining} seconds`
                document.getElementById("timeRemaining").innerHTML = message
            }
        }, 1000)
    }

    tabGroup.addTab({
        title: "AWS Console",
        src: url,
        active: true,
        visible: true,
        webviewAttributes: {
            nodeintegration: false,
            partition: myProfile
        },
        ready: tab => {
            tab.on("webview-dom-ready", () => {
                let title = tab.webview.getTitle()
                if(!title.toLowerCase().startsWith("http")) {
                    tab.setTitle(title)
                }
            })
            tab.on("close", () => {
                ipcRenderer.send("close-tab", {windowNumber: myWindowNumber, tabNumber})
            })
        }
    })
    ipcRenderer.send("add-tab", {windowNumber: myWindowNumber, tabNumber})
})
