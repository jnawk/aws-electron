import {
  BrowserWindow,
} from 'electron';

export interface ApplicationState {
  windows: {[key: string]: any},

  openPreferences: {(): void},
  openKeyRotation: {(): void},
  openMfaCache: {(): void},

  mfaCacheWindow?: BrowserWindow,
  keyRotationWindow?: BrowserWindow,
  preferencesWindow?: BrowserWindow,

  launchWindowBoundsChangedHandlerBound: boolean
}

export interface LaunchConsoleArguments {
  profileName: string,
  mfaCode: string,
  configType: string
}

export interface GetUsableProfilesArguments {
  config: any, // TOD not any
  credentialsProfiles: any // TODO not any
}

export interface RotateKeyArguments {
  profile: string,
  aws: any, // TODO not any
  local: any // TODO not any
}

export interface GetMfaProfilesArguments {
  config: any // TODO not any
}

export interface DoMfaArguments {
  profileName: string,
  mfaCode: string
}
