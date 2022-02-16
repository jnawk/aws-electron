import * as contextMenu from 'electron-context-menu';
import * as path from 'path';
import * as url from 'url';

import {
  BrowserWindow,
  Menu,
  app,
  ipcMain,
  webContents,
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
import { ApplicationState } from './types';
import rotateKey from './rotateKey';
import buildAppMenu from './menu';

const state: ApplicationState = {
  windows: {},
  launchWindowBoundsChangedHandlerBound: false,
  openPreferences(): void {
    if (state.preferencesWindow === undefined) {
      const options = {
        width: 1280,
        height: 1024,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          // worldSafeExecuteJavaScript: true,
          contextIsolation: true,
        },
      };

      state.preferencesWindow = new BrowserWindow(options);
      state.preferencesWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, './index.html'),
          protocol: 'file:',
          hash: '/settings',
          slashes: true,
        }),
      ).finally(() => { /* nothing */ });
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
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          // worldSafeExecuteJavaScript: true,
          contextIsolation: true,
        },
      };

      state.keyRotationWindow = new BrowserWindow(options);
      state.keyRotationWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, './index.html'),
          protocol: 'file:',
          hash: '/keyRotation',
          slashes: true,
        }),
      ).finally(() => { /* nothing */ });
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
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          // worldSafeExecuteJavaScript: true,
          contextIsolation: true,
        },
      };

      state.mfaCacheWindow = new BrowserWindow(options);

      state.mfaCacheWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, './index.html'),
          protocol: 'file:',
          hash: '/mfaCache',
          slashes: true,
        }),
      ).finally(() => { /* nothing */ });
      state.mfaCacheWindow.on('close', () => {
        delete state.mfaCacheWindow;
      });
    }
  },
};

let mainWindow: Electron.BrowserWindow | null;

type LaunchWindowBoundsSettings = {
    bounds: Electron.Rectangle,
    maximised?: boolean
}

function createWindow(): void {
  Menu.setApplicationMenu(buildAppMenu(state));

  const launchWindowBoundsSetting = settings.getSync('launchWindowBounds');
  let bounds: Electron.Rectangle & { maximised?: boolean } | null = null;
  let maximised = false;
  if (launchWindowBoundsSetting !== undefined
    && launchWindowBoundsSetting !== null) {
    const launchWindowBounds = launchWindowBoundsSetting.valueOf() as LaunchWindowBoundsSettings;
    bounds = launchWindowBounds.bounds;
    const m = launchWindowBounds.maximised;
    if (m !== undefined && m !== null) {
      maximised = m;
    }
  }

  const options = {
    width: 1280,
    height: 1024,
    webPreferences: {
      contextIsolation: true,
      devTools: process.env.NODE_ENV !== 'production',
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      // worldSafeExecuteJavaScript: true, // TODO from old
    },
    show: false,
    ...bounds,
  };

  mainWindow = new BrowserWindow(options);
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, './index.html'),
      protocol: 'file:',
      slashes: true,
    }),
  ).finally(() => { /* no action */ });

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

          const newBounds = mainWindow.getBounds();
          const maximised = mainWindow.isMaximized();

          settings.set(
            'launchWindowBounds',
            { bounds: { ...newBounds }, maximised },
          ).finally(() => { /* nothing */ });
        },
        100,
      );

      if (maximised) {
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
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

let nextTabNumber = 0;

app.on('web-contents-created', (_wccEvent, contents) => {
  contents.on('new-window', (newWindowEvent, initialUrl) => {
    if (newWindowEvent) {
      // if we receive a new window event, we want to cancel it and ...
      newWindowEvent.preventDefault();
    }
    // ... open a tab in our current window instead.
    // (assumes windows are only created in response to the user actually
    // doing something - seems reasonable)
    const focusedWindow: Electron.BrowserWindow | null = BrowserWindow.getFocusedWindow();

    if (focusedWindow) {
      focusedWindow.webContents.send(
        'open-tab',
        { url: initialUrl, tabNumber: nextTabNumber += 1 },
      );
    }
  });
});

ipcMain.handle('get-aws-config', () => getAWSConfig());

ipcMain.handle('get-preferences', () => settings.get('preferences'));
ipcMain.handle(
  'get-usable-profiles',
  (
    _event,
    { config, credentialsProfiles },
  ) => getUsableProfiles({ config, credentialsProfiles }),
);
ipcMain.handle(
  'get-mfa-profiles',
  (_event, { config }) => getCachableProfiles({ config }),
);

interface GetTitleArguments {
  title: string,
  profile: string
}

ipcMain.handle(
  'get-title',
  async (_event, { title, profile }: GetTitleArguments): Promise<string> => {
    const tabTitlePreference = await settings.get(
      'preferences.tabTitlePreference',
    );
    if (tabTitlePreference === '{profile} - {title}') {
      return `${profile} - ${title}`;
    } if (tabTitlePreference === '{title} - {profile}') {
      return `${title} - ${profile}`;
    }
    return title;
  },
);
ipcMain.handle(
  'rotate-key',
  (_event, { profile, aws, local }) => rotateKey({ profile, aws, local }),
);

type WindowBoundsChangedArguments = {
  window: Electron.BrowserWindow,
  profileName: string
}

function windowBoundsChanged({
  window, profileName,
}: WindowBoundsChangedArguments): void {
  const bounds = window.getBounds();
  const maximised = window.isMaximized();
  settings.set(
    `bounds.${profileName}`, { bounds: { ...bounds }, maximised },
  ).finally(
    () => { /* nothing */ },
  );
}

type AsyncLaunchConsoleArguments = {
  profileName: string,
  consoleUrl: string,
  expiryTime: number,
};

async function launchConsole({
  profileName,
  consoleUrl,
  expiryTime,
}: AsyncLaunchConsoleArguments): Promise<void> {
  const openTabArguments = {
    url: consoleUrl,
    profile: profileName,
    tabNumber: nextTabNumber += 1,
    expiryTime,
  };

  const profileSession = state.windows[profileName];
  if (profileSession) {
    // we already have a window open for this session, reuse it.
    profileSession.window.webContents.send('open-tab', openTabArguments);
    return;
  }

  const profileBounds = (await settings.get(`bounds.${profileName}`)) as any;
  const bounds = profileBounds ? profileBounds.bounds : {};

  // we do not have a window open for this session; need to open one
  const windowOptions = {
    width: 1280,
    height: 1024,
    title: `AWS Console - ${profileName}`,
    webPreferences: {
      partition: profileName,
      nodeIntegration: true,
      webviewTag: true, // TODO we aren't ready for this yet
      // worldSafeExecuteJavaScript: true,
      // contextIsolation: true
    },
    show: false,
    ...bounds,
  };

  const win = new BrowserWindow(windowOptions);

  // save details of this profile's wind
  state.windows[profileName] = {
    tabs: [],
    window: win,
  };

  win.loadURL(
    url.format({
      pathname: path.join(__dirname, './tabs.html'),
      protocol: 'file:',
      slashes: true,
    }),
  ).finally(() => { /* no action */ });

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('open-tab', openTabArguments);
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

      if (bounds) {
        if (bounds.maximised) {
          win.maximize();
        }
      }
      win.show();

      // ugh,
      win.on('move', boundsChangedFunction);
      win.on('restore', boundsChangedFunction);
      win.on('maximize', boundsChangedFunction);
      win.on('unmaximize', boundsChangedFunction);
      win.on('resize', boundsChangedFunction);

      state.windows[profileName].boundsChangedHandlerBound = true;
    }
  });
}

// ipcMain.on deals with ipcRenderer.send - these things don't want an answer
ipcMain.on(
  'set-preference',
  (_event, preference) => {
    settings.get('preferences').then(
      (preferences) => settings.set('preferences', {
        // existing preferences
        ...preferences as Record<string, unknown>,
        // plus the one we are setting
        ...preference,
      }),
    ).finally(
      () => { /* nothing */ },
    );
  },
);

interface LaunchConsoleArguments {
  profileName: string,
  mfaCode: string,
  configType: string
}

ipcMain.on(
  'launch-console',
  (
    _event,
    { profileName, mfaCode, configType }: LaunchConsoleArguments,
  ) => {
    const config = getAWSConfig()[configType];
    const targetProfileConfig = config[profileName];

    const expiryTime = new Date().getTime() + (
      targetProfileConfig.duration_seconds || 3600
    ) * 1000;

    getConsoleUrl(
      config, mfaCode, profileName,
    ).then(
      (consoleUrl) => launchConsole(
        { profileName, consoleUrl, expiryTime },
      ),
    ).catch((error) => {
      console.error(error, error.stack);
    });
  },
);

ipcMain.on(
  'do-mfa',
  (_event, {
    profileName,
    mfaCode,
  }: AsyncDoMfaArguments) => {
    doMfa({ profileName, mfaCode }).finally(() => { /* nothing */ });
  },
);

interface AddTabArguments {
  profileName: string,
  tabNumber: number
}

ipcMain.on(
  'add-tab',
  (_event, { profileName, tabNumber }: AddTabArguments) => {
  // we want to track the tabs a profile has open so when the last one closes
  // we can close the window.
    state.windows[profileName].tabs.push(tabNumber);
  },
);

interface AddHandlersArguments {
  contentsId: number,
  profile: string
}

ipcMain.on(
  'add-zoom-handlers',
  (_event, { contentsId, profile }: AddHandlersArguments) => {
    const contents = webContents.fromId(contentsId);

    contents.on('zoom-changed', (__event, direction) => {
      let newZoomLevel = contents.getZoomLevel();
      if (direction === 'in') {
        newZoomLevel += 1;
      } else {
        newZoomLevel -= 1;
      }
      contents.setZoomLevel(newZoomLevel);
      settings.set(
        `zoomLevels.${profile}`, newZoomLevel,
      ).finally(
        () => { /* nothing */ },
      );
    });

    contents.on('before-input-event', (__event, input) => {
      if (input.control) {
        if (input.type === 'keyUp') {
          if (input.key === '+' || input.key === '-') {
            settings.set(
              `zoomLevels.${profile}`,
              contents.getZoomLevel(),
            ).finally(
              () => { /* nothing */ },
            );
          }
        }
      }
    });

    settings.get(
      `zoomLevels.${profile}`,
    ).then((zoomLevel: number) => {
      contents.setZoomLevel(zoomLevel || 0);
    }).finally(
      () => { /* nothing */ },
    );
  },
);

ipcMain.on(
  'add-forward-back-handlers',
  (_event, { contentsId, profile }: AddHandlersArguments) => {
    state.windows[profile].window.on(
      'app-command',
      (__event: any, command: string) => {
        const contents = webContents.fromId(contentsId);
        if (command === 'browser-backward') {
          if (contents.canGoBack()) {
            contents.goBack();
          }
        } else if (command === 'browser-forward') {
          if (contents.canGoForward()) {
            contents.goForward();
          }
        }
      },
    );
  },
);

type AddContextMenuPrependParameters = {
  linkURL: string
}

ipcMain.on('add-context-menu', (_event, { contentsId }) => {
  const contents = webContents.fromId(contentsId);
  contextMenu({
    window: contents,
    prepend: (
      _defaultActions: any,
      parameters: AddContextMenuPrependParameters,
    ) => [
      {
        label: 'Open in new tab',
        click: () => {
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow === null) {
            throw new Error("Shouldn't happen");
          }
          focusedWindow.webContents.send(
            'open-tab',
            {
              url: parameters.linkURL,
              tabNumber: nextTabNumber += 1,
            },
          );
        },
        // Only show it when right-clicking links
        visible: parameters.linkURL !== '',
      },
      {
        label: 'Back',
        click: () => contents.goBack(),
        visible: contents.canGoBack(),
      },
      {
        label: 'Forwards',
        click: () => contents.goForward(),
        visible: contents.canGoForward(),
      },
    ],
  });
});

type CloseTabArguments = {
  profileName: string,
  tabNumber: number
}

ipcMain.on(
  'close-tab',
  (_event, {
    profileName, tabNumber,
  }: CloseTabArguments) => {
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