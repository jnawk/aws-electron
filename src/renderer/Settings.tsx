import * as React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import {
  Button, ButtonGroup, Col, Container, Row,
} from 'reactstrap';
import { Preference, Preferences } from '_/main/types';

const { backend } = window; // defined in preload.js

interface SettingsState {
  preferences?: Preferences
}

class Settings extends React.Component<Record<string, never>, SettingsState> {
  constructor(props: Record<string, never>) {
    super(props);

    this.state = {};
  }

  componentDidMount(): void {
    void backend.getPreferences().then((preferences) => {
      this.setState({ preferences: preferences || {} });
    });
  }

  setPreference(preference: Preference): void {
    this.setState({ preferences: preference });
    backend.setPreference(preference);
  }

  render(): React.Component| React.ReactElement {
    const { preferences } = this.state;
    if (!preferences) {
      return <>Loading...</>;
    }
    const {
      vaultPreference,
      tabTitlePreference,
      useGPUPreference,
    } = preferences;
    return (
      <Container fluid>
        <Row>
          <Col xs={6}>
            How to treat the AWS Configuration file if it appears to
            use features from aws-vault (v4)
          </Col>
          <Col xs={4}>
            <ButtonGroup>
              <Button
                color={((vaultPreference === undefined
                    || vaultPreference === 'ask')
                  ? 'success' : 'secondary')}
                onClick={() => {
                  this.setPreference({
                    vaultPreference: 'ask',
                  });
                }}
              >
                Ask
              </Button>
              <Button
                color={(vaultPreference === 'aws'
                  ? 'success' : 'secondary')}
                onClick={() => {
                  this.setPreference({
                    vaultPreference: 'aws',
                  });
                }}
              >
                Treat as AWS
              </Button>
              <Button
                color={(vaultPreference === 'vault'
                  ? 'success' : 'secondary')}
                onClick={() => {
                  this.setPreference({
                    vaultPreference: 'vault',
                  });
                }}
              >
                Treat as aws-vault
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
        <Row>
          <Col xs={6}>
            Tab title format
          </Col>
          <Col xs={4}>
            <ButtonGroup>
              <Button
                color={((tabTitlePreference === undefined
                    || tabTitlePreference === '{title}')
                  ? 'success' : 'secondary')}
                onClick={() => {
                  this.setPreference({
                    tabTitlePreference: '{title}',
                  });
                }}
              >
                {'{title}'}
              </Button>
              <Button
                color={(tabTitlePreference === '{profile} - {title}'
                  ? 'success' : 'secondary')}
                onClick={() => {
                  this.setPreference({
                    tabTitlePreference: '{profile} - {title}',
                  });
                }}
              >
                {'{profile} - {title}'}
              </Button>
              <Button
                color={(tabTitlePreference === '{title} - {profile}'
                  ? 'success' : 'secondary')}
                onClick={() => {
                  this.setPreference({
                    tabTitlePreference: '{title} - {profile}',
                  });
                }}
              >
                {'{title} - {profile}'}
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
        <Row>
          <Col xs={6}>
            Use hardware accelaration (if available) - requires restart
          </Col>
          <Col xs={4}>
            <ButtonGroup>
              <Button
                color={((useGPUPreference === undefined
                    || useGPUPreference === true)
                  ? 'success' : 'secondary')}
                onClick={() => {
                  this.setPreference({
                    useGPUPreference: true,
                  });
                }}
              >
                Yes
              </Button>
              <Button
                color={(useGPUPreference === false
                  ? 'success' : 'secondary')}
                onClick={() => {
                  this.setPreference({
                    useGPUPreference: false,
                  });
                }}
              >
                No
              </Button>
            </ButtonGroup>
          </Col>
          <Col xs={2}>
            <Button
              color="danger"
              onClick={() => {
                backend.restart();
              }}
            >
              Restart
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default Settings;
