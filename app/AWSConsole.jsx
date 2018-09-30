import React from 'react';
//import {Grid,Row,Col,Button} from 'react-bootstrap';
const remote = require('electron').remote;

const getAWSConfig = remote.require('./AWSConfigReader');
const getConsoleURL = remote.require('./getConsoleURL');
const launchConsole = (profileName) => {
    const options = {
        width: 1280,
        height: 1024,
        webPreferences: {
            partition: profileName
        }
    };

    var win = new remote.BrowserWindow(options);
    const config = getAWSConfig()[profileName];
    getConsoleURL(config)
        .then(url => win.loadURL(url))
        .catch(error => {
            console.error(error, error.stack);
            //app.quit();
        });
};


class AWSConsole extends React.Component {
    constructor(props) {
        super(props);

        this.awsConfig = getAWSConfig();
        this.usableProfiles = Object.keys(this.awsConfig)
            .filter(key => Object.keys(this.awsConfig[key]).includes('role_arn'));
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    render() {

        return <div>
            {this.usableProfiles.map(profileName => {
                return <p>
                    <a onClick={() => {
                        console.log(profileName);
                        console.log(launchConsole);
                        console.log(remote);
                        launchConsole(profileName);
                    }}>{profileName}</a>
                </p>;
            })}
        </div>;
    }
}

export default AWSConsole;
