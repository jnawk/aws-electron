const https = require("https")
const http = require("http")
const fetch = require("node-fetch")
const session = require("electron").session
const QueryString = require("query-string")
const ProxyAgent = require("proxy-agent")
const splitCa = require("split-ca")
const AWS = require("aws-sdk")


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
    // TODO alter this to handle multi-stage role assumption

    AWS.config.credentials = new AWS.SharedIniFileCredentials({
        profile: config.source_profile
    })

    const assumeRoleParams = {
        RoleArn: config.role_arn,
        RoleSessionName: profileName
    }
    if(config.mfa_serial) {
        assumeRoleParams.SerialNumber = config.mfa_serial
        assumeRoleParams.TokenCode = tokenCode
    }
    if(config.duration_seconds) {
        assumeRoleParams.DurationSeconds = config.duration_seconds
    }

    const assumedRole = await new AWS.STS().assumeRole(assumeRoleParams).promise()
    return assumedRole.Credentials
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

    const roleCredentials = await getRoleCredentials(config, tokenCode, profileName)
    const signinToken = await getSigninToken({roleCredentials, httpAgent})

    return getFederationUrl({
        Action: "login",
        SigninToken: signinToken,
        Destination: consoleURL,
        SessionDuration: 43200
    })
}

module.exports = { getConsoleUrl, getHttpAgent }
