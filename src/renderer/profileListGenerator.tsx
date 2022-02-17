import * as React from 'react';
import { Col, Row } from 'reactstrap';
import { ConfigProfile } from '_/main/awsConfigInterfaces';
import { LaunchButton, MfaRowArguments, ProfileRowArguments } from '_/main/types';

interface RowGeneratorArguments {
    profile: ConfigProfile,
    profileName: string,
    roleRegexResult?: Array<string>,
    fullRoleName?:string,
    shortRoleName?:string
}

function rowGenerator(
  {
    profile,
    profileName,
    roleRegexResult,
    fullRoleName,
    shortRoleName,
  }:RowGeneratorArguments,
  buttonGenerator: LaunchButton,
): React.ReactElement {
  return (
    <Row className="d-table-row" key={profileName}>
      <Col className="d-none d-sm-table-cell" sm={2} md={3}>
        {profileName.replace(/-/g, String.fromCharCode(0x2011))}
      </Col>
      {roleRegexResult
        ? (
          <Col className="d-none d-md-table-cell" md={3}>
            {roleRegexResult[1]}
            {' '}
            {/* role account */}
          </Col>
        ) : undefined}
      {fullRoleName && shortRoleName
        ? (
          <Col className="d-none d-md-table-cell" md={2}>
            <div title={(fullRoleName === shortRoleName
              ? undefined : fullRoleName)}
            >
              {shortRoleName}
            </div>
          </Col>
        ) : undefined}
      <Col className="d-none d-lg-table-cell" lg={2}>
        {(profile.mfa_serial
          ? profile.mfa_serial.replace(/arn:aws:iam::/, '') : '')}
      </Col>
      <Col className="d-none d-md-table-cell" md={2}>
        {profile.source_profile ? profile.source_profile.replace(/-/g, String.fromCharCode(0x2011)) : ''}
      </Col>
      <Col className="d-table-cell d-sm-none launchButton">
        {buttonGenerator(profileName)}
      </Col>
      <Col className="d-none d-sm-table-cell launchButton" sm={2} md={2}>
        {buttonGenerator()}
      </Col>
    </Row>
  );
}

export function mfaRow({
  profileName,
  profile,
  mfaButton,
}: MfaRowArguments): React.ReactElement {
  return rowGenerator({ profileName, profile }, mfaButton);
}

export function profileRow({
  profileName,
  roleRegexResult,
  fullRoleName,
  shortRoleName,
  profile,
  launchButton,
}: ProfileRowArguments): React.ReactElement {
  return rowGenerator({
    profileName, roleRegexResult, fullRoleName, shortRoleName, profile,
  }, launchButton);
}
