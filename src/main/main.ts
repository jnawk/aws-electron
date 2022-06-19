import * as path from 'path';

import {
    BrowserWindow,
    Menu,
    app,
    ipcMain,
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
    BoundsPreference,
    FrontendLaunchConsoleArguments,
    GetMfaProfilesArguments,
    GetUsableProfilesArguments,
    LaunchConsoleArguments,
    Preference,
    RotateKeyArguments,
    SwitchTabArguments,
} from './types';
import rotateKey from './rotateKey';
import buildAppMenu from './menu';
import getWindowURL from './getWindowURL';
import getPreferences from './getPreferences';
import { openTab, openConsoleWindow } from './consoleWindow';
import ApplicationState from './applicationState';

let mainWindow: Electron.BrowserWindow | null;

const state = new ApplicationState();

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
        },
        show: false,
        ...launchWindowBoundsSetting.bounds,
    };

    mainWindow = new BrowserWindow(options);
    void mainWindow.loadURL(
        getWindowURL(),
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

ipcMain.handle(
    'rotate-key',
    (_event, { profile, aws, local }: RotateKeyArguments) => rotateKey({ profile, aws, local }),
);

function launchConsole({
    profileName,
    consoleUrl,
    expiryTime,
}: LaunchConsoleArguments) {
    const profileSession = state.windows[profileName];
    if (profileSession) {
        // we already have a window open for this session, reuse it.
        const win = profileSession.window;
        profileSession.expiryTime = expiryTime;
        openTab(consoleUrl, profileName, state, win);
    } else {
        void openConsoleWindow(profileName, state, expiryTime, consoleUrl);
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
