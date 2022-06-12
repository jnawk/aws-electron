import * as React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import {
  Button, ButtonGroup, Col, Container, Row,
} from 'reactstrap';
import {
  Preference, Preferences,
} from '_/main/types';
import classNames from 'classnames';
import * as sprintf from 'sprintf-js';
import './tt.css';
import './settings.css';

const { backend } = window; // defined in preload.js

interface SettingsState {
    preferences?: Preferences
    title: string | null
    seconds: string,
    interval?: NodeJS.Timer
}

const getSeconds = () => (59 - new Date().getSeconds()).toString().padStart(2, '0');

class Settings extends React.Component<Record<string, never>, SettingsState> {
  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      title: null,
      seconds: getSeconds(),
    };
  }

  componentDidMount(): void {
    void backend.getPreferences().then((preferences) => {
      this.setState({
        preferences: preferences || {},
        title: preferences?.tabTitlePreferenceV2 || null,
      });
    });
    this.setState({
      interval: setInterval(
        () => {
          this.setState({
            seconds: getSeconds(),
          });
        },
        1000,
      ),
    });
  }

  componentWillUnmount() {
    const { interval } = this.state;
    if (interval) {
      window.clearInterval(interval);
    }
  }

  setPreference(preference: Preference): void {
    this.setState({ preferences: preference });
    backend.setPreference(preference);
  }

  render(): React.Component| React.ReactElement {
    const { preferences, title, seconds } = this.state;
    if (!preferences) {
      return <>Loading...</>;
    }
    const {
      vaultPreference,
      tabTitlePreferenceV2,
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
        <Row>
          <Col xs={6}>
            Title format - a template to use to format the title bar -
            variables available:
            <dl>
              <dt><span className={classNames('tt')}>%(title)s</span></dt>
              <dd>AWS Console</dd>
              <dt><span className={classNames('tt')}>%(profile)s</span></dt>
              <dd>
                The
                {' '}
                <span className={classNames('tt')}>~/.aws/config</span>
                {' '}
                profile used
              </dd>
              <dt><span className={classNames('tt')}>%(timeLeft)s</span></dt>
              <dd>The time left before the current session expires</dd>
            </dl>
          </Col>
          <Col xs={4} className={classNames('titleFormat')}>
            <input value={title || ''} onChange={(event) => { this.setState({ title: event.target.value }); }} name="titleFormat" className={classNames('titleFormat')} />
            <br />
            {(() => {
              if (title) {
                try {
                  return sprintf.sprintf(
                    title,
                    {
                      title: 'AWS Console',
                      profile: 'myProfile',
                      timeLeft: `0:30:${seconds}`,
                    },
                  );
                } catch { /* nothing */ }
              }
              return title;
            })()}
          </Col>
          {(() => {
            if (title && title !== tabTitlePreferenceV2) {
              return (
                <Col>
                  <Button onClick={() => {
                    this.setPreference({
                      tabTitlePreferenceV2: title,
                    });
                  }}
                  >
                    Save
                  </Button>
                </Col>
              );
            }
            return null;
          })()}
        </Row>
      </Container>
    );
  }
}

export default Settings;
