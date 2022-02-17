import * as React from 'react';
import {
  Button, ButtonGroup, Col, Container, Row,
} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';
import './tt.css';

const { backend } = window; // defined in preload.js

interface KeyRotationState {
    profiles?: Array<string>,
    settings: {
        aws: 'RETAIN' | 'DISABLE' | 'DELETE',
        local: 'BACKUP' | 'DELETE'
    },
    log?: Array<string>
}

class KeyRotation extends React.Component<Record<string, never>, KeyRotationState> {
  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      profiles: undefined,
      settings: {
        aws: 'RETAIN',
        local: 'BACKUP',
      },
    };
  }

  componentDidMount(): void {
    void backend.getAWSConfig().then((config) => {
      const profiles = config.longTermCredentialsProfiles || undefined;
      this.setState({ profiles });
    });
  }

  rotateKey(profile: string): void {
    void backend.rotateKey({
      profile,
      aws: this.state.settings.aws,
      local: this.state.settings.local,
    }).then((log: Array<string>) => {
      this.setState({ log });
    });
  }

  render(): React.ReactElement {
    const { profiles, settings: { aws, local }, log } = this.state;
    if (!profiles) {
      return <>Loading...</>;
    }

    return (
      <Container fluid>
        <Row>
          <Col md={8}/* className='d-none d-sm-table-cell' sm={2} md={3} */>
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
                color={aws === 'RETAIN' ? 'success' : 'secondary'}
                onClick={() => this.setState({
                  settings: { local, aws: 'RETAIN' },
                })}
              >
                Don&apos;t delete or disable existing key
              </Button>
              <Button
                color={aws === 'DISABLE' ? 'success' : 'secondary'}
                onClick={() => this.setState({
                  settings: { local, aws: 'DISABLE' },
                })}
              >
                Disable existing key
              </Button>
              <Button
                color={aws === 'DELETE' ? 'success' : 'secondary'}
                onClick={() => this.setState({
                  settings: { local, aws: 'DELETE' },
                })}
              >
                Delete existing key
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
        <Row>
          <Col md={3}>
            <span className="tt">~/.aws/credentials</span>
            {' '}
            options
          </Col>
          <Col>
            <ButtonGroup>
              <Button
                color={local === 'BACKUP' ? 'success' : 'secondary'}
                onClick={() => this.setState({
                  settings: { aws, local: 'BACKUP' },
                })}
              >
                Retain existing key
              </Button>
              <Button
                color={local === 'DELETE' ? 'success' : 'secondary'}
                onClick={() => this.setState({
                  settings: { aws, local: 'DELETE' },
                })}
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
        {profiles.map((profile: string) => (
          <Row key={profile}>
            <Col md={3}>
              {profile}
            </Col>
            <Col>
              <Button onClick={() => {
                this.rotateKey(profile);
              }}
              >
                Rotate!
              </Button>
            </Col>
          </Row>
        ))}
        {(log || []).map((entry) => (
          <Row key={entry}>
            <Col>{entry}</Col>
          </Row>
        ))}
      </Container>
    );
  }
}

export default KeyRotation;
