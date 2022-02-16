import * as fs from 'fs';
import * as ini from 'ini';
import * as os from 'os';
import * as path from 'path';

import {
  GetUsableProfilesArguments,
} from './types';

const readFileOptions = {
  encoding: 'utf-8', flags: 'r',
};

function cleanProfileKey(key: string): string {
  return key.replace('profile ', '');
}

export function isLikelyVaultV4Config(config: any): boolean { // TODO not any
  /*
      AWS Vault version 4 (and earlier, I dunno?) caused things like
      mfa_serial to be inheritable from the source_profile.  They have since
      learned the error of their ways, but no doubt there are misguided
      individuals out there still using this version's broken features.

      Having a mfa_serial on the default profile is a dead giveaway.
     */

  return Object.keys(config).map((key) => config[key]).some((profile) => {
    let sourceProfile = profile.source_profile;
    if (!sourceProfile) {
      return false;
    }

    sourceProfile = config[sourceProfile];
    if (!sourceProfile) {
      return false;
    }

    return !!sourceProfile.mfa_serial;
  });
}

export function getAWSConfig(
  awsConfigFile?: string,
  awsCredentialsFile?: string,
): any { // TODO not any
  if (!awsConfigFile) {
    awsConfigFile = path.join(os.homedir(), '.aws', 'config');
  }
  if (!awsCredentialsFile) {
    awsCredentialsFile = path.join(os.homedir(), '.aws', 'credentials');
  }

  const awsConfigFileContent = fs.readFileSync(awsConfigFile, readFileOptions);
  const awsCredentialsFileContent = fs.readFileSync(awsCredentialsFile, readFileOptions);
  const awsConfig = ini.parse(awsConfigFileContent);
  const awsCredentials = ini.parse(awsCredentialsFileContent);
  for (const key in awsConfig) {
    const value = awsConfig[key];
    delete awsConfig[key];
    awsConfig[cleanProfileKey(key)] = value;
  }
  const credentialsProfiles = Object.keys(awsCredentials);
  const configs = {
    awsConfig,
    credentialsProfiles,
    longTermCredentialsProfiles: credentialsProfiles.filter(
      (profile): boolean => awsCredentials[
        profile
      ].aws_access_key_id.startsWith('AKIA'),
    ),
    vaultConfig: undefined,
  };
  if (isLikelyVaultV4Config(awsConfig)) {
    // this feels yuck // yes but why are we doing this?
    const vaultConfig = JSON.parse(JSON.stringify(awsConfig));

    for (const profile in vaultConfig) {
      if (vaultConfig[profile].source_profile) {
        const sourceProfile = vaultConfig[vaultConfig[profile].source_profile];
        for (const key in sourceProfile) {
          if (!(key in vaultConfig[profile])) {
            vaultConfig[profile][key] = sourceProfile[key];
          }
        }
      }
    }
    configs.vaultConfig = vaultConfig;
  } else {
    delete configs.vaultConfig;
  }

  return configs;
}

export function getProfileList(
  config: any,
  profileName: string,
): Array<string> {
  const profiles = [profileName];
  let profileConfig = config[profileName];
  while (profileConfig !== undefined && 'source_profile' in profileConfig) {
    const sourceProfile: string = profileConfig.source_profile;
    if (profiles.includes(sourceProfile)) {
      throw new Error(
        `Loop in profiles: ${profiles.join(', ')} + ${sourceProfile}`,
      );
    }
    profiles.push(sourceProfile);
    const nextProfile = config[sourceProfile];

    if (nextProfile && nextProfile.role_arn === undefined) {
      // if we've found a config profile with no role_arn, then the chain
      // is supposed to stop with a credentials profile with the same name.
      profileConfig = undefined;
    } else {
      profileConfig = nextProfile;
    }
  }
  return profiles.reverse();
}

type IsSingleRoleAssumingProfileArguments = {
  profile: {
      source_profile?: string,
      [key: string]: unknown
  },
  profileName: string,
  credentialsProfiles: Array<string>
}

function isSingleRoleAssumingProfile({
  profile,
  profileName,
  credentialsProfiles,
}: IsSingleRoleAssumingProfileArguments): boolean {
  const credentialsProfile = profile.source_profile || profileName;
  return (
    Object.keys(profile).includes('role_arn')
        && credentialsProfiles.includes(credentialsProfile)
  );
}

type IsMultiStageRoleAssumingProfileArguments = {
  config: any, // TODO not any
  profileName: string
}

function isMultiStageRoleAssumingProfile(
  { config, profileName }: IsMultiStageRoleAssumingProfileArguments,
): boolean {
  const profileList = getProfileList(config, profileName);
  if (profileList.length < 2) {
    // can't be multi stage assume
    return false;
  }

  // need to check for role_arn presence on all but the first profile
  for (let i = 1; i < profileList.length; i += 1) {
    const profile = config[profileList[i]];
    if (profile.role_arn === undefined) {
      return false;
    }
  }

  // since we are following source_profile chains, there necessarily is one
  // we aren't checking the credentials file in other places, so why do so
  // here?
  return true;
}

export function getUsableProfiles({
  config, credentialsProfiles,
}: GetUsableProfilesArguments): Array<string> {
  return Object.keys(config).filter((key) => {
    const profile = config[key];
    return isSingleRoleAssumingProfile(
      { profile, profileName: key, credentialsProfiles },
    ) || isMultiStageRoleAssumingProfile(
      { config, profileName: key },
    );
  });
}

type GetCachableProfilesArguments = {
  config: any // TODO not any
}

export function getCachableProfiles({
  config,
}: GetCachableProfilesArguments): any { // TODO not any
  const mfaProfiles = Object.keys(config.awsConfig).filter((key) => {
    const profile = config.awsConfig[key];
    if (profile.mfa_serial === undefined) {
      return false;
    }
    if (profile.role_arn !== undefined) {
      return false;
    }
    let shortTermCredentialsProfile: string = profile.source_profile;
    if (shortTermCredentialsProfile === undefined) {
      shortTermCredentialsProfile = key;
    }
    const longTermCredentialsProfile = (
      `${shortTermCredentialsProfile}::source-profile`
    );
    return (
      (config.longTermCredentialsProfiles.includes(
        longTermCredentialsProfile,
      ) || (config.longTermCredentialsProfiles.includes(
        shortTermCredentialsProfile,
      ))));
  });
  const newConfig = JSON.parse(JSON.stringify(config));
  const toRemove = (Object.keys(config.awsConfig)
    .filter((key):boolean => !(mfaProfiles.includes(key))));
  toRemove.map((key) => {
    delete newConfig.awsConfig[key];
  });
  delete newConfig.vaultConfig;
  return newConfig;
}
