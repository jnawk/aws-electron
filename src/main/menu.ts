import {
    Menu, app, BrowserWindow, WebContents,
} from 'electron';

import { ApplicationState } from './types';

const isMac = process.platform === 'darwin';

export default function buildAppMenu(state: ApplicationState): Menu {
    const handleReload = (browserWindow: BrowserWindow, force: boolean) => {
        let thingToReload: WebContents = browserWindow.webContents;

        const currentProfileName = Object.keys(state.windows).find((profileName) => {
            return browserWindow === state.windows[profileName].window;
        });
        if (currentProfileName) {
            const windowDetails = state.windows[currentProfileName];
            if (windowDetails.currentView) {
                thingToReload = windowDetails.browserViews[windowDetails.currentView].webContents;
            } else {
                return;
            }
        }

        if (force) {
            thingToReload.reloadIgnoringCache();
        } else {
            thingToReload.reload();
        }
    };
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: isMac ? app.name : 'AWS Console',
            submenu: [
                {
                    label: 'Preferences',
                    click: () => state.openPreferences(),
                },
                {
                    label: 'Rotate Keys',
                    click: () => state.openKeyRotation(),
                },
                {
                    label: 'MFA Cache',
                    click: () => state.openMfaCache(),
                },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'about' },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideothers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                ] : []) as Electron.MenuItemConstructorOptions[],
                { role: 'close' },
                { role: 'quit' },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startspeaking' },
                            { role: 'stopspeaking' },
                        ],
                    },
                ] : [
                    { role: 'delete' },
                    { type: 'separator' },
                    { role: 'selectAll' },
                ]) as Electron.MenuItemConstructorOptions[],
            ],
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: (_menuItem, browserWindow) => {
                        if (browserWindow) {
                            handleReload(browserWindow, false);
                        }
                    },
                },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: (_menuItem, browserWindow) => {
                        if (browserWindow) {
                            handleReload(browserWindow, true);
                        }
                    },
                },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' },
                ] : [
                    { role: 'close' },
                ]) as Electron.MenuItemConstructorOptions[],
            ],
        },
    ];
    return Menu.buildFromTemplate(template);
}
