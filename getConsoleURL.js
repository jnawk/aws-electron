const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const queryString = require('query-string');
const proxy = require('proxy-agent');
const https = require('https');
const fs = require('fs');

const federationURL = search => `https://signin.aws.amazon.com/federation?${search}`;
const consoleURL = 'https://console.aws.amazon.com';

const sessionJson = credentials => {
    return {
        sessionId: credentials.AccessKeyId,
        sessionKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken
    };
};

const signinTokenRequest = sessionJson => {
    return {
        Action: 'getSigninToken',
        DurationSeconds: 900,
        SessionType: 'json',
        Session: sessionJson
    };
};

const consoleURLRequest = token => {
    return {
        Action: 'login',
        SigninToken: token,
        Destination: consoleURL,
        SessionDuration: 43200
    };
};

const getConsoleURL = (config, tokenCode, profileName) => {
    const role = config.role_arn;

    const awsConfigOptions = { profile: config.source_profile };
    AWS.config.credentials = new AWS.SharedIniFileCredentials(awsConfigOptions);

    let agent;
    if(process.env.HTTPS_PROXY !== undefined) {
      console.log(`setting proxy to ${process.env.HTTPS_PROXY}`);
      agent = proxy(process.env.HTTPS_PROXY)
    } else {
      console.log('no proxy');
      agent = new https.Agent()
    }

    if(config.ca_bundle !== undefined) {
      console.log(`setting CA cert to ${config.ca_bundle}`);
      agent.options = {
        ca: [fs.readFileSync(config.ca_bundle)],
        rejectUnauthorized: true
      };
    } else {
      console.log('not overriding CA');
    }

    AWS.config.update({ httpOptions: { agent: agent } });
    const sts = new AWS.STS();

    const assumeRoleParams = {
        RoleArn: role,
        RoleSessionName: profileName
    };

    if(config.mfa_serial) {
        assumeRoleParams.SerialNumber = config.mfa_serial;
        assumeRoleParams.TokenCode = tokenCode;
    }

    return sts.assumeRole(assumeRoleParams).promise()
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
        .then(federationURL);
};

module.exports = getConsoleURL;
