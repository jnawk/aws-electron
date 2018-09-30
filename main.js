const { app, BrowserWindow } = require('electron');
const util = require('util');
const ini = require('ini');
const fs = require('fs');

const getConsoleURL = require('./getConsoleURL');

const profile = process.argv[2];

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
        // .then(url => win.loadURL(url))
        .then(() => {
            win.loadURL(`file://${__dirname}/index.html`);
        })
        .catch(error => {
            console.error(error, error.stack);
            app.quit();
        });
});
