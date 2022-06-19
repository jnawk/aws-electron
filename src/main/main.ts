import * as contextMenu from 'electron-context-menu';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import * as sprintf from 'sprintf-js';

import {
    BrowserWindow,
    Menu,
    app,
    clipboard,
    ipcMain,
    BrowserView,
} from 'electron';

// these can't be default imports
import * as debounce from 'debounce';
import * as settings from 'electron-settings';

import {
    AsyncDoMfaArguments,
    doMfa,
} from './mfaCache';

import {
    getAWSConfig,
    getCachableProfiles,
    getUsableProfiles,
} from './AWSConfigReader';

import { getConsoleUrl } from './getConsoleURL';
import {
    ApplicationState,
    BoundsPreference,
    FrontendLaunchConsoleArguments,
    GetMfaProfilesArguments,
    GetUsableProfilesArguments,
    HasVersion,
    LaunchConsoleArguments,
    OpenTabArguments,
    Preference,
    Preferences,
    RotateKeyArguments,
    SwitchTabArguments,
    TabTitleOptions,
    WindowBoundsChangedArguments,
} from './types';
import rotateKey from './rotateKey';
import buildAppMenu from './menu';
import timeRemainingMessage from './timeRemaining';

let mainWindow: Electron.BrowserWindow | null;
let nextTabNumber = 0;

function getApplicationVersion(): string {
    const readFileOptions = {
        encoding: 'utf-8' as const, flag: 'r' as const,
    };
    const packageJsonFile = fs.readFileSync(path.join(app.getAppPath(), 'package.json'), readFileOptions);
    const packageJson = JSON.parse(packageJsonFile) as HasVersion;
    return packageJson.version;
}

const state: ApplicationState = {
    windows: {},
    launchWindowBoundsChangedHandlerBound: false,
    version: getApplicationVersion(),
    openPreferences(): void {
        if (state.preferencesWindow === undefined) {
            const options = {
                width: 1280,
                height: 1024,
                title: `AWS Console (v${state.version}) - Preferences`,
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    // worldSafeExecuteJavaScript: true,
                    contextIsolation: true,
                },
            };

            state.preferencesWindow = new BrowserWindow(options);
            void state.preferencesWindow.loadURL(
                url.format({
                    pathname: path.join(__dirname, './index.html'),
                    protocol: 'file:',
                    hash: '/settings',
                    slashes: true,
                }),
            );
            state.preferencesWindow.on('close', () => {
                delete state.preferencesWindow;
            });
        }
    },

    openKeyRotation(): void {
        if (state.keyRotationWindow === undefined) {
            const options = {
                width: 1280,
                height: 1024,
                title: `AWS Console (v${state.version}) - Key Rotation`,
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    // worldSafeExecuteJavaScript: true,
                    contextIsolation: true,
                },
            };

            state.keyRotationWindow = new BrowserWindow(options);
            void state.keyRotationWindow.loadURL(
                url.format({
                    pathname: path.join(__dirname, './index.html'),
                    protocol: 'file:',
                    hash: '/keyRotation',
                    slashes: true,
                }),
            );
            state.keyRotationWindow.on('close', () => {
                delete state.keyRotationWindow;
            });
        }
    },

    openMfaCache(): void {
        if (state.mfaCacheWindow === undefined) {
            const options = {
                width: 1280,
                height: 1024,
                title: `AWS Console (v${state.version}) - MFA Cache`,
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    // worldSafeExecuteJavaScript: true,
                    contextIsolation: true,
                },
            };

            state.mfaCacheWindow = new BrowserWindow(options);

            void state.mfaCacheWindow.loadURL(
                url.format({
                    pathname: path.join(__dirname, './index.html'),
                    protocol: 'file:',
                    hash: '/mfaCache',
                    slashes: true,
                }),
            );
            state.mfaCacheWindow.on('close', () => {
                delete state.mfaCacheWindow;
            });
        }
    },
};

function createWindow(): void {
    Menu.setApplicationMenu(buildAppMenu(state));

    console.log(`settings file: ${settings.file()}`);
    const launchWindowBoundsSetting = (settings.getSync('launchWindowBounds') || {}) as BoundsPreference;

    const options = {
        width: 1280,
        height: 1024,
        title: `AWS Console (v${state.version})`,
        webPreferences: {
            contextIsolation: true,
            devTools: process.env.NODE_ENV !== 'production',
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
            // worldSafeExecuteJavaScript: true, // TODO from old
        },
        show: false,
        ...launchWindowBoundsSetting.bounds,
    };

    mainWindow = new BrowserWindow(options);
    void mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, './index.html'),
            protocol: 'file:',
            slashes: true,
        }),
    );

    // win.toggleDevTools();

    mainWindow.on('ready-to-show', () => {
        if (mainWindow === null) {
            throw new Error('WTF is going on');
        }

        if (!state.launchWindowBoundsChangedHandlerBound) {
            const boundsChangedFunction = debounce(
                () => {
                    if (mainWindow === null) {
                        throw new Error('WTF is going on');
                    }

                    const launchWindowBounds = {
                        bounds: { ...mainWindow.getBounds() },
                        maximised: mainWindow.isMaximized(),
                    };
                    void settings.set(
                        'launchWindowBounds',
                        launchWindowBounds,
                    );
                },
                100,
            );

            if (launchWindowBoundsSetting
        && launchWindowBoundsSetting.maximised) {
                mainWindow.maximize();
            }
            mainWindow.show();

            // ugh
            mainWindow.on('move', boundsChangedFunction);
            mainWindow.on('restore', boundsChangedFunction);
            mainWindow.on('maximize', boundsChangedFunction);
            mainWindow.on('unmaximize', boundsChangedFunction);
            mainWindow.on('resize', boundsChangedFunction);
            state.launchWindowBoundsChangedHandlerBound = true;
        }
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
        mainWindow = null;
    });
}

const useGPU = settings.getSync('preferences.useGPUPreference');
if (useGPU !== undefined && useGPU === false) {
    console.log('disabling hardware accelaration');
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-gpu-sandbox');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.handle('get-aws-config', () => getAWSConfig());

const getPreferences = async () => {
    const translateTitlePreference = (title: TabTitleOptions) => title.replaceAll('}', ')s').replaceAll('{', '%(');
    const preferences = (await settings.get('preferences')) as Preferences;
    if (preferences.tabTitlePreferenceV2) {
        return preferences;
    }
    if (preferences.tabTitlePreference) {
        preferences.tabTitlePreferenceV2 = translateTitlePreference(preferences.tabTitlePreference);
    }
    return preferences;
};

ipcMain.handle('get-preferences', getPreferences);

ipcMain.handle(
    'get-usable-profiles',
    (
        _event,
        { config, credentialsProfiles }: GetUsableProfilesArguments,
    ) => getUsableProfiles({ config, credentialsProfiles }),
);

ipcMain.handle(
    'get-mfa-profiles',
    (_event, { config }: GetMfaProfilesArguments) => getCachableProfiles({ config }),
);

async function getTitle(title: string, profile: string, timeLeft: string) {
    const preferences = await getPreferences();
    if (preferences.tabTitlePreferenceV2) {
        return sprintf.sprintf(preferences.tabTitlePreferenceV2, {
            profile, title, timeLeft,
        });
    }
    return title;
}

ipcMain.handle(
    'rotate-key',
    (_event, { profile, aws, local }: RotateKeyArguments) => rotateKey({ profile, aws, local }),
);

function windowBoundsChanged({
    window, profileName,
}: WindowBoundsChangedArguments): void {
    const windowBounds = {
        bounds: { ...window.getBounds() },
        maximised: window.isMaximized(),
    };

    void settings.set(`bounds.${profileName}`, windowBounds);
}

const getTimeLeft = (profileName: string): string => {
    const profileSession = state.windows[profileName];
    const currentTime = new Date().getTime();
    const timeToGo = profileSession.expiryTime - currentTime;
    if (timeToGo < 1000 && profileSession.titleUpdateTimer) {
        clearInterval(profileSession.titleUpdateTimer);
        profileSession.titleUpdateTimer = undefined;
        return profileSession.window.getTitle();
    }
    return timeRemainingMessage(timeToGo);
};

async function launchConsole({
    profileName,
    consoleUrl,
    expiryTime,
}: LaunchConsoleArguments): Promise<void> {
    let win: BrowserWindow;
    const tabHeight = 55;
    const dev = process.env.NODE_ENV !== 'production';

    const getBrowserViewBounds = (window: BrowserWindow) => {
        const windowBounds = window.getBounds();

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
    };

    const openTab = (urlToOpen: string) => {
        const profileSession = state.windows[profileName];
        const tabNumber = (nextTabNumber += 1).toString();
        const openTabArguments: OpenTabArguments = {
            url: consoleUrl,
            profile: profileName,
            tabNumber,
            expiryTime,
        };
        if (profileSession.titleUpdateTimer) {
            clearInterval(profileSession.titleUpdateTimer);
        }
        profileSession.titleUpdateTimer = setInterval(() => {
            void (async () => {
                win.setTitle(
                    await getTitle(
                        'AWS Console',
                        profileName,
                        getTimeLeft(profileName),
                    ),
                );
            })();
        }, 1000);
        win.webContents.send('open-tab', openTabArguments);

        const view = new BrowserView({
            webPreferences: {
                partition: profileName,
            },
        });
        view.setBounds(getBrowserViewBounds(win));
        void view.webContents.loadURL(urlToOpen);
        view.webContents.setWindowOpenHandler((details) => {
            openTab(details.url);
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
                        openTab(parameters.linkURL);
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
    };

    const profileSession = state.windows[profileName];
    if (profileSession) {
        // we already have a window open for this session, reuse it.
        win = profileSession.window;
        profileSession.expiryTime = expiryTime;
        openTab(consoleUrl);
    } else {
        // we do not have a window open for this session; need to open one
        const profileBounds = (await settings.get(`bounds.${profileName}`)) as BoundsPreference;
        const bounds = profileBounds ? profileBounds.bounds : {} as BoundsPreference;

        const windowOptions = {
            width: 1280,
            height: 1024,
            title: await getTitle('AWS Console', profileName, ''),
            webPreferences: {
                partition: profileName,
                nodeIntegration: false,
                preload: path.join(__dirname, 'preload.js'),
                // worldSafeExecuteJavaScript: true,
                contextIsolation: true,
            },
            show: false,
            ...bounds,
        };
        win = new BrowserWindow(windowOptions);

        // save details of this profile's window
        state.windows[profileName] = {
            window: win,
            browserViews: {},
            expiryTime,
        };
        win.loadURL(
            url.format({ // TODO replace this
                pathname: path.join(__dirname, './index.html'),
                protocol: 'file:',
                hash: `/tabs/${profileName}`,
                slashes: true,
            }),
        ).catch((e) => {
            console.log(e);
        }).finally(() => { /* no action */ });
        win.webContents.on('did-finish-load', () => {
            if (dev) {
                win.webContents.openDevTools();
            }
            openTab(consoleUrl);
        });

        win.on('close', () => {
            // delete the window state from the app when it is closed
            if (state.windows[profileName].titleUpdateTimer) {
                clearInterval(state.windows[profileName].titleUpdateTimer);
            }
            delete state.windows[profileName];
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

                state.windows[profileName].boundsChangedHandlerBound = true;
            }
        });
    }
}

// ipcMain.on deals with ipcRenderer.send - these things don't want an answer
ipcMain.on(
    'set-preference',
    (_event, preference: Preference) => {
        void settings.get('preferences').then(
            (preferences) => {
                const newPreference = JSON.parse(JSON.stringify(preference)) as {[key: string]: string };
                const existingPreferences = JSON.parse(JSON.stringify(preferences || {})) as {[key: string]: string};

                return settings.set('preferences', {
                    ...existingPreferences,
                    ...newPreference,
                });
            },
        );
    },
);

ipcMain.handle(
    'launch-console',
    (
        _event,
        { profileName, mfaCode, configType }: FrontendLaunchConsoleArguments,
    ): Promise<string | void> => {
        const config = getAWSConfig()[configType];
        if (config === undefined) {
            throw new Error("Config doesn't exist");
        }
        const expiryTime = new Date().getTime() + (
            config[profileName].duration_seconds || 3600
        ) * 1000;

        return getConsoleUrl(config, mfaCode, profileName).then(
            (consoleUrl) => launchConsole(
                { profileName, consoleUrl, expiryTime },
            ),
        ).catch((error: Error) => {
            if (['InvalidClientTokenId', 'ExpiredToken'].includes(error.name)) {
                return error.name;
            }
            console.error(error, error.stack);
            return undefined;
        });
    },
);

ipcMain.on(
    'do-mfa',
    (_event, {
        profileName,
        mfaCode,
    }: AsyncDoMfaArguments): void => {
        void doMfa({ profileName, mfaCode });
    },
);

ipcMain.on(
    'switch-tab',
    (_event, { profile, tab }: SwitchTabArguments) => {
        const windowDetails = state.windows[profile];
        windowDetails.currentView = tab;
        windowDetails.window.setBrowserView(windowDetails.browserViews[tab]);
    },
);

ipcMain.on('close-tab', (_event, { profile, tab }: SwitchTabArguments) => {
    const view = state.windows[profile].browserViews[tab];

    // this casting is ugly as fuck.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    (view.webContents as any).destroy();

    delete state.windows[profile].browserViews[tab];
    if (Object.keys(state.windows[profile].browserViews).length === 0) {
        state.windows[profile].window.close();
        // window's close handler will delete the window state.
    }
});

ipcMain.on('restart', (): void => {
    console.log('restarting');
    app.relaunch();
    app.quit();
});
