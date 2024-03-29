import * as ini from 'ini';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { GetSessionTokenCommand, STSClient } from '@aws-sdk/client-sts';
import { AwsConfigFile, AwsCredentialsFile } from './types';

const readFileOptions = {
    encoding: 'utf-8' as const, flags: 'r',
};

const writeFileOptions = {
    encoding: 'utf-8' as const, mode: 0o600,
};

type GetAwsCredentialsFileArguments = {
    awsCredentialsFile?: string
}

const getAWSCredentialsFile = ({
    awsCredentialsFile,
}: GetAwsCredentialsFileArguments) => awsCredentialsFile || path.join(
    os.homedir(),
    '.aws',
    'credentials',
);

type GetAwsConfigFileArguments = {
    awsConfigFile?: string
}

function getAWSConfigFile({
    awsConfigFile,
}: GetAwsConfigFileArguments): string {
    return awsConfigFile || path.join(os.homedir(), '.aws', 'config');
}

type GetAwsConfigArguments = {
    awsConfigFile?: string
}

async function getAWSConfig({
    awsConfigFile,
}: GetAwsConfigArguments): Promise<AwsConfigFile> {
    const awsConfigFileContent = await fs.readFile(
        getAWSConfigFile({ awsConfigFile }),
        readFileOptions,
    );
    const awsCredentials = ini.parse(awsConfigFileContent.toString());
    return awsCredentials;
}

type GetAwsCredentialsArguments = {
    awsCredentialsFile?: string
}

async function getAWSCredentials({
    awsCredentialsFile,
}: GetAwsCredentialsArguments): Promise<AwsCredentialsFile> {
    const awsCredentialsFileContent = await fs.readFile(
        getAWSCredentialsFile({ awsCredentialsFile }),
        readFileOptions,
    );
    const awsCredentials = ini.parse(awsCredentialsFileContent.toString());
    return awsCredentials;
}

export type AsyncDoMfaArguments = {
    awsConfigFile?: string,
    awsCredentialsFile?: string,
    profileName: string,
    mfaCode: string
}

export async function doMfa({
    awsConfigFile, awsCredentialsFile, profileName, mfaCode,
}: AsyncDoMfaArguments): Promise<void> {
    const config = await getAWSConfig({ awsConfigFile });
    const credentials = await getAWSCredentials({ awsCredentialsFile });

    let profile: string;
    if (profileName in credentials) {
        const credentialsProfile = credentials[profileName];
        if (credentialsProfile && credentialsProfile.aws_access_key_id && credentialsProfile.aws_access_key_id.startsWith('ASIA')) {
            profile = `${profileName}::source-profile`;
        } else {
            profile = profileName;
            credentials[`${profileName}::source-profile`] = credentials[profileName];
        }
    } else {
        throw new Error('WTF is going on');
    }

    const sts = new STSClient({
        credentials: fromIni({ profile }),
    });

    const temporaryCredentials = (await sts.send(new GetSessionTokenCommand({
        SerialNumber: config[`profile ${profileName}`].mfa_serial,
        TokenCode: mfaCode,
        DurationSeconds: 86400,
    }))).Credentials;
    if (temporaryCredentials === undefined) {
        throw new Error('Unable to obtain credentials');
    }
    credentials[profileName] = {
        aws_access_key_id: temporaryCredentials.AccessKeyId,
        aws_secret_access_key: temporaryCredentials.SecretAccessKey,
        aws_session_token: temporaryCredentials.SessionToken,
    };

    void fs.writeFile(
        getAWSCredentialsFile({ awsCredentialsFile }),
        ini.stringify(credentials),
        writeFileOptions,
    );
}
