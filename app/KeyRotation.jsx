import React from "react"
import { ButtonGroup, Button } from "reactstrap"
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import "bootstrap/dist/css/bootstrap.css"

const backend = window.backend  // defined in preload.js

class KeyRotation extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            profiles: undefined,
            settings: {
                aws: "RETAIN",
                local: "BACKUP",
            },
            promiseResults: undefined,
        }
    }

    componentDidMount() {
        backend.getAWSConfig().then(config => {
            const profiles = config.longTermCredentialsProfiles || undefined
            this.setState({profiles})
        })
    }

    componentWillUnmount() {
    }

    rotateKey(profile) {
        backend.rotateKey({profile, ...this.state.settings}).then(log => {
            this.setState({log})
        })        
    }

    render() {
        const { profiles, settings: { aws, local }, log } = this.state
        if(!profiles) {
            return <>Loading...</>
        }

        return <>
            <Container fluid>
                <Row /*className='d-none d-sm-table-row'*/>
                    <Col md={8}/*className='d-none d-sm-table-cell' sm={2} md={3}*/>
                        The key rotation feature is under development, and may
                        not work properly.
                    </Col>
                </Row>
                <Row>
                    <Col md={3}>
                        AWS Options
                    </Col>
                    <Col>
                        <ButtonGroup>
                            <Button
                                color={aws == "RETAIN" ? "success" : "secondary"}
                                onClick={() => this.setState({settings: {local, aws: "RETAIN"}})}
                            >
                                {"Don't delete or disable existing key"}
                            </Button>
                            <Button
                                color={aws == "DISABLE" ? "success" : "secondary"}
                                onClick={() => this.setState({settings: {local, aws: "DISABLE"}})}
                            >
                                Disable existing key
                            </Button>
                            <Button
                                color={aws == "DELETE" ? "success" : "secondary"}
                                onClick={() => this.setState({settings: {local, aws: "DELETE"}})}
                            >
                                Delete existing key
                            </Button>
                        </ButtonGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={3}>
                        <tt>~/.aws/credentials</tt> options
                    </Col>
                    <Col>
                        <ButtonGroup>
                            <Button
                                color={local == "BACKUP" ? "success" : "secondary"}
                                onClick={() => this.setState({settings: {aws, local: "BACKUP"}})}
                            >
                                Retain existing key
                            </Button>
                            <Button
                                color={local == "DELETE" ? "success" : "secondary"}
                                onClick={() => this.setState({settings: {aws, local: "DELETE"}})}
                            >
                                Delete existing key
                            </Button>
                        </ButtonGroup>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        Key Profiles
                    </Col>
                </Row>
                {profiles.map(profile => {
                    return (
                        <Row key={profile}>
                            <Col md={3}>
                                {profile}
                            </Col>
                            <Col>
                                <Button onClick={() => {this.rotateKey(profile)}}>Rotate!</Button>
                            </Col>
                        </Row>
                    )
                })}
                {(log || []).map(entry => {
                    return (
                        <Row key={entry}>
                            <Col>{entry}</Col>
                        </Row>
                    )
                })}
            </Container>
        </>
    }
}

export default KeyRotation
