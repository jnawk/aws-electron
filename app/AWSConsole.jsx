import React from "react"
import { Container, Row, Col, Button, Alert } from "reactstrap"
import "bootstrap/dist/css/bootstrap.css"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import "./vaultMessage.css"
import "./profileList.css"
import "./mfaBox.css"
import { profileRows } from "./getRoleData"

const backend = window.backend  // defined in preload.js

class AWSConsole extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            mfaCode: ""
        }
    }

    componentDidMount() {
        const configPromise = backend.getAWSConfig()
        const preferencesPromise = backend.getPreferences()
        Promise.all([configPromise, preferencesPromise]).then(([configs, preferences]) => {
            const vaultPreference = preferences.vaultPreference || "ask"
            const properly = vaultPreference == "ask" ? undefined : vaultPreference == "aws"
            this.setState({...configs, explicitTreatConfigProperly: properly})
            const {
                awsConfig,
                vaultConfig,
                credentialsProfiles,
            } = configs

            const usingAwsConfig = vaultConfig == undefined || properly
            const config = usingAwsConfig ? awsConfig : vaultConfig
            return backend.getUsableProfiles({config, credentialsProfiles})
        }).then(usableProfiles => this.setState({usableProfiles}))
    }

    componentWillUnmount() {
    }

    treatConfigProperly(properly) {
        const {
            awsConfig,
            vaultConfig,
            credentialsProfiles,
        } = this.state

        this.setState({explicitTreatConfigProperly: properly})

        const usingAwsConfig = properly || vaultConfig == undefined
        const config = usingAwsConfig ? awsConfig : vaultConfig
        if(config) {
            backend.getUsableProfiles({config, credentialsProfiles})
                .then(usableProfiles => this.setState({usableProfiles}))
        }
    }

    vaultMessage() {
        const { explicitTreatConfigProperly, vaultConfig } = this.state

        const displayVaultMessage = explicitTreatConfigProperly == undefined && vaultConfig != undefined
        if(!displayVaultMessage) {
            return null
        }
        return <CSSTransition key={"foo"}
            classNames={"vaultMessage"}
            timeout={{enter: 1, exit: 300}}>
            <Alert variant={"info"}>
                <h1>Vault V4 Style config detected!</h1>
                <p>
                  Your config file has at least one role-assuming profile
                  which defines a <tt>source_profile</tt> that exists as a
                    {"\u0020"} <i>config</i> profile.  (<tt>source_profile</tt>
                    {"\u0020"} canonically refers to a <i>credentials</i>
                    {"\u0020"} profile).
                </p>
                <p>
                  When using the awscli, this profile will <b>not</b> inherit
                  the config from the config profile matching the {"\u0020"}
                    <tt>source_profile</tt>, while with aws-vault (version 4),
                  the profile <b>will</b> inherit the config from the config
                  profile matching the <tt>source_profile</tt>.  (The authors
                  of aws-vault have since realised the error of their ways,
                  and version 5 behaves canonically, if their documentation is
                  to be trusted.)
                </p>
                <p>
                  This software will treat configs that <i>look</i> like vault
                  configs as vault configs, unless you tell it not to.
                </p>
                <Button onClick={() => this.treatConfigProperly(true)}>
                  Please treat my config file properly.
                </Button> {"\u0020"}
                <Button onClick={() => this.treatConfigProperly(false)}>
                  Please treat my config file as a V4 Vault config.
                </Button>
            </Alert>
        </CSSTransition>
    }

    launchButtonGenerator({launchProfile, shouldDisable}) {
        return buttonText => {
            return <Button onClick={launchProfile}
                disabled={shouldDisable}
                title={shouldDisable ? "Enter your 6-digit MFA code first!" : null}>
                {buttonText ? buttonText : "Launch"}
            </Button>
        }
    }

    profileRow({
        profileName,
        roleRegexResult,
        fullRoleName,
        shortRoleName,
        profile,
        launchButton}) {
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
            <Col className='d-table-cell d-sm-none launchButton'>
                {launchButton(profileName)}
            </Col>
            <Col className='d-none d-sm-table-cell launchButton' sm={2} md={2}>
                {launchButton()}
            </Col>
        </Row>
    }

    render() {
        const {
            awsConfig,
            vaultConfig,
            mfaCode,
            explicitTreatConfigProperly,
            usableProfiles
        } = this.state

        if(!awsConfig || !usableProfiles) {
            return <>Loading...</>
        }

        // we are using vanilla AWS config if the user has said so,
        // or if we never received a vault style config to start with
        const usingAwsConfig = explicitTreatConfigProperly || vaultConfig == undefined

        const config = usingAwsConfig ? awsConfig : vaultConfig
        const configType = usingAwsConfig ? "awsConfig" : "vaultConfig"

        return <>
            <TransitionGroup>
                {this.vaultMessage()}
            </TransitionGroup>
            <Container fluid>
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
                {profileRows({
                    usableProfiles,
                    config,
                    configType,
                    mfaCode,
                    clearMfaCode: () => this.setState({"mfaCode": ""}),
                    launchConsole: backend.launchConsole,
                    launchButtonGenerator: this.launchButtonGenerator,
                    profileRowGenerator: this.profileRow
                })}
                {usableProfiles.some(profile => config[profile].mfa_serial) ? <Row className='mfaBox'>
                    <Col>
                        <input type='text'
                            value={mfaCode}
                            placeholder='MFA Code'
                            onChange={event => this.setState({mfaCode: event.target.value})}/>
                    </Col>
                </Row> : null}
            </Container>
        </>
    }
}

export default AWSConsole
