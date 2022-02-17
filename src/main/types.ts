import {
  BrowserWindow,
} from 'electron';
import React, { MouseEventHandler } from 'react';
import * as https from 'https';
import { ConfigProfile } from './awsConfigInterfaces';

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

export interface Config {
  [key: string]: ConfigProfile
}

export interface Configs {
  awsConfig: Config,
  vaultConfig?: Config,
  credentialsProfiles: Array<string>,
  longTermCredentialsProfiles: Array<string>,
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

export interface GetRoleDataArguments {
    profile: ConfigProfile,
    mfaCode: string
}

export interface GetRoleDataResult {
    roleRegexResult: Array<string>,
    shouldDisable: boolean,
    fullRoleName: string,
    shortRoleName: string
}

export interface LaunchButtonGeneratorArguments {
    launchProfile: MouseEventHandler<HTMLButtonElement>,
    shouldDisable: boolean
}

export interface LaunchButton {
    (text?: string): React.ReactElement
}

export interface MfaRowArguments {
    profileName: string,
    profile: ConfigProfile,
    mfaButton: LaunchButton
}

export interface MfaRowsArguments {
    config: Config,
    mfaCode: string,
    clearMfaCode: {(): void},
    doMfa: {(args: DoMfaArguments): void},
    mfaButtonGenerator: {(args: LaunchButtonGeneratorArguments): LaunchButton},
    mfaRowGenerator: {(args: MfaRowArguments): React.ReactElement}
}

export interface ProfileRowArguments {
  profileName: string,
  roleRegexResult: Array<string>,
  fullRoleName: string,
  shortRoleName: string,
  profile: ConfigProfile,
  launchButton: LaunchButton
}

export interface ProfileRowsArguments {
    usableProfiles: Array<string>,
    config: Config,
    configType: string,
    mfaCode: string,
    clearMfaCode: {(): void},
    launchConsole: {(args: LaunchConsoleArguments): void},
    launchButtonGenerator: {
        (args: LaunchButtonGeneratorArguments): LaunchButton
    },
    profileRowGenerator: {(args: ProfileRowArguments): React.ReactElement}
}

export interface GetFederationUrlArguments {
  Action: string,
  SigninToken?: string,
  Destination?: string,
  SessionDuration?: number,
  DurationSeconds?: number,
  SessionType?: string,
  Session?: string,
}

export interface AWSCredentials {
  AccessKeyId: string,
  SecretAccessKey: string,
  SessionToken: string
}
export interface GetSigninTokenArguments {
  credentials: AWSCredentials,
  httpAgent: https.Agent
}

export interface SigninResult {
    SigninToken: string
}

export interface GetCachableProfilesArguments {
  config: Configs
}

export interface GetHttpAgentArguments {
  sessionDriver?: any,
  url: string,
  ca?: any
}

export interface AssumeRoleParams {
  RoleArn: string,
  RoleSessionName: string,
  SerialNumber?: string,
  TokenCode?: string,
  DurationSeconds?: number
}
