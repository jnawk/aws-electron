import React from 'react';
import {
    GetRoleDataArguments,
    GetRoleDataResult,
    MfaRowsArguments,
    ProfileRowsArguments,
} from '_main/types';

const roleRegex = /arn:aws:iam::(\d{12}):role\/(.*)/;

function getRoleData({
    profile, mfaCode,
}: GetRoleDataArguments): GetRoleDataResult {
    if (profile.role_arn === undefined) {
        throw new Error('need a role arn'); // ??
    }
    const roleRegexResult = roleRegex.exec(profile.role_arn);
    const shouldDisable = (profile.mfa_serial !== undefined && mfaCode.length !== 6);

    if (roleRegexResult === null) {
        throw new Error('WTF is going on');
    }

    // TODO the assumption that the role regex result has >= 3 entries is faulty
    const fullRoleName = roleRegexResult[2].replace(/-/g, String.fromCharCode(0x2011));
    let shortRoleName: string;
    if (fullRoleName && fullRoleName.length > 45) {
        const first20 = fullRoleName.substring(0, 20);
        const last20 = fullRoleName.substring(fullRoleName.length - 20);
        shortRoleName = `${first20}...${last20}`;
    } else {
        shortRoleName = fullRoleName;
    }
    const result = {
        roleRegexResult,
        shouldDisable,
        fullRoleName,
        shortRoleName,
    };
    return result;
}

export function profileRows({
    usableProfiles,
    config,
    configType,
    mfaCode,
    expiredCredentialsProfiles,
    clearMfaCode,
    launchConsole,
    launchButtonGenerator,
    profileRowGenerator,
    onSuccess,
    onError,
}: ProfileRowsArguments): Array<React.ReactElement> {
    return usableProfiles.map((profileName: string) => {
        const profile = config[profileName];
        const launchProfile = () => {
            launchConsole({ profileName, mfaCode, configType }).then(() => {
                if (profile.source_profile) {
                    onSuccess(profile.source_profile);
                }
            }).catch(() => {
                if (profile.source_profile) {
                    onError(profile.source_profile);
                }
            }).finally(() => {
                clearMfaCode();
            });
        };

        const {
            roleRegexResult,
            shouldDisable,
            fullRoleName,
            shortRoleName,
        } = getRoleData({
            profile, mfaCode,
        });
        const launchButton = launchButtonGenerator({
            launchProfile,
            shouldDisable,
            wasExpired: profile.source_profile ? expiredCredentialsProfiles.includes(profile.source_profile) : undefined,
        });

        return profileRowGenerator({
            profileName,
            roleRegexResult,
            fullRoleName,
            shortRoleName,
            profile,
            launchButton,
        });
    });
}

export function mfaRows({
    config,
    mfaCode,
    clearMfaCode,
    doMfa,
    mfaButtonGenerator,
    mfaRowGenerator,
}: MfaRowsArguments): Array<React.ReactElement> {
    return Object.keys(config.awsConfig).map((profileName): React.ReactElement => {
        const profile = config.awsConfig[profileName];
        const launchProfile = () => {
            doMfa({ profileName, mfaCode });
            clearMfaCode();
        };

        const shouldDisable = mfaCode.length !== 6;
        const mfaButton = mfaButtonGenerator({ launchProfile, shouldDisable });

        return mfaRowGenerator({
            profileName,
            profile,
            mfaButton,
        });
    });
}
