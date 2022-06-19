// these can't be default imports
import * as debounce from 'debounce';
import * as settings from 'electron-settings';

import {
    BrowserWindow, Rectangle, BrowserView, clipboard,
} from 'electron';
import * as path from 'path';
import * as contextMenu from 'electron-context-menu';

import * as sprintf from 'sprintf-js';
import getWindowURL from './getWindowURL';
import { BoundsPreference, WindowBoundsChangedArguments } from './types';

import { getTimeLeft } from './timeRemaining';
import ApplicationState from './applicationState';

import getPreferences from './getPreferences';

function windowBoundsChanged({
    window, profileName,
}: WindowBoundsChangedArguments): void {
    const windowBounds = {
        bounds: { ...window.getBounds() },
        maximised: window.isMaximized(),
    };

    void settings.set(`bounds.${profileName}`, windowBounds);
}

async function getTitle(title: string, profile: string, timeLeft: string) {
    const preferences = await getPreferences();
    if (preferences.tabTitlePreferenceV2) {
        return sprintf.sprintf(preferences.tabTitlePreferenceV2, {
            profile, title, timeLeft,
        });
    }
    return title;
}

function getBrowserViewBounds(win: BrowserWindow): Rectangle {
    const windowBounds = win.getBounds();
    const tabHeight = 55;
    const dev = process.env.NODE_ENV !== 'production';

    // devtools is actually not 800px wide, it could be anything, including not docked to the side!
    // https://stackoverflow.com/questions/43652253/how-to-set-electron-browser-window-devtools-width
    // this will do for now.
    const devToolsWidth = 800;

    return {
        x: 0,
        y: tabHeight,
        width: windowBounds.width - (dev ? devToolsWidth : 0),
        height: windowBounds.height - (tabHeight + 25),
    };
}

export function openTab(
    urlToOpen: string,
    profileName: string,
    state: ApplicationState,
    win: BrowserWindow,
) {
    const profileSession = state.windows[profileName];
    const tabNumber = state.getNextTabNumber();
    if (profileSession.titleUpdateTimer) {
        clearInterval(profileSession.titleUpdateTimer);
    }

    profileSession.titleUpdateTimer = setInterval(() => {
        // can't be returning shit
        void (async () => {
            win.setTitle(
                await getTitle(
                    'AWS Console',
                    profileName,
                    getTimeLeft(profileName, state),
                ),
            );
        })();
    }, 1000);

    win.webContents.send('open-tab', { tabNumber });

    const view = new BrowserView({
        webPreferences: {
            partition: ['persist', profileName].join(':'),
        },
    });
    view.setBounds(getBrowserViewBounds(win));
    void view.webContents.loadURL(urlToOpen);
    view.webContents.setWindowOpenHandler((details) => {
        openTab(details.url, profileName, state, win);
        return { action: 'deny' };
    });
    view.webContents.on('page-title-updated', () => {
        win.webContents.send(
            'update-tab-title',
            { tabNumber, title: view.webContents.getTitle() },
        );
    });
    win.setBrowserView(view);
    profileSession.browserViews[tabNumber] = view;
    profileSession.currentView = tabNumber;

    contextMenu({
        window: view.webContents,
        prepend: (
            _defaultActions,
            parameters,
        ) => [
            {
                label: 'Open in new tab',
                click: () => {
                    openTab(parameters.linkURL, profileName, state, win);
                },
                // Only show it when right-clicking links
                visible: parameters.linkURL !== '',
            },
            {
                label: 'Copy Page URL to clipboard',
                click: () => {
                    clipboard.writeText(view.webContents.getURL());
                },
                // Don't show it when right-clicking links
                visible: parameters.linkURL === '',
            },
            {
                label: 'Back',
                click: () => view.webContents.goBack(),
                visible: view.webContents.canGoBack(),
            },
            {
                label: 'Forwards',
                click: () => view.webContents.goForward(),
                visible: view.webContents.canGoForward(),
            },
        ],
    });

    const setNewZoomLevel = (newZoomLevel: number, save?: boolean) => {
        [win.webContents, view.webContents].forEach((contents1) => {
            contents1.setZoomLevel(newZoomLevel);
        });
        if (save) {
            void settings.set(`zoomLevels.${profileName}`, newZoomLevel);
        }
    };

    [win.webContents, view.webContents].forEach((contents) => {
        contents.on('zoom-changed', (__event, direction) => {
            let newZoomLevel = contents.getZoomLevel();
            if (direction === 'in') {
                newZoomLevel += 1;
            } else {
                newZoomLevel -= 1;
            }
            setNewZoomLevel(newZoomLevel, true);
        });

        contents.on('before-input-event', (__event, input) => {
            if (input.control
            && input.type === 'keyUp'
            && (input.key === '+' || input.key === '-')) {
                setNewZoomLevel(contents.getZoomLevel(), true);
            }
        });
    });

    void settings.get(
        `zoomLevels.${profileName}`,
    ).then((zoomLevel: number) => {
        [win.webContents, view.webContents].forEach((contents) => {
            contents.setZoomLevel(zoomLevel || 0);
        });
    });
}

export async function openConsoleWindow(
    profileName: string,
    state: ApplicationState,
    expiryTime: number,
    consoleUrl: string,
) {
    const dev = process.env.NODE_ENV !== 'production';
    // we do not have a window open for this session; need to open one
    const profileBounds = (await settings.get(`bounds.${profileName}`)) as BoundsPreference;
    const bounds = profileBounds ? profileBounds.bounds : {} as BoundsPreference;

    const windowOptions = {
        width: 1280,
        height: 1024,
        title: await getTitle('AWS Console', profileName, ''),
        webPreferences: {
            partition: ['persist', profileName].join(':'),
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
        show: false,
        ...bounds,
    };
    const win = new BrowserWindow(windowOptions);

    // save details of this profile's window
    state.addWindow(profileName, {
        window: win,
        browserViews: {},
        expiryTime,
    });

    win.loadURL(
        getWindowURL('tabs', profileName),
    ).catch((e) => {
        console.log(e);
    }).finally(() => { /* no action */ });
    win.webContents.on('did-finish-load', () => {
        if (dev) {
            win.webContents.openDevTools();
        }
        openTab(consoleUrl, profileName, state, win);
    });

    win.on('close', () => {
        // delete the window state from the app when it is closed
        if (state.windows[profileName].titleUpdateTimer) {
            clearInterval(state.windows[profileName].titleUpdateTimer);
        }
        state.removeWindow(profileName);
    });

    win.on('ready-to-show', () => {
        if (!state.windows[profileName].boundsChangedHandlerBound) {
            const boundsChangedFunction = debounce(
                () => windowBoundsChanged({ window: win, profileName }),
                100,
            );

            const resizeFunction = debounce(() => {
                windowBoundsChanged({ window: win, profileName });
                Object.values(state.windows[profileName].browserViews).forEach((view) => {
                    view.setBounds(getBrowserViewBounds(win));
                });
            }, 100);

            if (bounds) {
                if (profileBounds && profileBounds.maximised) {
                    win.maximize();
                }
            }
            win.show();

            // ugh,
            win.on('move', boundsChangedFunction);
            win.on('restore', resizeFunction);
            win.on('maximize', resizeFunction);
            win.on('unmaximize', resizeFunction);
            win.on('resize', resizeFunction);

            state.setBoundsChangeHandlerBound(profileName);
        }
    });
}
