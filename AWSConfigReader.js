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
    /**
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
    }

    return configs
}

module.exports = { getAWSConfig, isLikelyVaultV4Config }
