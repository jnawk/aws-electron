import React, { MouseEventHandler } from 'react';

export interface GetRoleDataArguments {
    profile: any,
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

interface LaunchConsoleArguments {
    profileName: string,
    mfaCode: string,
    configType: string
}

export interface MfaRowArguments {
    profileName: string,
    profile: any, // TODO not any
    mfaButton: LaunchButton
}

export interface MfaRowsArguments {
    config: any, // TODO not any
    mfaCode: string,
    clearMfaCode: {(): void},
    doMfa: any, // TODO not any
    mfaButtonGenerator: {(args: LaunchButtonGeneratorArguments): LaunchButton},
    mfaRowGenerator: {(args: MfaRowArguments): React.ReactElement}
}

export interface Profile {
    mfa_serial: string,
    source_profile: string
}

export interface ProfileRowsArguments {
    usableProfiles: Array<string>,
    config: any, // TODO not any
    configType: string,
    mfaCode: string,
    clearMfaCode: {(): void},
    launchConsole: {(args: LaunchConsoleArguments): void},
    launchButtonGenerator: {
        (args: LaunchButtonGeneratorArguments): LaunchButton
    },
    profileRowGenerator: {(args: ProfileRowArguments): React.ReactElement}
}

export interface ProfileRowArguments {
    profileName: string,
    roleRegexResult: Array<string>,
    fullRoleName: string,
    shortRoleName: string,
    profile: Profile,
    launchButton: LaunchButton
}
