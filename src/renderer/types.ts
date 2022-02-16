import { MouseEventHandler } from 'react';
import { Button, Row } from 'reactstrap';

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
        tt: unknown;
        h1: unknown;
        p: unknown;
        i: unknown;
        b: unknown;
        input: unknown;
        div: unknown;
        }
    }
}

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
    (text?: string): Button
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
    mfaRowGenerator: {(args: MfaRowArguments): Row}
}

export interface Profile {
    mfa_serial: string,
    source_profile: string
}

interface ProfileRowGenerator {
    (args: ProfileRowArguments): Row
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
    profileRowGenerator: ProfileRowGenerator
}

export interface ProfileRowArguments {
    profileName: string,
    roleRegexResult: Array<string>,
    fullRoleName: string,
    shortRoleName: string,
    profile: Profile,
    launchButton: LaunchButton
}
