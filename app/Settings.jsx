import React from "react"
import { Container, Row, Col, ButtonGroup, Button } from "reactstrap"
import "bootstrap/dist/css/bootstrap.css"

const backend = window.backend  // defined in preload.js

class Settings extends React.Component {
    constructor(props) {
        super(props)

        this.state = {}
    }

    componentDidMount() {
        backend.getPreferences().then(preferences => {
            preferences = preferences || {}
            this.setState({preferences})
        })
    }

    componentWillUnmount() {
    }

    setPreference(preference) {
        this.setState({preferences: preference})
        backend.setPreference(preference)
    }

    render() {
        const { preferences } = this.state
        if(!preferences) {
            return <>Loading...</>
        }
        const {
            vaultPreference,
            tabTitlePreference
        } = preferences
        return <>
            <Container fluid>
                <Row /*className='d-none d-sm-table-row'*/>
                    <Col /*className='d-none d-sm-table-cell' sm={2} md={3}*/>
                        How to treat the AWS Configuration file if it appears to
                        use features from aws-vault (v4)
                    </Col>
                    <Col>
                        <ButtonGroup>
                            <Button
                                color={(vaultPreference === undefined || vaultPreference === "ask") ? "success" : "secondary"}
                                onClick={() => {this.setPreference({vaultPreference: "ask"})}}
                            >
                              Ask
                            </Button>
                            <Button
                                color={vaultPreference === "aws" ? "success" : "secondary"}
                                onClick={() => {this.setPreference({vaultPreference: "aws"})}}
                            >
                              Treat as AWS
                            </Button>
                            <Button
                                color={vaultPreference === "vault" ? "success" : "secondary"}
                                onClick={() => {this.setPreference({vaultPreference: "vault"})}}
                            >
                              Treat as aws-vault
                            </Button>
                        </ButtonGroup>
                    </Col>
                </Row>
                <Row>
                    <Col>
                    Tab title format
                    </Col>
                    <Col>
                        <ButtonGroup>
                            <Button
                                color={(tabTitlePreference === undefined || tabTitlePreference === "{title}") ? "success" : "secondary"}
                                onClick={() => {this.setPreference({tabTitlePreference: "{title}"})}}
                            >
                                {"{title}"}
                            </Button>
                            <Button
                                color={tabTitlePreference === "{profile} - {title}" ? "success" : "secondary"}
                                onClick={() => {this.setPreference({tabTitlePreference: "{profile} - {title}"})}}
                            >
                                {"{profile} - {title}"}
                            </Button>
                            <Button
                                color={tabTitlePreference === "{title} - {profile}" ? "success" : "secondary"}
                                onClick={() => {this.setPreference({tabTitlePreference: "{title} - {profile}"})}}
                            >
                                {"{title} - {profile}"}
                            </Button>
                        </ButtonGroup>
                    </Col>
                </Row>
            </Container>
        </>
    }
}

export default Settings
