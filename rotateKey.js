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


const getAWSCredentials = async ({awsCredentialsFile}) => {
    const awsCredentialsFileContent = await fs.readFile(
        getAWSCredentialsFile({awsCredentialsFile}),
        readFileOptions
    )
    const awsCredentials = ini.parse(awsCredentialsFileContent)
    return awsCredentials
}

const rotateKey = async ({awsCredentialsFile, profile, aws, local}) => {
    const credentials = await getAWSCredentials({awsCredentialsFile})
    AWS.config.credentials = new AWS.SharedIniFileCredentials({
        profile: profile
    })

    const existingKeyId = credentials[profile].aws_access_key_id

    const iam = new AWS.IAM()

    const log = ["Getting user"]
    try {
        const user = await iam.getUser().promise()
        log.push("Creating new access key")
        const newKey = await iam.createAccessKey({UserName: user.User.UserName}).promise()

        if (local == "BACKUP") {
            credentials[`${profile}Backup`] = credentials[profile]
        }

        credentials[profile] = {
            aws_access_key_id: newKey.AccessKey.AccessKeyId,
            aws_secret_access_key: newKey.AccessKey.SecretAccessKey,
        }

        log.push("Writing credentials file")
        fs.writeFile(
            getAWSCredentialsFile({awsCredentialsFile}),
            ini.stringify(credentials),
            writeFileOptions,
        )

        if (aws == "RETAIN") {
            return ["Success"]
        }

        AWS.config.credentials = new AWS.SharedIniFileCredentials({
            profile: profile
        })

        log.push("Deactivating old Access Key")
        await iam.updateAccessKey({
            AccessKeyId: existingKeyId,
            Status: "Inactive",
        }).promise()

        if (aws == "DELETE") {
            log.push("Deleting old Access Key")
            await iam.deleteAccessKey({AccessKeyId: existingKeyId}).promise()
        }
    } catch {
        log.push("Failed")
        return log
    }
    return ["Success"]

}

module.exports = {
    rotateKey,
}
