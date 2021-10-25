const ini = require("ini")
const fs = require("fs").promises
const os = require("os")
const path = require("path")
const AWS = require("aws-sdk")

const readFileOptions = {
    encoding: "utf-8", flags: "r"
}

const writeFileOptions = {
    encoding: "utf-8", mode: 0o600
}


const getAWSCredentialsFile = ({awsCredentialsFile}) => {
    return awsCredentialsFile || path.join(os.homedir(), ".aws", "credentials")
}

const getAWSConfigFile = ({awsConfigFile}) => {
    return awsConfigFile || path.join(os.homedir(), ".aws", "config")
}

const getAWSConfig = async({awsConfigFile}) => {
    const awsConfigFileContent = await fs.readFile(
        getAWSConfigFile({awsConfigFile}),
        readFileOptions
    )
    const awsCredentials = ini.parse(awsConfigFileContent)
    return awsCredentials
}


const getAWSCredentials = async ({awsCredentialsFile}) => {
    const awsCredentialsFileContent = await fs.readFile(
        getAWSCredentialsFile({awsCredentialsFile}),
        readFileOptions
    )
    const awsCredentials = ini.parse(awsCredentialsFileContent)
    return awsCredentials
}

const doMfa = async ({awsConfigFile, awsCredentialsFile, profileName, mfaCode}) => {
    const config = await getAWSConfig({awsConfigFile})
    const credentials = await getAWSCredentials({awsCredentialsFile})

    if (profileName in credentials) {
        if (credentials[profileName].aws_access_key_id.startsWith("ASIA")) {
            AWS.config.credentials = new AWS.SharedIniFileCredentials({
                profile: `${profileName}::source-profile`
            })
        } else {
            AWS.config.credentials = new AWS.SharedIniFileCredentials({
                profile: profileName
            })

            credentials[`${profileName}::source-profile`] = credentials[profileName]
        }
    }

    const sts = new AWS.STS()
    const temporaryCredentials = (await sts.getSessionToken({
        SerialNumber: config[`profile ${profileName}`].mfa_serial,
        TokenCode: mfaCode,
        DurationSeconds: 86400
    }).promise()).Credentials
    credentials[profileName] = {
        aws_access_key_id: temporaryCredentials.AccessKeyId,
        aws_secret_access_key: temporaryCredentials.SecretAccessKey,
        aws_session_token: temporaryCredentials.SessionToken
    }

    fs.writeFile(
        getAWSCredentialsFile({awsCredentialsFile}),
        ini.stringify(credentials),
        writeFileOptions,
    )
}

module.exports = {
    doMfa,
}
