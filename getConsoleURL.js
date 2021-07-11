const https = require("https")
const http = require("http")
const fetch = require("node-fetch")
const session = require("electron").session
const QueryString = require("query-string")
const ProxyAgent = require("proxy-agent")
const splitCa = require("split-ca")
const AWS = require("aws-sdk")

const { getProfileList } = require("./AWSConfigReader")

const consoleURL = "https://console.aws.amazon.com"
const stsEndpoint = "https://sts.amazonaws.com"


const getHttpAgent = async ({sessionDriver, url}) => {
    if(sessionDriver === undefined) {
        sessionDriver = session
    }

    let proxy = await sessionDriver.defaultSession.resolveProxy(url)

    if(proxy == "DIRECT") {
        if(url.match(/^https:\/\//i)) {
            return new https.Agent()
        }
        return new http.Agent()
    }

    proxy = proxy.replace(/PROXY ([^;]+);?/, "$1")
    const hasScheme = proxy.match(/^(https?):\/\//i)
    if(!hasScheme) {
        proxy = `http://${proxy}`
    }
    return ProxyAgent(proxy)
}

const configureProxy = async config => {
    // assume same proxy & CA bundle for all AWS endpoints
    const httpAgent = await getHttpAgent({url: stsEndpoint})
    if(config.ca_bundle !== undefined) {
        httpAgent.options = {
            ...httpAgent.options,
            ca: splitCa(config.ca_bundle),
            rejectUnauthorized: true
        }
    }

    AWS.config.update({ httpOptions: { agent: httpAgent } })
    return httpAgent
}


const getRoleCredentials = async (config, tokenCode, profileName) => {
    const profileList = getProfileList(config, profileName)

    // set the long-term credentials
    if(profileList.length == 1) {
        // the profile has a role to assume _and_ credentials to use.
        // (it needs a role, we can't work with it otherwise)
        AWS.config.credentials = new AWS.SharedIniFileCredentials({
            profile: profileName
        })
    } else {
        // the first profile in profileList contains the credentials,
        // (and maybe a role to assume)
        AWS.config.credentials = new AWS.SharedIniFileCredentials({
            profile: profileList[0]
        })
    }
    let credentials = null
    for(const profileNumber in profileList) {
        const profile = profileList[profileNumber]
        const profileConfig = config[profile]
        if(profileConfig !== undefined && "role_arn" in profileConfig) {
            // assume the role

            const assumeRoleParams = {
                RoleArn: profileConfig.role_arn,
                RoleSessionName: `${profileName}${new Date().getTime()}`
            }
            if(profileConfig.mfa_serial) {
            // this better only be on the first assume role profile in the chain!
                assumeRoleParams.SerialNumber = profileConfig.mfa_serial
                assumeRoleParams.TokenCode = tokenCode
            }
            if(profileConfig.duration_seconds) {
                assumeRoleParams.DurationSeconds = profileConfig.duration_seconds
            }
            const sts = new AWS.STS()
            const assumedRole = await sts.assumeRole(assumeRoleParams).promise()

            // update the credentials
            credentials = assumedRole.Credentials
            AWS.config.credentials = sts.credentialsFrom(assumedRole)
        } else {
            // this must be profile 0, and only credentials,
            // skip to the next
        }
    }

    return credentials
}

const getFederationUrl = params => {
    return `https://signin.aws.amazon.com/federation?${QueryString.stringify(params)}`
}

const getSigninToken = async ({credentials, httpAgent}) => {
    const getSigninTokenUrl = getFederationUrl({
        Action: "getSigninToken",
        DurationSeconds: 900,
        SessionType: "json",
        Session: JSON.stringify({
            sessionId: credentials.AccessKeyId,
            sessionKey: credentials.SecretAccessKey,
            sessionToken: credentials.SessionToken
        })
    })
    const fetchResult = await fetch(getSigninTokenUrl, { agent: httpAgent })
    const fetchJson = await fetchResult.json()
    return fetchJson.SigninToken
}

const getConsoleUrl = async (config, tokenCode, profileName) => {
    // determine if a proxy is necessary, and inject a CA bundle if defined.
    const httpAgent = await configureProxy(config)

    const roleCredentials = await getRoleCredentials(
        config, tokenCode, profileName
    )
    const signinToken = await getSigninToken(
        {credentials: roleCredentials, httpAgent}
    )

    return getFederationUrl({
        Action: "login",
        SigninToken: signinToken,
        Destination: consoleURL,
        SessionDuration: 43200
    })
}

module.exports = { getConsoleUrl, getHttpAgent, getProfileList }
