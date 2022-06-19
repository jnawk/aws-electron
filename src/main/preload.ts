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

    doMfa(args: DoMfaArguments) {
        ipcRenderer.send('do-mfa', args);
    }

    getAWSConfig() {
        return ipcRenderer.invoke('get-aws-config') as Promise<Configs>;
    }

    getMfaProfiles(args: GetMfaProfilesArguments): Promise<Configs> {
        return ipcRenderer.invoke('get-mfa-profiles', args) as Promise<Configs>;
    }

    getPreferences() {
        return ipcRenderer.invoke('get-preferences') as Promise<Preferences>;
    }

    getUsableProfiles(args: GetUsableProfilesArguments) {
        return ipcRenderer.invoke('get-usable-profiles', args) as Promise<Array<string>>;
    }

    async launchConsole(args: FrontendLaunchConsoleArguments) {
        const error = await (ipcRenderer.invoke('launch-console', args) as Promise<string | void>);
        if (error) {
            throw new Error(error);
        }
    }

    register(
        openTab: {(args: OpenTabArguments): void},
        updateTabTitle: {(args: UpdateTabTitleArguments): void},
    ) {
        this.openTab = openTab;
        this.updateTabTitle = updateTabTitle;
    }

    restart() {
        ipcRenderer.send('restart');
    }

    rotateKey(args: RotateKeyArguments) {
        return ipcRenderer.invoke('rotate-key', args);
    }

    setPreference(preference: Preference): void {
        ipcRenderer.send('set-preference', preference);
    }

    switchTab(args: SwitchTabArguments) {
        ipcRenderer.send('switch-tab', args);
    }

    closeTab(args: SwitchTabArguments) {
        ipcRenderer.send('close-tab', args);
    }
}

contextBridge.exposeInMainWorld('backend', new Backend());
