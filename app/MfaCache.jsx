import React from "react"
import { Button } from "reactstrap"
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import "bootstrap/dist/css/bootstrap.css"
import "./profileList.css"
import "./mfaBox.css"
import { mfaRows } from "./getRoleData"

const backend = window.backend  // defined in preload.js

class MfaCache extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            mfaCode: "",
            remember: false
        }
    }

    componentDidMount() {
        backend.getAWSConfig()
            .then(config => backend.getMfaProfiles({config}))
            .then(config => this.setState({config}))
    }

    componentWillUnmount() {
    }


    mfaButtonGenerator({launchProfile, shouldDisable}) {
        return buttonText => {
            return <Button onClick={launchProfile}
                disabled={shouldDisable}
                title={shouldDisable ? "Enter your 6-digit MFA code first!" : null}>
                {buttonText ? buttonText : "MFA"}
            </Button>
        }
    }

    mfaRow({
        profileName,
        profile,
        mfaButton}) {
        return <Row className='d-table-row' key={profileName}>
            <Col className='d-none d-sm-table-cell' sm={2} md={3}>
                {profileName.replace(/-/g, String.fromCharCode(0x2011))}
            </Col>
            <Col className='d-none d-lg-table-cell' lg={2}>
                {profile.mfa_serial ? profile.mfa_serial.replace(/arn:aws:iam::/, "") : ""}
            </Col>
            <Col className='d-none d-sm-table-cell launchButton' sm={2} md={2}>
                {mfaButton()}
            </Col>
        </Row>
    }

    render() {
        const {
            config,
            mfaCode,
        } = this.state
        if(!config) {
            return <>Loading...</>
        }

        return <>
            <Container fluid>
                <Row className='d-none d-sm-table-row'>
                    <Col className='d-none d-sm-table-cell' sm={2} md={3}>
                        <b>Profile Name</b>
                    </Col>
                    <Col className='d-none d-lg-table-cell' lg={2}>
                        <b>MFA ARN or Serial Number</b>
                    </Col>
                    <Col className='d-none d-md-table-cell' md={2}>
                        <b>Credentials Profile</b>
                    </Col>
                </Row>
                {mfaRows({
                    config,
                    mfaCode,
                    clearMfaCode: () => this.setState({mfaCode: ""}),
                    doMfa: backend.doMfa,
                    mfaButtonGenerator: this.mfaButtonGenerator,
                    mfaRowGenerator: this.mfaRow
                })}
                <Row className='mfaBox'>
                    <Col>
                        <input type='text'
                            value={mfaCode}
                            placeholder='MFA Code'
                            onChange={event => this.setState({mfaCode: event.target.value})}/>
                    </Col>
                </Row>
            </Container>
        </>
    }
}

export default MfaCache
