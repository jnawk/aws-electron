/* eslint-disable camelcase */
export interface AwsConfigProfile {
    role_arn?: string,
    source_profile?: string,
    mfa_serial?: string,
    region?: string,
    duration_seconds?: number,
    ca_bundle?: string,
    [key: string]: unknown
}

export interface AwsCredentialsProfile {
    aws_access_key_id?: string,
    aws_secret_access_key?: string,
    aws_session_token?: string,
    [key: string]: unknown
}
