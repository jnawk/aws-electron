import { ipcRenderer } from 'electron';
import timeRemainingMessage from './timeRemaining';

// const tabGroup = new ElectronTabs({});

type WindowState = {
    contentsHandlers: Array<number>,
    profile?: string,
    expiryTime?: number,
    expiryUpdateInterval?: NodeJS.Timeout
}

const windowState: WindowState = {
    contentsHandlers: [],
    profile: undefined,
    expiryTime: undefined,
    expiryUpdateInterval: undefined,
};

interface OpenTab {
    url: string,
    tabNumber: number,
    profile: string,
    expiryTime: number
}

// ipcRenderer.on('browser-backward', (): void => {
//   const contents = tabGroup.getActiveTab()?.webview;
//   if (contents?.canGoBack()) {
//     contents.goBack();
//   }
// });

// ipcRenderer.on('browser-forward', (): void => {
//   const contents = tabGroup.getActiveTab()?.webview;
//   if (contents?.canGoForward()) {
//     contents.goForward();
//   }
// });

console.log('hello, world');

ipcRenderer.on('open-tab', (_event, {
    url, tabNumber, profile, expiryTime,
}: OpenTab) => {
    if (profile !== undefined) {
    // we are given a window number when opening the winow
        windowState.profile = profile;       

        if (expiryTime !== undefined) {
            windowState.expiryTime = expiryTime;

            if (windowState.expiryUpdateInterval !== undefined) {
                window.clearInterval(windowState.expiryUpdateInterval);
                windowState.expiryUpdateInterval = undefined;
            }
        }

        if (windowState.expiryUpdateInterval === undefined) {
            // set the expiry timer and message
            windowState.expiryUpdateInterval = setInterval(() => {
                if (windowState.expiryTime === undefined) {
                    // nothing we can do here
                    if (windowState.expiryUpdateInterval) {
                        // clear this damn thing.
                        clearInterval(windowState.expiryUpdateInterval);
                    }
                    return;
                }
                const currentTime = new Date().getTime();
                const timeToGo = windowState.expiryTime - currentTime;
                if (timeToGo < 1000 && windowState.expiryUpdateInterval) {
                    clearInterval(windowState.expiryUpdateInterval);
                    windowState.expiryUpdateInterval = undefined;
                } else {
                    const timeRemaining = document.getElementById('timeRemaining');
                    if (timeRemaining !== null) {
                        timeRemaining.innerHTML = (
                            timeRemainingMessage(timeToGo)
                        );
                    }
                }
            }, 1000);
        }
    }

    //   tabGroup?.addTab({
    //     title: 'AWS Console',
    //     src: url,
    //     active: true,
    //     visible: true,
    //     webviewAttributes: {
    //         nodeintegration: false,
    //         partition: windowState.profile,
    //     },
    //     ready: (tab: ElectronTabs.Tab) => {
    //       tab.on('webview-dom-ready', () => {
    //             const webViewTag = tab.webview as WebviewTag;
    //             const title = webViewTag.getTitle();
    //             if (!title.toLowerCase().startsWith('http')) {
    //                 void ipcRenderer.invoke(
    //                     'get-title',
    //                     { title, profile: windowState.profile },
    //                 ).then((newTitle: string) => { tab.setTitle(newTitle); });
    //             }

    //             const contentsId = webViewTag.getWebContentsId();
    //             if (!windowState.contentsHandlers.includes(contentsId)) {
    //                 ipcRenderer.send(
    //                     'add-zoom-handlers',
    //                     { contentsId, profile: windowState.profile },
    //                 );
    //                 windowState.contentsHandlers.push(contentsId);
    //             }
    //       });
    //       tab.on('close', () => ipcRenderer.send('close-tab', { profileName: windowState.profile, tabNumber }));
    //     },
    //   });
    ipcRenderer.send('add-tab', { profileName: windowState.profile, tabNumber });
});
