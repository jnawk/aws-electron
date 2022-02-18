import * as ini from 'ini';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import {
  CreateAccessKeyCommand,
  DeleteAccessKeyCommand,
  GetUserCommand,
  IAMClient,
  UpdateAccessKeyCommand,
} from '@aws-sdk/client-iam';
import { AwsCredentialsFile, RotateKeyArguments } from './types';

const readFileOptions = {
  encoding: 'utf-8', flags: 'r',
};

const writeFileOptions = {
  encoding: 'utf-8', mode: 0o600,
};

type GetAwsCredentialsFileArguments = {
  awsCredentialsFile?: string
}

function getAWSCredentialsFile({
  awsCredentialsFile,
}: GetAwsCredentialsFileArguments): string {
  return awsCredentialsFile || path.join(os.homedir(), '.aws', 'credentials');
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

export default async function rotateKey({
  awsCredentialsFile, profile, aws, local,
}: RotateKeyArguments): Promise<Array<string>> {
  const credentials = await getAWSCredentials({ awsCredentialsFile });
  const existingKeyId = credentials[profile].aws_access_key_id;

  let iam = new IAMClient({
    credentials: fromIni({ profile }),
  });

  const log = ['Getting user'];
  try {
    const userResult = await iam.send(new GetUserCommand({}));
    if (userResult === undefined) {
      throw new Error('Who are you?');
    }
    const user = userResult.User;
    if (user === undefined) {
      throw new Error('Who are you?');
    }

    log.push('Creating new access key');
    const newKey = await iam.send(
      new CreateAccessKeyCommand({ UserName: user.UserName }),
    );
    if (newKey === undefined) {
      throw new Error("Can't make new key");
    }
    const accessKey = newKey.AccessKey;
    if (accessKey === undefined) {
      throw new Error('AWS gave bullshit');
    }

    if (local === 'BACKUP') {
      credentials[`${profile}Backup`] = credentials[profile];
    }

    credentials[profile] = {
      aws_access_key_id: accessKey.AccessKeyId,
      aws_secret_access_key: accessKey.SecretAccessKey,
    };

    log.push('Writing credentials file');
    void fs.writeFile(
      getAWSCredentialsFile({ awsCredentialsFile }),
      ini.stringify(credentials),
      writeFileOptions,
    );

    if (aws === 'RETAIN') {
      return ['Success'];
    }

    iam = new IAMClient({
      credentials: fromIni({ profile }),
    });

    log.push('Deactivating old Access Key');
    await iam.send(new UpdateAccessKeyCommand({
      AccessKeyId: existingKeyId,
      Status: 'Inactive',
    }));

    if (aws === 'DELETE') {
      log.push('Deleting old Access Key');
      await iam.send(
        new DeleteAccessKeyCommand({ AccessKeyId: existingKeyId }),
      );
    }
  } catch {
    log.push('Failed');
    return log;
  }
  return ['Success'];
}
