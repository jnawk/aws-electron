import * as fs from 'fs';
import {
  BrowserWindow,
} from 'electron';
import React, { MouseEventHandler } from 'react';
import * as https from 'https';
import { Rectangle } from 'electron/main';
import { Credentials as AwsCredentials } from '@aws-sdk/client-sts';
import { AwsCredentialsProfile, AwsConfigProfile } from './awsConfigInterfaces';

export interface ApplicationState {
  windows: {[key: string]: WindowDetails},

  openPreferences: {(): void},
  openKeyRotation: {(): void},
  openMfaCache: {(): void},

  mfaCacheWindow?: BrowserWindow,
  keyRotationWindow?: BrowserWindow,
  preferencesWindow?: BrowserWindow,

  launchWindowBoundsChangedHandlerBound: boolean
}

export interface AddContextMenuParameters {
  contentsId: number
}

export interface AddHandlersArguments {
  contentsId: number,
  profile: string
}

export interface AddTabArguments {
  profileName: string,
  tabNumber: number
}

export interface AssumeRoleParams {
  RoleArn: string,
  RoleSessionName: string,
  SerialNumber?: string,
  TokenCode?: string,
  DurationSeconds?: number
}

export interface AwsConfigFile {
  [key: string]: AwsConfigProfile
}

export interface AwsCredentialsFile {
  [key: string]: AwsCredentialsProfile
}

export interface BoundsPreference {
  bounds?: Rectangle,
  maximised?: boolean,
  [key: string]: any
}

export interface Configs {
  awsConfig: AwsConfigFile,
  vaultConfig?: AwsConfigFile,
  credentialsProfiles: Array<string>,
  longTermCredentialsProfiles: Array<string>,
}

export interface DoMfaArguments {
  profileName: string,
  mfaCode: string
}

export interface GetCachableProfilesArguments {
  config: Configs
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

export interface GetHttpAgentArguments {
  url: string,
  ca?: string | Buffer | Array<string | Buffer>
}

export interface GetMfaProfilesArguments {
  config: Configs
}

export interface GetRoleDataArguments {
  profile: AwsConfigProfile,
  mfaCode: string
}

export interface GetRoleDataResult {
  roleRegexResult: Array<string>,
  shouldDisable: boolean,
  fullRoleName: string,
  shortRoleName: string
}

export interface GetSigninTokenArguments {
  credentials: AwsCredentials,
  httpAgent: https.Agent
}

export interface GetTitleArguments {
  title: string,
  profile: string
}

export interface GetUsableProfilesArguments {
  config: AwsConfigFile,
  credentialsProfiles: Array<string>
}

export interface LaunchButtonGeneratorArguments {
    launchProfile: MouseEventHandler<HTMLButtonElement>,
    shouldDisable: boolean
}

export interface LaunchButton {
    (text?: string): React.ReactElement
}

export interface FrontendLaunchConsoleArguments {
  profileName: string,
  mfaCode: string,
  configType: 'awsConfig' | 'vaultConfig'
}

export interface LaunchConsoleArguments {
  profileName: string,
  consoleUrl: string,
  expiryTime: number,
}

export interface LaunchWindowBoundsSettings {
  bounds: Electron.Rectangle,
  maximised?: boolean
}

export interface MfaRowArguments {
    profileName: string,
    profile: AwsConfigProfile,
    mfaButton: LaunchButton
}

export interface MfaRowsArguments {
    config: Configs,
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
  profile: AwsConfigProfile,
  launchButton: LaunchButton
}

export interface ProfileRowsArguments {
    usableProfiles: Array<string>,
    config: AwsConfigFile,
    configType: string,
    mfaCode: string,
    clearMfaCode: {(): void},
    launchConsole: {(args: LaunchConsoleArguments): void},
    launchButtonGenerator: {
        (args: LaunchButtonGeneratorArguments): LaunchButton
    },
    profileRowGenerator: {(args: ProfileRowArguments): React.ReactElement}
}

export interface RotateKeyArguments {
  awsCredentialsFile?: string,
  profile: string,
  aws: AwsAction,
  local: LocalAction
}

export interface SigninResult {
    SigninToken: string
}

export interface WindowDetails {
    tabs: Array<any>,
    window: BrowserWindow,
    boundsChangedHandlerBound?: boolean
}

export type AwsAction = 'RETAIN' | 'DISABLE' | 'DELETE'
export type LocalAction = 'BACKUP' | 'DELETE'

export type VaultOptions = 'ask' | 'aws' | 'vault'
export type TabTitleOptions = '{title}' | '{title} - {profile}' | '{profile} - {title}'

export type VaultPreference = {
  vaultPreference?: VaultOptions
}

export type TabTitlePreference = {
  tabTitlePreference?: TabTitleOptions
}

export type Preference = VaultPreference | TabTitlePreference
export type Preferences = VaultPreference & TabTitlePreference

// interface of untyped module...
export interface SplitCa {
  (filepath: number | fs.PathLike, split?: string, encoding?: string): Array<string>
}
