import * as path from 'path';
import { BrowserWindow } from 'electron';
import getApplicationVersion from './getApplicationVersion';
import { WindowDetails } from './types';
import getWindowURL from './getWindowURL';

export default class ApplicationState {
    nextTabNumber = 0;

    windows: {[key: string]: WindowDetails} = {};

    launchWindowBoundsChangedHandlerBound = false;

    version: string;

    preferencesWindow?: BrowserWindow;

    keyRotationWindow?: BrowserWindow;

    mfaCacheWindow?: BrowserWindow;

    constructor() {
        this.version = getApplicationVersion();
    }

    addWindow(profileName: string, details: WindowDetails) {
        this.windows[profileName] = details;
    }

    removeWindow(profileName: string) {
        delete this.windows[profileName];
    }

    setBoundsChangeHandlerBound(profileName: string) {
        this.windows[profileName].boundsChangedHandlerBound = true;
    }

    getNextTabNumber(): string {
        this.nextTabNumber += 1;
        return this.nextTabNumber.toString();
    }

    openPreferences(): void {
        if (this.preferencesWindow === undefined) {
            const options = {
                width: 1280,
                height: 1024,
                title: `AWS Console (v${this.version}) - Preferences`,
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    contextIsolation: true,
                },
            };

            this.preferencesWindow = new BrowserWindow(options);
            void this.preferencesWindow.loadURL(
                getWindowURL('settings'),
            );
            this.preferencesWindow.on('close', () => {
                delete this.preferencesWindow;
            });
        }
    }

    openKeyRotation(): void {
        if (this.keyRotationWindow === undefined) {
            const options = {
                width: 1280,
                height: 1024,
                title: `AWS Console (v${this.version}) - Key Rotation`,
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    contextIsolation: true,
                },
            };

            this.keyRotationWindow = new BrowserWindow(options);
            void this.keyRotationWindow.loadURL(
                getWindowURL('keyRotation'),
            );
            this.keyRotationWindow.on('close', () => {
                delete this.keyRotationWindow;
            });
        }
    }

    openMfaCache(): void {
        if (this.mfaCacheWindow === undefined) {
            const options = {
                width: 1280,
                height: 1024,
                title: `AWS Console (v${this.version}) - MFA Cache`,
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    contextIsolation: true,
                },
            };

            this.mfaCacheWindow = new BrowserWindow(options);

            void this.mfaCacheWindow.loadURL(
                getWindowURL('mfaCache'),
            );
            this.mfaCacheWindow.on('close', () => {
                delete this.mfaCacheWindow;
            });
        }
    }
}
