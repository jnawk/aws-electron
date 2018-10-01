import React from 'react';
import {Container,Row,Col,Button} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';
const remote = require('electron').remote;

const getAWSConfig = remote.require('./AWSConfigReader');
const getConsoleURL = remote.require('./getConsoleURL');
const launchConsole = profileName => {
    const options = {
        width: 1280,
        height: 1024,
        webPreferences: {
            partition: profileName,
            nodeIntegration: false
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
        return <Container>
            <Row>
                <Col sm={3}>Profile Name</Col>
                <Col className='d-none d-sm-block' sm={7}>Role ARN</Col>
                <Col className='d-none d-sm-none d-md-block' sm={2}>MFA ARN or Serial Number</Col>
                <Col className='d-none d-sm-none d-md-block' sm={2}>Credentials Profile</Col>
            </Row>
            {this.usableProfiles.map(profileName => <Row>
                <Col sm={3}>{profileName}</Col>
                <Col className='d-none d-sm-block' sm={7}>{this.awsConfig[profileName].role_arn}</Col>
                <Col className='d-none d-sm-none d-md-block' sm={2}>{this.awsConfig[profileName].mfa_serial}</Col>
                <Col className='d-none d-sm-none d-md-block' sm={2}>{this.awsConfig[profileName].source_profile}</Col>
                <Col sm={2}>
                    <Button onClick={() => launchConsole(profileName)}>Launch</Button>
                </Col>
            </Row>)}
        </Container>;
    }
}

export default AWSConsole;
