import * as fs from 'fs';
import {
    BrowserView,
    BrowserWindow,
} from 'electron';
import React, { MouseEventHandler } from 'react';
import * as https from 'https';
import { Credentials as AwsCredentials } from '@aws-sdk/client-sts';
import { AwsCredentialsProfile, AwsConfigProfile } from './awsConfigInterfaces';

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
    bounds?: Electron.Rectangle,
    maximised?: boolean,
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

export interface FrontendLaunchConsoleArguments {
    profileName: string,
    mfaCode: string,
    configType: ConfigType
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

export interface MinimalSessionDriver {
    defaultSession: {
        resolveProxy: {(url: string): Promise<string>}
    }
}

export interface GetHttpAgentArguments {
    url: string,
    ca?: string | Buffer | Array<string | Buffer>
    sessionDriver?: MinimalSessionDriver // for testing
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

export interface GetUsableProfilesArguments {
    config: AwsConfigFile,
    credentialsProfiles: Array<string>
}

export interface HasVersion {
    version: string
}

export interface IsMultiStageRoleAssumingProfileArguments {
    config: AwsConfigFile,
    profileName: string
}

export interface IsSingleRoleAssumingProfileArguments {
    profile: AwsConfigProfile,
    profileName: string,
    credentialsProfiles: Array<string>
}

export interface LaunchButton {
    (text?: string): React.ReactElement
}

export interface LaunchButtonGeneratorArguments {
    launchProfile: MouseEventHandler<HTMLButtonElement>,
    shouldDisable: boolean,
    wasExpired?: boolean
}

export interface LaunchConsoleArguments {
    profileName: string,
    consoleUrl: string,
    expiryTime: number,
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

export interface OpenTabArguments { // TODO kill this - we don't need interfaces with single props.
    tabNumber: string,
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
    configType: ConfigType,
    mfaCode: string,
    expiredCredentialsProfiles: Array<string>,
    clearMfaCode: {(): void},
    launchConsole: {(args: FrontendLaunchConsoleArguments): Promise<void>},
    launchButtonGenerator: {
        (args: LaunchButtonGeneratorArguments): LaunchButton
    },
    profileRowGenerator: {(args: ProfileRowArguments): React.ReactElement},
    onSuccess: {(credentialsProfileName: string): void},
    onError: {(credentialsProfileName: string): void}
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

export interface SwitchTabArguments {
    profile: string
    tab: string
}

export interface UpdateTabTitleArguments {
    tabNumber: string,
    title: string
}

export interface WindowDetails {
    window: BrowserWindow,
    boundsChangedHandlerBound?: boolean,
    zoomHandlerBound?: boolean,
    browserViews: {[key: string]: BrowserView}
    currentView?: string
    expiryTime: number,
    titleUpdateTimer?: NodeJS.Timeout
}

export interface WindowBoundsChangedArguments {
    window: BrowserWindow,
    profileName: string
}

export type AppPath = 'mfaCache' | 'tabs' | 'settings' | 'keyRotation'
export type AwsAction = 'RETAIN' | 'DISABLE' | 'DELETE'

export type ConfigType = 'awsConfig' | 'vaultConfig'

export type LocalAction = 'BACKUP' | 'DELETE'

export type Preference = VaultPreference | TabTitlePreference | UseGPUPreference
export type Preferences = VaultPreference & TabTitlePreference & UseGPUPreference

export type TabTitleOptions = '{title}' | '{title} - {profile}' | '{profile} - {title}'

export type TabTitlePreference = {
    tabTitlePreference?: TabTitleOptions,
    tabTitlePreferenceV2?: string,
}

export type UseGPUPreference = {
    useGPUPreference?: boolean
}

export type VaultOptions = 'ask' | 'aws' | 'vault'

export type VaultPreference = {
    vaultPreference?: VaultOptions,
}

// interface of untyped module...
export interface SplitCa {
    (filepath: number | fs.PathLike, split?: string, encoding?: string): Array<string>
}

export type NavigateDirection = 'forwards' | 'backwards'

export interface NavigateArguments {
    direction: NavigateDirection
    profile: string
    tab: string
}
