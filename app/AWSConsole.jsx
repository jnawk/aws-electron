import React from 'react';
import {Container,Row,Col,Button} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';
const remote = require('electron').remote;

const roleRegex = /arn:aws:iam::(\d{12}):role\/(.*)/;

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
            <Row className='d-none d-sm-table-row'>
                <Col className='d-none d-sm-table-cell' sm={2} md={3}>
                    <caption>Profile Name</caption>
                </Col>
                <Col className='d-none d-md-table-cell' md={3}>
                    <caption>Role Account</caption>
                </Col>
                <Col className='d-none d-md-table-cell' md={2}>
                    <caption>Role Name</caption>
                </Col>
                <Col className='d-none d-lg-table-cell' lg={2}>
                    <caption>MFA ARN or Serial Number</caption>
                </Col>
                <Col className='d-none d-md-table-cell' md={2}>
                    <caption>Credentials Profile</caption>
                </Col>
            </Row>
            {this.usableProfiles.map(profileName => {
                const profile = this.awsConfig[profileName];
                const roleRegexResult = roleRegex.exec(profile.role_arn);
                return <Row className='d-table-row'>
                    <Col className='d-none d-sm-table-cell' sm={2} md={3}>
                        {profileName.replace(/-/g, String.fromCharCode(0x2011))}
                    </Col>
                    <Col className='d-none d-md-table-cell' md={3}>
                        {roleRegexResult[1]}
                    </Col>
                    <Col className='d-none d-md-table-cell' md={2}>
                        {roleRegexResult[2].replace(/-/g, String.fromCharCode(0x2011))}
                    </Col>
                    <Col className='d-none d-lg-table-cell' lg={2}>
                        {profile.mfa_serial}
                    </Col>
                    <Col className='d-none d-md-table-cell' md={2}>
                        {profile.source_profile.replace(/-/g, String.fromCharCode(0x2011))}
                    </Col>
                    <Col className='d-table-cell d-sm-none'>
                        <Button onClick={() => launchConsole(profileName)}>
                            {profileName}
                        </Button>
                    </Col>
                    <Col className='d-none d-sm-table-cell' sm={2} md={2}>
                        <Button onClick={() => launchConsole(profileName)}>
                            Launch
                        </Button>
                    </Col>
                </Row>;})}
        </Container>;
    }
}

export default AWSConsole;
