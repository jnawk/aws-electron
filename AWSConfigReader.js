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

module.exports = {
    getAWSConfig: (awsConfigFile, options) => {
        if(!awsConfigFile) {
            awsConfigFile = path.join(os.homedir(), ".aws", "config")
        }
        const awsConfigFileContent = fs.readFileSync(awsConfigFile, readFileOptions)
        const awsConfig = ini.parse(awsConfigFileContent)
        for(let key in awsConfig) {
            const value = awsConfig[key]
            delete awsConfig[key]
            awsConfig[cleanProfileKey(key)] = value
        }
        if(options && options.vault) {
            for(const profile in awsConfig) {
                if(awsConfig[profile].source_profile) {
                    const sourceProfile = awsConfig[awsConfig[profile].source_profile]
                    for(const key in sourceProfile) {
                        if(!(key in awsConfig[profile])) {
                            awsConfig[profile][key] = sourceProfile[key]
                        }
                    }
                }
            }
        }
        return awsConfig
    },

    isLikelyVaultV4Config: config => {
        /**
          AWS Vault version 4 (and earlier, I dunno?) caused things like
          mfa_serial to be inheritable from the source_profile.  They have since
          learned the error of their ways, but no doubt there are misguided
          individuals out there still using this version's broken features.
         
          Having a mfa_serial on the default profile is a dead giveaway.
         */
        if(!config.default) {
            return false
        }
        if(config.default.mfa_serial) {
            return true
        }

        return false
    }
}
