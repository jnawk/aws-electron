import React from 'react';
import {Container,Row,Col,Button} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';
const remote = require('electron').remote;

const roleRegex = /arn:aws:iam::(\d{12}):role\/(.*)/;

const getAWSConfig = remote.require('./AWSConfigReader');
const getConsoleURL = remote.require('./getConsoleURL');
const launchConsole = (profileName, mfaCode) => {
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
    getConsoleURL(config, mfaCode)
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

        this.state = {
            mfaCode: ''
        };
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
                const shouldDisable = profile.mfa_serial != undefined && this.state.mfaCode.length != 6;
                const launchProfile = () => {
                    launchConsole(profileName, this.state.mfaCode);
                    this.setState({mfaCode: ''});
                }

                const profileLaunchButton = <Button onClick={launchProfile}
                    disabled={shouldDisable}
                    title={shouldDisable ? 'Enter your 6-digit MFA code first!' : null}>
                    {profileName}
                </Button>;

                const launchButton = <Button onClick={launchProfile}
                    disabled={shouldDisable}
                    title={shouldDisable ? 'Enter your 6-digit MFA code first!' : null}>
                    Launch
                </Button>;

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
                        {profileLaunchButton}
                    </Col>
                    <Col className='d-none d-sm-table-cell' sm={2} md={2}>
                        {launchButton}
                    </Col>
                </Row>;
            })}
            {this.usableProfiles.some(profile => this.awsConfig[profile].mfa_serial) ? <Row>
                <Col>
                    <input type='text'
                        value={this.state.mfaCode}
                        placeholder='MFA Code'
                        onChange={event => this.setState({mfaCode: event.target.value})}/>
                </Col>
            </Row> : null}
        </Container>;
    }
}

export default AWSConsole;
