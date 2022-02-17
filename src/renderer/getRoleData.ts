import { Row } from 'reactstrap';
import {
  GetRoleDataArguments,
  GetRoleDataResult,
  MfaRowsArguments,
  ProfileRowsArguments,
} from './types';

const roleRegex = /arn:aws:iam::(\d{12}):role\/(.*)/;

function getRoleData({
  profile, mfaCode,
}: GetRoleDataArguments): GetRoleDataResult {
  const roleRegexResult = roleRegex.exec(profile.role_arn);
  const shouldDisable = (profile.mfa_serial !== undefined
    && mfaCode.length !== 6);

  if (roleRegexResult === null) {
    throw new Error('WTF is going on');
  }

  // TODO the assumption that the role regex result has >= 3 entries is faulty
  const fullRoleName = roleRegexResult[2].replace(/-/g, String.fromCharCode(0x2011));
  let shortRoleName: string;
  if (fullRoleName && fullRoleName.length > 45) {
    const first20 = fullRoleName.substring(0, 20);
    const last20 = fullRoleName.substring(fullRoleName.length - 20);
    shortRoleName = `${first20}...${last20}`;
  } else {
    shortRoleName = fullRoleName;
  }
  const result = {
    roleRegexResult,
    shouldDisable,
    fullRoleName,
    shortRoleName,
  };
  return result;
}

export function profileRows({
  usableProfiles,
  config,
  configType,
  mfaCode,
  clearMfaCode,
  launchConsole,
  launchButtonGenerator,
  profileRowGenerator,
}: ProfileRowsArguments): Array<Row> {
  return usableProfiles.map((profileName: string) => {
    const profile = config[profileName];
    const launchProfile = () => {
      launchConsole({ profileName, mfaCode, configType });
      clearMfaCode();
    };

    const {
      roleRegexResult,
      shouldDisable,
      fullRoleName,
      shortRoleName,
    } = getRoleData({ profile, mfaCode });
    const launchButton = launchButtonGenerator({
      launchProfile, shouldDisable,
    });

    return profileRowGenerator({
      profileName,
      roleRegexResult,
      fullRoleName,
      shortRoleName,
      profile,
      launchButton,
    });
  });
}

export function mfaRows({
  config,
  mfaCode,
  clearMfaCode,
  doMfa,
  mfaButtonGenerator,
  mfaRowGenerator,
}: MfaRowsArguments): Array<Row> {
  return Object.keys(config.awsConfig).map((profileName): Row => {
    const profile = config.awsConfig[profileName];
    const launchProfile = () => {
      doMfa({ profileName, mfaCode });
      clearMfaCode();
    };

    const shouldDisable = mfaCode.length !== 6;
    const mfaButton = mfaButtonGenerator({ launchProfile, shouldDisable });

    return mfaRowGenerator({
      profileName,
      profile,
      mfaButton,
    });
  });
}
