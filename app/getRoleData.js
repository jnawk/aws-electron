const roleRegex = /arn:aws:iam::(\d{12}):role\/(.*)/

const getRoleData = ({profile, mfaCode}) => {
    const roleRegexResult = roleRegex.exec(profile.role_arn)
    const shouldDisable = profile.mfa_serial != undefined && mfaCode.length != 6

    // TODO the assumption that the role regex result has >= 3 entries is faulty
    const fullRoleName = roleRegexResult[2].replace(/-/g, String.fromCharCode(0x2011))
    let shortRoleName
    if(fullRoleName.length > 45) {
        shortRoleName = fullRoleName.substring(0, 20) + "..." + fullRoleName.substring(fullRoleName.length - 20)
    } else {
        shortRoleName = fullRoleName
    }
    const result = {
        roleRegexResult,
        shouldDisable,
        fullRoleName,
        shortRoleName
    }
    console.log(result)
    return result
}

module.exports.profileRows = ({
    usableProfiles,
    config,
    configType,
    mfaCode,
    clearMfaCode,
    launchConsole,
    launchButtonGenerator,
    profileRowGenerator
}) => {
    return usableProfiles.map(profileName => {
        const profile = config[profileName]
        const launchProfile = () => {
            launchConsole({profileName, mfaCode, configType})
            clearMfaCode()
        }

        const {
            roleRegexResult,
            shouldDisable,
            fullRoleName,
            shortRoleName
        } = getRoleData({profile, mfaCode})
        const launchButton = launchButtonGenerator({launchProfile, shouldDisable})

        return profileRowGenerator({
            profileName,
            roleRegexResult,
            fullRoleName,
            shortRoleName,
            profile,
            launchButton
        })
    })
}
