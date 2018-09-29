const { app, BrowserWindow } = require('electron');
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const queryString = require('query-string');
const util = require('util');
const ini = require('ini');
const fs = require('fs');

const federationURL = search => util.format('https://signin.aws.amazon.com/federation?%s', search);
const consoleURL = 'https://console.aws.amazon.com';

const profile = process.argv[2];

const sessionJson = credentials => {
    return {
        sessionId: credentials.AccessKeyId,
        sessionKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken
    };
}

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
        Destination: consoleURL
    };
}

const getAWSConfig = () => {
    const awsConfigFile = util.format('%s/.aws/config', process.env.HOME);
    const readFileOptions = {
        encoding: 'utf-8', flags: 'r'
    };
    const awsConfigFileContent = fs.readFileSync(awsConfigFile, readFileOptions);
    const awsConfig = ini.parse(awsConfigFileContent);

    return Object.keys(awsConfig).map(key => {
        return {
            name: key.replace('profile ', ''),
            config: awsConfig[key]
        };
    }).reduce((target, item) => {
        target[item.name] = item.config;
        return target;
    }, {});
};

const getConsoleURL = config => {
    const role = config.role_arn;
    // Create the browser window.

    const awsConfigOptions = { profile: config.source_profile };
    AWS.config.credentials = new AWS.SharedIniFileCredentials(awsConfigOptions);
    const sts = new AWS.STS();

    const assumeRoleParams = {
        RoleArn: role,
        RoleSessionName: 'foo'
    };
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
        .then(federationURL)
};


app.on('ready', () => {
    const config = getAWSConfig()[profile];
    const role = config.role_arn;

    // Create the browser window.
    const options = {
        width: 1280,
        height: 1024,
        webPreferences: {
            partition: role
        }
    };

    var win = new BrowserWindow(options);

    getConsoleURL(config)
        .then(url => win.loadURL(url))
        .catch(error => {
            console.error(error, error.stack);
            app.quit();
        });
});
