import * as React from 'react';
import { Col, Container, Row } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.css';
import './profileList.css';
import './mfaBox.css';
import { Configs } from '_main/types';
import { mfaRows } from './getRoleData';

import { mfaButtonGenerator } from './mfaAwareButtonGenerator';
import { mfaRow } from './profileListGenerator';

const { backend } = window; // defined in preload.js

interface MfaCacheState {
    mfaCode: string,
    config?: Configs,
}

class MfaCache extends React.Component<Record<string, never>, MfaCacheState> {
  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      mfaCode: '',
    };
  }

  componentDidMount(): void {
    void backend.getAWSConfig().then(
      (config) => backend.getMfaProfiles({ config }),
    ).then(
      (config) => this.setState({ config }),
    );
  }

  render(): React.ReactElement {
    const {
      config,
      mfaCode,
    } = this.state;
    if (!config) {
      return <>Loading...</>;
    }

    return (
      <Container fluid>
        <Row className="d-none d-sm-table-row">
          <Col className="d-none d-sm-table-cell" sm={2} md={3}>
            <b>Profile Name</b>
          </Col>
          <Col className="d-none d-lg-table-cell" lg={2}>
            <b>MFA ARN or Serial Number</b>
          </Col>
          <Col className="d-none d-md-table-cell" md={2}>
            <b>Credentials Profile</b>
          </Col>
        </Row>
        {mfaRows({
          config,
          mfaCode,
          clearMfaCode: () => this.setState({ mfaCode: '' }),
          doMfa: backend.doMfa,
          mfaButtonGenerator,
          mfaRowGenerator: mfaRow,
        })}
        <Row className="mfaBox">
          <Col>
            <input
              type="text"
              value={mfaCode}
              placeholder="MFA Code"
              onChange={(
                event: React.ChangeEvent<HTMLInputElement>,
              ) => this.setState({ mfaCode: event.target.value })}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default MfaCache;
