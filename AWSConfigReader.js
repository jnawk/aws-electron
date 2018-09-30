const util = require('util');
const ini = require('ini');
const fs = require('fs');

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

module.exports = getAWSConfig;
