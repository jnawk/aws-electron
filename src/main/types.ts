import {
  BrowserWindow,
} from 'electron';
import React, { MouseEventHandler } from 'react';
import * as https from 'https';
import { AwsCredentialsProfile, AwsConfigProfile } from './awsConfigInterfaces';

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

export interface AwsConfigFile {
  [key: string]: AwsConfigProfile
}

export interface AwsCredentialsFile {
  [key: string]: AwsCredentialsProfile
}

export interface Configs {
  awsConfig: AwsConfigFile,
  vaultConfig?: AwsConfigFile,
  credentialsProfiles: Array<string>,
  longTermCredentialsProfiles: Array<string>,
}

export interface LaunchConsoleArguments {
  profileName: string,
  mfaCode: string,
  configType: string
}

export interface GetUsableProfilesArguments {
  config: AwsConfigFile,
  credentialsProfiles: Array<string>
}

export type AwsAction = 'RETAIN' | 'DISABLE' | 'DELETE'
export type LocalAction = 'BACKUP' | 'DELETE'

export interface RotateKeyArguments {
  profile: string,
  aws: AwsAction,
  local: LocalAction
}

export interface GetMfaProfilesArguments {
  config: Configs
}

export interface DoMfaArguments {
  profileName: string,
  mfaCode: string
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

export interface LaunchButtonGeneratorArguments {
    launchProfile: MouseEventHandler<HTMLButtonElement>,
    shouldDisable: boolean
}

export interface LaunchButton {
    (text?: string): React.ReactElement
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
