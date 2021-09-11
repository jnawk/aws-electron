const ini = require("ini")
const fs = require("fs")
const os = require("os")
const path = require("path")

const readFileOptions = {
    encoding: "utf-8", flags: "r"
}

const cleanProfileKey = key => {
    return key.replace("profile ", "")
}

const isLikelyVaultV4Config = config => {
    /*
      AWS Vault version 4 (and earlier, I dunno?) caused things like
      mfa_serial to be inheritable from the source_profile.  They have since
      learned the error of their ways, but no doubt there are misguided
      individuals out there still using this version's broken features.

      Having a mfa_serial on the default profile is a dead giveaway.
     */

    return Object.keys(config).map(key => config[key]).some(profile => {
        let sourceProfile = profile.source_profile
        if(!sourceProfile) {
            return false
        }

        sourceProfile = config[sourceProfile]
        if(!sourceProfile) {
            return false
        }

        return !!sourceProfile.mfa_serial
    })
}

const getAWSConfig = (awsConfigFile, awsCredentialsFile) => {
    if(!awsConfigFile) {
        awsConfigFile = path.join(os.homedir(), ".aws", "config")
    }
    if(!awsCredentialsFile) {
        awsCredentialsFile = path.join(os.homedir(), ".aws", "credentials")
    }

    const awsConfigFileContent = fs.readFileSync(awsConfigFile, readFileOptions)
    const awsCredentialsFileContent = fs.readFileSync(awsCredentialsFile, readFileOptions)
    const awsConfig = ini.parse(awsConfigFileContent)
    const awsCredentials = ini.parse(awsCredentialsFileContent)
    for(const key in awsConfig) {
        const value = awsConfig[key]
        delete awsConfig[key]
        awsConfig[cleanProfileKey(key)] = value
    }
    const configs = {
        awsConfig,
        credentialsProfiles: Object.keys(awsCredentials)
        vaultConfig: undefined,
    }
    if(isLikelyVaultV4Config(awsConfig)) {
        const vaultConfig = JSON.parse(JSON.stringify(awsConfig)) // this feels yuck
        for(const profile in vaultConfig) {
            if(vaultConfig[profile].source_profile) {
                const sourceProfile = vaultConfig[vaultConfig[profile].source_profile]
                for(const key in sourceProfile) {
                    if(!(key in vaultConfig[profile])) {
                        vaultConfig[profile][key] = sourceProfile[key]
                    }
                }
            }
        }
        configs.vaultConfig = vaultConfig
    } else {
        delete configs.vaultConfig
    }

    return configs
}

const getProfileList = (config, profileName) => {
    const profiles = [profileName]
    let profileConfig = config[profileName]
    while(profileConfig !== undefined && "source_profile" in profileConfig) {
        const sourceProfile = profileConfig.source_profile
        if (profiles.includes(sourceProfile)) {
            throw new Error(`Loop in profiles: ${profiles} + ${sourceProfile}`)
        }
        profiles.push(sourceProfile)
        const nextProfile = config[sourceProfile]

        if(nextProfile && nextProfile.role_arn === undefined) {
            // if we've found a config profile with no role_arn, then the chain
            // is supposed to stop with a credentials profile with the same name.
            profileConfig = undefined
        } else {
            profileConfig = nextProfile
        }
    }
    return profiles.reverse()
}

const isSingleRoleAssumingProfile = (
    {profile, profileName, credentialsProfiles}
) => {
    const credentialsProfile = profile.source_profile || profileName
    return (
        Object.keys(profile).includes("role_arn") &&
        credentialsProfiles.includes(credentialsProfile)
    )
}

const isMultiStageRoleAssumingProfile = (
    {config, profileName}
) => {
    const profileList = getProfileList(config, profileName)
    if(profileList.length < 2) {
        // can't be multi stage assume
        return false
    }

    // need to check for role_arn presence on all but the first profile
    for(let i = 1; i < profileList.length; ++i) {
        const profile = config[profileList[i]]
        if(profile.role_arn === undefined) {
            return false
        }
    }

    // since we are following source_profile chains, there necessarily is one
    // we aren't checking the credentials file in other places, so why do so
    // here?
    return true
}

const getUsableProfiles = ({config, credentialsProfiles}) => {
    return Object.keys(config).filter(key => {
        const profile = config[key]
        return isSingleRoleAssumingProfile(
            {profile, profileName: key, credentialsProfiles}
        ) || isMultiStageRoleAssumingProfile(
            {config, profileName: key, credentialsProfiles}
        )
    })
}

module.exports = {
    getAWSConfig,
    isLikelyVaultV4Config,
    getUsableProfiles,
    getProfileList,
}
