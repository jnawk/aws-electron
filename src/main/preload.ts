import { contextBridge, ipcRenderer } from 'electron';

import {
    Configs,
    DoMfaArguments,
    FrontendLaunchConsoleArguments,
    GetMfaProfilesArguments,
    GetUsableProfilesArguments,
    OpenTabArguments,
    Preference,
    Preferences,
    RotateKeyArguments,
    SwitchTabArguments,
    UpdateTabTitleArguments,
} from './types';

declare global {
    interface Window {
        backend: Backend;
    }
}

class Backend {
    openTab: {(args: OpenTabArguments): void};

    updateTabTitle: {(args: UpdateTabTitleArguments): void};

    constructor() {
        ipcRenderer.on('open-tab', (_event, args: OpenTabArguments) => {
            this.openTab(args);
        });
        ipcRenderer.on('update-tab-title', (_event, args: UpdateTabTitleArguments) => {
            this.updateTabTitle(args);
        });
    }

    doMfa = (args: DoMfaArguments) => ipcRenderer.send('do-mfa', args);

    getAWSConfig = () => ipcRenderer.invoke('get-aws-config') as Promise<Configs>;

    getMfaProfiles = (args: GetMfaProfilesArguments): Promise<Configs> => ipcRenderer.invoke('get-mfa-profiles', args) as Promise<Configs>;

    getPreferences = () => ipcRenderer.invoke('get-preferences') as Promise<Preferences>;

    getUsableProfiles = (args: GetUsableProfilesArguments) => ipcRenderer.invoke('get-usable-profiles', args) as Promise<Array<string>>;

    launchConsole = (args: FrontendLaunchConsoleArguments) => ipcRenderer.send('launch-console', args);

    register = (
        openTab: {(args: OpenTabArguments): void},
        updateTabTitle: {(args: UpdateTabTitleArguments): void},
    ) => {
        this.openTab = openTab;
        this.updateTabTitle = updateTabTitle;
    };

    restart = () => ipcRenderer.send('restart');

    rotateKey = (args: RotateKeyArguments) => ipcRenderer.invoke('rotate-key', args);

    setPreference = (preference: Preference): void => ipcRenderer.send('set-preference', preference);

    switchTab = (args: SwitchTabArguments) => ipcRenderer.send('switch-tab', args);
}

contextBridge.exposeInMainWorld('backend', new Backend());
