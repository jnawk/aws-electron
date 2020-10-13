const ini = require('ini');
const fs = require('fs');
const os = require('os');
const path = require('path');

const readFileOptions = {
    encoding: 'utf-8', flags: 'r'
};

const cleanProfileKey = key => {
    return key.replace('profile ', '');
};

const getAWSConfig = awsConfigFile => {
    if(!awsConfigFile) {
        awsConfigFile = path.join(os.homedir(), '.aws', 'config');
    }
    const awsConfigFileContent = fs.readFileSync(awsConfigFile, readFileOptions);
    const awsConfig = ini.parse(awsConfigFileContent);
    for(let key in awsConfig) {
        const value = awsConfig[key];
        delete awsConfig[key];
        awsConfig[cleanProfileKey(key)] = value;
    }
    return awsConfig;
};

module.exports = getAWSConfig;
