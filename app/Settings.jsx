import React from "react"
import { Container, Row, Col, Button, Alert } from "reactstrap"
import "bootstrap/dist/css/bootstrap.css"
// import { CSSTransition, TransitionGroup } from "react-transition-group"
// import { profileRows } from "./getRoleData"

const backend = window.backend  // defined in preload.js

class Settings extends React.Component {
    constructor(props) {
        super(props)

        this.state = {}
    }

    componentDidMount() {
        // backend.getAWSConfig().then(configs => {
        //     this.setState(configs)
        //     const {
        //         awsConfig,
        //         vaultConfig,
        //         credentialsProfiles,
        //     } = configs
        //
        //     const usingAwsConfig = vaultConfig == undefined
        //     const config = usingAwsConfig ? awsConfig : vaultConfig
        //     return backend.getUsableProfiles({config, credentialsProfiles})
        // }).then(usableProfiles => this.setState({usableProfiles}))
    }

    componentWillUnmount() {
    }

    render() {
        return <>
            <Container fluid>
                <Row className='d-none d-sm-table-row'>
                    <Col className='d-none d-sm-table-cell' sm={2} md={3}>
                        <b>Hello, World</b>
                    </Col>
                </Row>
            </Container>
        </>
    }
}

export default Settings
