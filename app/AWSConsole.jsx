import React from "react"
import { Container, Row, Col, Button } from "reactstrap"
import "bootstrap/dist/css/bootstrap.css"

const roleRegex = /arn:aws:iam::(\d{12}):role\/(.*)/
const backend = window.backend;

class AWSConsole extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            mfaCode: ""
        }
    }

    componentDidMount() {
        backend.getAWSConfig().then(awsConfig => {
            const usableProfiles = Object.keys(awsConfig)
                .filter(key => Object.keys(awsConfig[key]).includes("role_arn"))

            this.setState({awsConfig, usableProfiles})
        })
    }

    componentWillUnmount() {
    }

    render() {
        const { awsConfig, usableProfiles, mfaCode } = this.state
        if(!usableProfiles) {
            return <>Loading...</>
        }
        return <Container>
            <Row className='d-none d-sm-table-row'>
                <Col className='d-none d-sm-table-cell' sm={2} md={3}>
                    <b>Profile Name</b>
                </Col>
                <Col className='d-none d-md-table-cell' md={3}>
                    <b>Role Account</b>
                </Col>
                <Col className='d-none d-md-table-cell' md={2}>
                    <b>Role Name</b>
                </Col>
                <Col className='d-none d-lg-table-cell' lg={2}>
                    <b>MFA ARN or Serial Number</b>
                </Col>
                <Col className='d-none d-md-table-cell' md={2}>
                    <b>Credentials Profile</b>
                </Col>
            </Row>
            {usableProfiles.map(profileName => {
                const profile = awsConfig[profileName]
                const roleRegexResult = roleRegex.exec(profile.role_arn)
                const shouldDisable = profile.mfa_serial != undefined && mfaCode.length != 6
                const launchProfile = () => {
                    backend.launchConsole(profileName, mfaCode)
                    this.setState({mfaCode: ""})
                }

                const fullRoleName = roleRegexResult[2].replace(/-/g, String.fromCharCode(0x2011))
                var shortRoleName
                if(fullRoleName.length > 45) {
                    shortRoleName = fullRoleName.substring(0, 20) + "..." + fullRoleName.substring(fullRoleName.length - 20)
                } else {
                    shortRoleName = fullRoleName
                }

                const launchButton = buttonText => {
                    return <Button onClick={launchProfile}
                        disabled={shouldDisable}
                        title={shouldDisable ? "Enter your 6-digit MFA code first!" : null}>
                        {buttonText ? buttonText : "Launch"}
                    </Button>
                }

                return <Row className='d-table-row' key={profileName}>
                    <Col className='d-none d-sm-table-cell' sm={2} md={3}>
                        {profileName.replace(/-/g, String.fromCharCode(0x2011))}
                    </Col>
                    <Col className='d-none d-md-table-cell' md={3}>
                        {roleRegexResult[1]} {/*role account*/}
                    </Col>
                    <Col className='d-none d-md-table-cell' md={2}>
                        <div title={fullRoleName == shortRoleName ? null : fullRoleName}>{shortRoleName}</div>
                    </Col>
                    <Col className='d-none d-lg-table-cell' lg={2}>
                        {profile.mfa_serial ? profile.mfa_serial.replace(/arn:aws:iam::/, "") : ""}
                    </Col>
                    <Col className='d-none d-md-table-cell' md={2}>
                        {profile.source_profile.replace(/-/g, String.fromCharCode(0x2011))}
                    </Col>
                    <Col className='d-table-cell d-sm-none'>
                        {launchButton(profileName)}
                    </Col>
                    <Col className='d-none d-sm-table-cell' sm={2} md={2}>
                        {launchButton()}
                    </Col>
                </Row>
            })}
            {usableProfiles.some(profile => awsConfig[profile].mfa_serial) ? <Row>
                <Col>
                    <input type='text'
                        value={mfaCode}
                        placeholder='MFA Code'
                        onChange={event => this.setState({mfaCode: event.target.value})}/>
                </Col>
            </Row> : null}
        </Container>
    }
}

export default AWSConsole
