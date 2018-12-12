const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const queryString = require('query-string');
const util = require('util');

const federationURL = search => util.format('https://signin.aws.amazon.com/federation?%s', search);
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

const getConsoleURL = (config, tokenCode) => {
    const role = config.role_arn;

    const awsConfigOptions = { profile: config.source_profile };
    AWS.config.credentials = new AWS.SharedIniFileCredentials(awsConfigOptions);
    const sts = new AWS.STS();

    const assumeRoleParams = {
        RoleArn: role,
        RoleSessionName: config.source_profile
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
