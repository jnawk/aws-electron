import { contextBridge, ipcRenderer } from 'electron';

import {
  Configs,
  DoMfaArguments,
  FrontendLaunchConsoleArguments,
  GetMfaProfilesArguments,
  GetUsableProfilesArguments,
  Preference,
  Preferences,
  RotateKeyArguments,
} from './types';

interface Backend {
  getAWSConfig: {(): Promise<Configs>},
  launchConsole: {(args: FrontendLaunchConsoleArguments): void},
  getUsableProfiles: {
    (args: GetUsableProfilesArguments): Promise<Array<string>>
  },
  getPreferences: {(): Promise<Preferences> },
  setPreference: {(preference: Preference): void},
  rotateKey: {
    (args: RotateKeyArguments): Promise<Array<string>>
  },
  getMfaProfiles: {
    (args: GetMfaProfilesArguments): Promise<Configs>
  },
  doMfa: {(args: DoMfaArguments): void}
  restart: {(): void}
}

declare global {
    interface Window {
      backend: Backend;
    }
  }

const backend: Backend = {
  getAWSConfig: () => ipcRenderer.invoke('get-aws-config'),

  launchConsole: ({
    profileName,
    mfaCode,
    configType,
  }) => ipcRenderer.send(
    'launch-console',
    { profileName, mfaCode, configType },
  ),

  getUsableProfiles: ({
    config,
    credentialsProfiles,
  }) => ipcRenderer.invoke('get-usable-profiles', { config, credentialsProfiles }),

  getPreferences: () => ipcRenderer.invoke('get-preferences'),

  setPreference: (preference): void => ipcRenderer.send('set-preference', preference),

  rotateKey: ({
    profile,
    aws,
    local,
  }) => ipcRenderer.invoke('rotate-key', { profile, aws, local }),

  getMfaProfiles: ({ config }): Promise<Configs> => ipcRenderer.invoke('get-mfa-profiles', { config }) as Promise<Configs>,

  doMfa: ({ profileName, mfaCode }) => ipcRenderer.send('do-mfa', { profileName, mfaCode }),

  restart: () => ipcRenderer.send('restart'),
};

contextBridge.exposeInMainWorld(
  'backend',
  backend,
);
