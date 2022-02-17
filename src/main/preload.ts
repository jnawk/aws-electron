import { contextBridge, ipcRenderer } from 'electron';

import {
  Configs,
  DoMfaArguments,
  GetMfaProfilesArguments,
  GetUsableProfilesArguments,
  LaunchConsoleArguments,
  Preference,
  Preferences,
  RotateKeyArguments,
} from './types';

declare global {
    interface Window {
      backend: {
          getAWSConfig: {(): Promise<Configs>},
          launchConsole: {(args: LaunchConsoleArguments): void},
          getUsableProfiles: {
            (args: GetUsableProfilesArguments): Array<string>
          },
          getPreferences: {(): Promise<Preferences> },
          setPreference: {(preference: Preference): void},
          rotateKey: {
            (args: RotateKeyArguments): Promise<Array<string>>
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
