const AWS = require("aws-sdk")
const fetch = require("node-fetch")
const queryString = require("query-string")
const proxyAgent = require("proxy-agent")
const session = require("electron").session
const https = require("https")
const splitca = require("split-ca")

const federationURL = search => `https://signin.aws.amazon.com/federation?${search}`
const consoleURL = "https://console.aws.amazon.com"

const sessionJson = credentials => {
    return {
        sessionId: credentials.AccessKeyId,
        sessionKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken
    }
}

const signinTokenRequest = sessionJson => {
    return {
        Action: "getSigninToken",
        DurationSeconds: 900,
        SessionType: "json",
        Session: sessionJson
    }
}

const consoleURLRequest = token => {
    return {
        Action: "login",
        SigninToken: token,
        Destination: consoleURL,
        SessionDuration: 43200
    }
}

const getProxy = () => {
    return session.defaultSession.resolveProxy("https://sts.amazonaws.com")
        .then(proxy => {
            console.log("system proxy:", proxy)
            if(proxy == "DIRECT") {
                console.log("no proxy")
                return new https.Agent()
            }

            proxy = proxy.replace("PROXY ", "")
            proxy = proxy.replace(/[;\s+].*/, "")
            let hasScheme = proxy.match(/^(https?):\/\//i)
            if(!hasScheme) {
                proxy = `http://${proxy}`
            }
            console.log("proxy:", proxy)
            return proxyAgent(proxy)
        })
}

const patchCABundle = (agent, config) => {
    if(config.ca_bundle !== undefined) {
        console.log(`setting CA cert to ${config.ca_bundle}`)
        agent.options = {
            ...agent.options,
            ca: splitca(config.ca_bundle),
            rejectUnauthorized: true
        }
    } else {
        console.log("not overriding CA")
    }
    return agent
}

const injectProxyConfig = agent => AWS.config.update({ httpOptions: { agent: agent } })

const injectCredentials = config => AWS.config.credentials = new AWS.SharedIniFileCredentials({
    profile: config.source_profile
})

const makeAssumeRoleParams = (config, tokenCode, profileName) => {
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

    return assumeRoleParams
}

const getConsoleURL = (config, tokenCode, profileName) => {
    return getProxy()
        .then(agent => patchCABundle(agent, config))
        .then(injectProxyConfig)
        .then(() => injectCredentials(config))
        .then(() => makeAssumeRoleParams(config, tokenCode, profileName))
        .then(assumeRoleParams => new AWS.STS().assumeRole(assumeRoleParams).promise())
        .then(result => result.Credentials)
        .then(sessionJson)
        .then(JSON.stringify)
        .then(signinTokenRequest)
        .then(queryString.stringify)
        .then(federationURL)
        .then(fetch)
        .then(response => response.json())
        .then(json => json.SigninToken)
        .then(consoleURLRequest)
        .then(queryString.stringify)
        .then(federationURL)
}

module.exports = getConsoleURL
