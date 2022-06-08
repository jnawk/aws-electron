import { contextBridge, ipcRenderer } from 'electron';

import {
    Configs,
    DoMfaArguments,
    FrontendLaunchConsoleArguments,
    GetMfaProfilesArguments,
    GetUsableProfilesArguments,
    OpenTabArguments,
    Preference,
    // Preferences,
    RotateKeyArguments,
    SwitchTabArguments,
    UpdateTabTitleArguments,
} from './types';

// interface IBackend {
//     getAWSConfig: {(): Promise<Configs>},
//     launchConsole: {(args: FrontendLaunchConsoleArguments): void},
//     getUsableProfiles: {
//         (args: GetUsableProfilesArguments): Promise<Array<string>>
//     },
//     getPreferences: {(): Promise<Preferences> },
//     setPreference: {(preference: Preference): void},
//     rotateKey: {
//         (args: RotateKeyArguments): Promise<Array<string>>
//     },
//     getMfaProfiles: {
//         (args: GetMfaProfilesArguments): Promise<Configs>
//     },
//     doMfa: {(args: DoMfaArguments): void}
//     restart: {(): void}

//     register: {(callback: {(args: OpenTabArguments): void}): void}
//     switchTab: {(args: SwitchTabsArguments): void}
// }

declare global {
    interface Window {
        backend: Backend;
    }
}

class Backend /* implements IBackend */ {
    openTab: {(args: OpenTabArguments): void};

    constructor() {
        ipcRenderer.on('open-tab', (_event, args: OpenTabArguments) => {
            this.openTab(args);
        });
    }

    doMfa = (args: DoMfaArguments) => ipcRenderer.send('do-mfa', args)

    getAWSConfig = () => ipcRenderer.invoke('get-aws-config')

    getMfaProfiles = (args: GetMfaProfilesArguments): Promise<Configs> => ipcRenderer.invoke('get-mfa-profiles', args) as Promise<Configs>

    getPreferences = () => ipcRenderer.invoke('get-preferences')

    getUsableProfiles = (args: GetUsableProfilesArguments) => ipcRenderer.invoke('get-usable-profiles', args)

    launchConsole = (args: FrontendLaunchConsoleArguments) => ipcRenderer.send('launch-console', args)

    register = (callback: {(args: OpenTabArguments): void}) => { this.openTab = callback; };

    restart = () => ipcRenderer.send('restart')

    rotateKey = (args: RotateKeyArguments) => ipcRenderer.invoke('rotate-key', args)

    setPreference = (preference: Preference): void => ipcRenderer.send('set-preference', preference)

    switchTab = (args: SwitchTabArguments) => ipcRenderer.send('switch-tab', args)
}

contextBridge.exposeInMainWorld('backend', new Backend());
