import * as ProxyAgent from 'proxy-agent';
import * as QueryString from 'query-string';
import * as https from 'https';
import * as splitCa from 'split-ca';
import * as urllib from 'urllib';
import {
  AssumeRoleCommand,
  STSClient,
  Credentials as TemporaryCredentials,
} from '@aws-sdk/client-sts';
import { CredentialProvider, Credentials } from '@aws-sdk/types';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { session } from 'electron';
import { getProfileList } from './AWSConfigReader';
import {
  AssumeRoleParams, GetFederationUrlArguments, GetHttpAgentArguments, GetSigninTokenArguments, SigninResult,
} from './types';

const consoleURL = 'https://console.aws.amazon.com';
const stsEndpoint = 'https://sts.amazonaws.com';

export async function getHttpAgent({
  sessionDriver,
  url,
  ca,
}: GetHttpAgentArguments): Promise<https.Agent> {
  let proxy = await (sessionDriver || session).defaultSession.resolveProxy(url);

  if (proxy === 'DIRECT') {
    return new https.Agent({
      rejectUnauthorized: true,
      ca,
    });
  }

  proxy = proxy.replace(/PROXY ([^;]+);?/, '$1');
  const hasScheme = proxy.match(/^(https?):\/\//i);
  if (!hasScheme) {
    proxy = `http://${proxy}`;
  }
  return new ProxyAgent(proxy);
}

async function configureProxy(
  config: any,
): Promise<https.Agent> { // TODO rename
  // assume same proxy & CA bundle for all AWS endpoints
  const httpAgent = await getHttpAgent({
    url: stsEndpoint,
    ca: config.ca_bundle ? splitCa(config.ca_bundle) : undefined,
  });
  return httpAgent;
}

async function getRoleCredentials(
  config: any,
  tokenCode: string,
  profileName: string,
): Promise<any> { // TODO not any
  const profileList = getProfileList(config, profileName);

  // set the long-term credentials
  let profile: string;
  if (profileList.length === 1) {
    // the profile has a role to assume _and_ credentials to use.
    // (it needs a role, we can't work with it otherwise)
    profile = profileName;
  } else {
    // the first profile in profileList contains the credentials,
    // (and maybe a role to assume)
    profile = profileList[0];
  }

  const httpAgent = await configureProxy(config);
  const requestHandler = new NodeHttpHandler({ httpAgent });

  let credentials: Credentials | CredentialProvider | TemporaryCredentials;
  credentials = fromIni({ profile });

  let sts = new STSClient({ credentials, requestHandler });

  for (const profileNumber in profileList) {
    profile = profileList[profileNumber];
    const profileConfig = config[profile];
    if (profileConfig !== undefined && 'role_arn' in profileConfig) {
      // assume the role
      const assumeRoleParams: AssumeRoleParams = {
        RoleArn: profileConfig.role_arn,
        RoleSessionName: `${profileName}${new Date().getTime()}`,
      };
      if (profileConfig.mfa_serial) {
        // this better only be on the first assume role profile in the chain!
        assumeRoleParams.SerialNumber = profileConfig.mfa_serial;
        assumeRoleParams.TokenCode = tokenCode;
      }
      if (profileConfig.duration_seconds) {
        assumeRoleParams.DurationSeconds = profileConfig.duration_seconds;
      }

      // eslint-disable-next-line no-await-in-loop
      const assumedRole = await sts.send(
        new AssumeRoleCommand(assumeRoleParams),
      );
      if (assumedRole === undefined
        || assumedRole.Credentials === undefined) {
        throw new Error('Shit went wrong');
      }

      credentials = assumedRole.Credentials;
      if (credentials === undefined) {
        throw new Error('What is going on');
      }
      const accessKeyId = credentials.AccessKeyId;
      const secretAccessKey = credentials.SecretAccessKey;
      const sessionToken = credentials.SessionToken;
      if (accessKeyId === undefined
        || secretAccessKey === undefined
        || sessionToken === undefined) {
        throw new Error('What is going on');
      }

      // update the credentials
      sts = new STSClient({
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
        },
        requestHandler,
      });
    } else {
      // this must be profile 0, and only credentials,
      // skip to the next
    }
  }
  return credentials;
}

function getFederationUrl(
  params: GetFederationUrlArguments,
): string {
  return `https://signin.aws.amazon.com/federation?${QueryString.stringify(params)}`;
}

async function getSigninToken(
  { credentials, httpAgent }: GetSigninTokenArguments,
): Promise<string> {
  const getSigninTokenUrl = getFederationUrl({
    Action: 'getSigninToken',
    DurationSeconds: 900,
    SessionType: 'json',
    Session: JSON.stringify({
      sessionId: credentials.AccessKeyId,
      sessionKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
    }),
  });

  const response = await urllib.request(getSigninTokenUrl, { agent: httpAgent });
  const responseData = response.data.toString();
  const json: SigninResult = JSON.parse(responseData);
  return json.SigninToken;
}

export async function getConsoleUrl(
  config: any,
  tokenCode: string,
  profileName: string,
): Promise<string> {
  // determine if a proxy is necessary, and inject a CA bundle if defined.
  const httpAgent = await configureProxy(config);

  const roleCredentials = await getRoleCredentials(config, tokenCode, profileName);
  const signinToken = await getSigninToken(
    { credentials: roleCredentials, httpAgent },
  );

  return getFederationUrl({
    Action: 'login',
    SigninToken: signinToken,
    Destination: consoleURL,
    SessionDuration: 43200,
  });
}
