import * as React from 'react';
import {
  Alert, Button, Col, Container, Row,
} from 'reactstrap';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import 'bootstrap/dist/css/bootstrap.css';
import './vaultMessage.css';
import './profileList.css';
import './mfaBox.css';
import './tt.css';

import { AwsConfigFile } from '_/main/types';
import { profileRows } from './getRoleData';
import { launchButtonGenerator } from './mfaAwareButtonGenerator';
import { profileRow } from './profileListGenerator';

const { backend } = window; // defined in preload.js

interface AWSConsoleState {
    mfaCode: string,
    remember: boolean,
    usableProfiles?: Array<string>,
    awsConfig?: AwsConfigFile,
    vaultConfig?: AwsConfigFile,
    credentialsProfiles?: Array<string>,
    explicitTreatConfigProperly?: boolean,
    expiredCredentialsProfiles: Array<string>
}

export default class AWSConsole extends React.Component<Record<string, never>, AWSConsoleState> {
  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      mfaCode: '',
      remember: false,
      expiredCredentialsProfiles: [],
    };
  }

  componentDidMount(): void {
    const configPromise = backend.getAWSConfig();
    const preferencesPromise = backend.getPreferences();
    void Promise.all(
      [configPromise, preferencesPromise],
    ).then(([configs, preferences]) => {
      const vaultPreference = (preferences === undefined
        ? 'ask' : preferences.vaultPreference || 'ask');
      const properly = (vaultPreference === 'ask'
        ? undefined : vaultPreference === 'aws');
      const {
        awsConfig,
        vaultConfig,
        credentialsProfiles,
      } = configs;
      this.setState({
        awsConfig, vaultConfig, credentialsProfiles, explicitTreatConfigProperly: properly,
      });

      const usingAwsConfig = vaultConfig === undefined || properly;
      const config = usingAwsConfig ? awsConfig : vaultConfig || awsConfig;
      return backend.getUsableProfiles({ config, credentialsProfiles });
    }).then(
      (usableProfiles) => this.setState({ usableProfiles }),
    );
  }

  launchFailure(credentialsProfileName: string): void {
    const { expiredCredentialsProfiles } = this.state;
    if (!(expiredCredentialsProfiles.includes(credentialsProfileName))) {
      this.setState({
        expiredCredentialsProfiles: [credentialsProfileName, ...expiredCredentialsProfiles],
      });
    }
  }

  launchSuccess(credentialsProfileName: string): void {
    const { expiredCredentialsProfiles } = this.state;
    this.setState({
      expiredCredentialsProfiles: expiredCredentialsProfiles.filter((value) => value !== credentialsProfileName),
    });
  }

  treatConfigProperly(properly: boolean): void {
    const {
      awsConfig,
      vaultConfig,
      credentialsProfiles,
      remember,
    } = this.state;

    this.setState({ explicitTreatConfigProperly: properly });

    const usingAwsConfig = properly || vaultConfig === undefined;
    const config = usingAwsConfig ? awsConfig : vaultConfig;
    if (config && credentialsProfiles) {
      void backend.getUsableProfiles({ config, credentialsProfiles })
        .then((usableProfiles) => {
          this.setState({ usableProfiles });
        });
    }
    if (remember) {
      backend.setPreference({ vaultPreference: properly ? 'aws' : 'vault' });
    }
  }

  vaultMessage(): React.ReactElement | null {
    const { explicitTreatConfigProperly, vaultConfig, remember } = this.state;

    const displayVaultMessage = (
      explicitTreatConfigProperly === undefined
      && vaultConfig !== undefined);
    if (!displayVaultMessage) {
      return null;
    }
    return (
      <CSSTransition
        key="foo"
        classNames="vaultMessage"
        timeout={{ enter: 1, exit: 300 }}
      >
        <Alert variant="info">
          <h1>Vault V4 Style config detected!</h1>
          <p>
            Your config file has at least one role-assuming profile which defines a &nbsp;
            <span className="tt">source_profile</span>
            &nbsp; that exists as a &nbsp;
            <i>config</i>
            &nbsp; profile.  (
            <span className="tt">source_profile</span>
            &nbsp; canonically refers to a &nbsp;
            <i>credentials</i>
            &nbsp; profile).
          </p>
          <p>
            When using the awscli, this profile will &nbsp;
            <b>not</b>
            &nbsp; inherit the config from the config profile matching the &nbsp;
            <span className="tt">source_profile</span>
            , while with aws-vault (version 4), the profile &nbsp;
            <b>will</b>
            &nbsp; inherit the config from the config profile matching the
            <span className="tt">source_profile</span>
            .  (The authors of aws-vault have since realised the error of their ways,
            and version 5 behaves canonically, if their documentation is to be trusted.)
          </p>
          <p>
            This software will treat configs that &nbsp;
            <i>look</i>
            &nbsp; like vault configs as vault configs, unless you tell it not to.
          </p>
          <Button onClick={() => this.treatConfigProperly(true)}>
            Please treat my config file properly.
          </Button>
          &nbsp;
          <Button onClick={() => this.treatConfigProperly(false)}>
            Please treat my config file as a V4 Vault config.
          </Button>
          &nbsp;
          <label htmlFor="remember">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={() => this.setState({ remember: !remember })}
            />
            &nbsp; Remember this
          </label>
        </Alert>
      </CSSTransition>
    );
  }

  render(): React.ReactElement {
    const {
      awsConfig,
      vaultConfig,
      mfaCode,
      explicitTreatConfigProperly,
      usableProfiles,
      expiredCredentialsProfiles,
    } = this.state;

    if (!awsConfig || !usableProfiles) {
      return <>Loading...</>;
    }

    // we are using vanilla AWS config if the user has said so,
    // or if we never received a vault style config to start with
    const usingAwsConfig = (explicitTreatConfigProperly
      || vaultConfig === undefined);

    const config = usingAwsConfig ? awsConfig : vaultConfig || awsConfig;
    const configType = usingAwsConfig ? 'awsConfig' : 'vaultConfig';

    return (
      <>
        <TransitionGroup>
          {this.vaultMessage()}
        </TransitionGroup>
        <Container fluid>
          <Row className="d-none d-sm-table-row">
            <Col className="d-none d-sm-table-cell" sm={2} md={3}>
              <b>Profile Name</b>
            </Col>
            <Col className="d-none d-md-table-cell" md={3}>
              <b>Role Account</b>
            </Col>
            <Col className="d-none d-md-table-cell" md={2}>
              <b>Role Name</b>
            </Col>
            <Col className="d-none d-lg-table-cell" lg={2}>
              <b>MFA ARN or Serial Number</b>
            </Col>
            <Col className="d-none d-md-table-cell" md={2}>
              <b>Credentials Profile</b>
            </Col>
          </Row>
          {profileRows({
            usableProfiles,
            config,
            configType,
            mfaCode,
            expiredCredentialsProfiles,
            clearMfaCode: () => this.setState({ mfaCode: '' }),
            launchConsole: (args) => backend.launchConsole(args),
            launchButtonGenerator,
            profileRowGenerator: profileRow,
            onError: (credentialsProfileName) => { this.launchFailure(credentialsProfileName); },
            onSuccess: (credentialsProfileName) => { this.launchSuccess(credentialsProfileName); },
          })}
          {usableProfiles.some(
            (profile: string) => config[profile].mfa_serial !== undefined,
          ) ? (
            <Row className="mfaBox">
              <Col>
                <input
                  type="text"
                  value={mfaCode}
                  placeholder="MFA Code"
                  onChange={(
                    event: React.ChangeEvent<HTMLInputElement>,
                  ) => this.setState({
                    mfaCode: event.target.value,
                  })}
                />
              </Col>
            </Row>
            ) : null}
        </Container>
      </>
    );
  }
}
