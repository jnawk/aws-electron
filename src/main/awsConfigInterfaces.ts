/* eslint-disable camelcase */
export interface ConfigProfile {
    role_arn?: string,
    source_profile?: string,
    mfa_serial?: string,
    region?: string,
    duration_seconds?: number,
    [key: string]: unknown
  }

export interface CredentialsProfile {
    aws_access_key_id?: string,
    aws_secret_access_key?: string,
    aws_session_token?: string,
    [key: string]: unknown
  }
