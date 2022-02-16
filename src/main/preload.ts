import { contextBridge, ipcRenderer } from 'electron';

import {
  DoMfaArguments,
  GetMfaProfilesArguments,
  GetUsableProfilesArguments,
  LaunchConsoleArguments,
  RotateKeyArguments,
} from './types';

declare global {
    interface Window {
      backend: {
          getAWSConfig: {(): Promise<any>}, // TODO not any
          launchConsole: {(args: LaunchConsoleArguments): void}, // TODO not any
          getUsableProfiles: {
            (args: GetUsableProfilesArguments): Promise<any> // TODO not any
          },
          getPreferences: {(): Promise<any> }, // TODO not any
          setPreference: {(preference: Record<string, any>): void},
          rotateKey: {
            (args: RotateKeyArguments): Promise<any> // TODO not any
          },
          getMfaProfiles: {
            (args: GetMfaProfilesArguments): Promise<any> // TODO not any
          },
          doMfa: {(args: DoMfaArguments): void}
        };
    }
  }

contextBridge.exposeInMainWorld(
  'backend',
  {
    getAWSConfig: () => ipcRenderer.invoke('get-aws-config'),

    launchConsole: ({
      profileName,
      mfaCode,
      configType,
    }: LaunchConsoleArguments) => ipcRenderer.send(
      'launch-console',
      { profileName, mfaCode, configType },
    ),

    getUsableProfiles: ({
      config,
      credentialsProfiles,
    }: GetUsableProfilesArguments) => ipcRenderer.invoke('get-usable-profiles', { config, credentialsProfiles }),

    getPreferences: () => ipcRenderer.invoke('get-preferences'),

    setPreference: (preference: Record<string, any>) => ipcRenderer.send('set-preference', preference),

    rotateKey: ({
      profile,
      aws,
      local,
    }: RotateKeyArguments) => ipcRenderer.invoke('rotate-key', { profile, aws, local }),

    getMfaProfiles: ({ config }: GetMfaProfilesArguments) => ipcRenderer.invoke('get-mfa-profiles', { config }),

    doMfa: ({ profileName, mfaCode }: DoMfaArguments) => ipcRenderer.send('do-mfa', { profileName, mfaCode }),
  },
);
