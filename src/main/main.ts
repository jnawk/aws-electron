import * as contextMenu from 'electron-context-menu';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

import {
    BrowserWindow,
    Menu,
    app,
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
    AddTabArguments,
    ApplicationState,
    BoundsPreference,
    CloseTabArguments,
    FrontendLaunchConsoleArguments,
    GetMfaProfilesArguments,
    GetTitleArguments,
    GetUsableProfilesArguments,
    HasVersion,
    LaunchConsoleArguments,
    OpenTabArguments,
    Preference,
    RotateKeyArguments,
    SwitchTabArguments,
    TabTitleOptions,
    WindowBoundsChangedArguments,
} from './types';
import rotateKey from './rotateKey';
import buildAppMenu from './menu';

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

ipcMain.handle('get-preferences', () => settings.get('preferences'));

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

ipcMain.handle(
    'get-title',
    async (_event, { title, profile }: GetTitleArguments): Promise<string> => {
        const tabTitlePreference = await settings.get(
            'preferences.tabTitlePreference',
        ) as TabTitleOptions;
        if (tabTitlePreference === '{profile} - {title}') {
            return [profile, title].join(' - ');
        }
        if (tabTitlePreference === '{title} - {profile}') {
            return [title, profile].join(' - ');
        }
        return title;
    },
);

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

async function launchConsole({
    profileName,
    consoleUrl,
    expiryTime,
}: LaunchConsoleArguments): Promise<void> {
    const profileSession = state.windows[profileName];
    let win: BrowserWindow;
    const tabHeight = 50;

    const getBrowserViewBounds = (window: BrowserWindow) => {
        const windowBounds = window.getBounds();
        return {
            x: 0,
            y: tabHeight,
            width: windowBounds.width - 800,
            height: windowBounds.height - (tabHeight + 30),
        };
    };

    const openTab = (urlToOpen: string) => {
        const tabNumber = (nextTabNumber += 1).toString();
        const openTabArguments: OpenTabArguments = {
            url: consoleUrl,
            profile: profileName,
            tabNumber,
            expiryTime,
        };

        win.webContents.send('open-tab', openTabArguments);

        const view = new BrowserView();
        view.setBounds(getBrowserViewBounds(win));
        void view.webContents.loadURL(urlToOpen);
        view.webContents.setWindowOpenHandler((details) => {
            console.log(details);
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
        state.windows[profileName].browserViews[tabNumber] = view;

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

    if (profileSession) {
        // we already have a window open for this session, reuse it.
        win = profileSession.window;
        openTab(consoleUrl);
    } else {
        // we do not have a window open for this session; need to open one
        const profileBounds = (await settings.get(`bounds.${profileName}`)) as BoundsPreference;
        const bounds = profileBounds ? profileBounds.bounds : {} as BoundsPreference;

        const windowOptions = {
            width: 1280,
            height: 1024,
            title: `AWS Console - ${profileName}`,
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
            tabs: [],
            window: win,
            browserViews: {},
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
            win.webContents.openDevTools();
            openTab(consoleUrl);
        });
        win.on('close', () => {
            // delete the window state from the app when it is closed
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

ipcMain.on(
    'launch-console',
    (
        _event,
        { profileName, mfaCode, configType }: FrontendLaunchConsoleArguments,
    ): void => {
        const config = getAWSConfig()[configType];
        if (config === undefined) {
            throw new Error("Config doesn't exist");
        }
        const expiryTime = new Date().getTime() + (
            config[profileName].duration_seconds || 3600
        ) * 1000;

        void getConsoleUrl(config, mfaCode, profileName).then(
            (consoleUrl) => launchConsole(
                { profileName, consoleUrl, expiryTime },
            ),
        ).catch((error: Error) => {
            console.error(error, error.stack);
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
    'add-tab',
    (_event, { profileName, tabNumber }: AddTabArguments): void => {
    // we want to track the tabs a profile has open so when the last one closes
    // we can close the window.
        state.windows[profileName].tabs.push(tabNumber);
    },
);

ipcMain.on(
    'switch-tab',
    (_event, { profile, tab }: SwitchTabArguments) => {
        const windowDetails = state.windows[profile];
        windowDetails.window.setBrowserView(windowDetails.browserViews[tab]);
    },
);

ipcMain.on(
    'close-tab',
    (_event, {
        profileName, tabNumber,
    }: CloseTabArguments): void => {
    // remove the tab tracking
        state.windows[profileName].tabs = (
            state.windows[profileName].tabs.filter((num: number) => tabNumber !== num)
        );

        if (state.windows[profileName].tabs.length === 0) {
            // no more tabs; close the window
            state.windows[profileName].window.close();
            // the close window handler will delete the window information
        }
    },
);

ipcMain.on('restart', (): void => {
    console.log('restarting');
    app.relaunch();
    app.quit();
});
