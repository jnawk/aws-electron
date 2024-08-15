import { z } from "zod"

export const EntryTypeSchema = z.union([
  z.literal("profile"),
  z.literal("sso-session"),
])

export type EntryType = z.infer<typeof EntryTypeSchema>

const Extra = z
  .object({
    order: z.number().optional(),
    entryType: EntryTypeSchema.optional(),
  })
  .passthrough()

export const SsoSessionSchema = Extra.merge(
  z.object({
    sso_start_url: z.string().optional(),
    sso_registration_scopes: z.string().optional(),
    sso_region: z.string().optional(),
  }),
)

export const ProfileSchema = Extra.merge(
  z.object({
    role_arn: z.string().optional(),
    mfa_serial: z.string().optional(),
    source_profile: z.string().optional(),
    region: z.string().optional(),
    sso_session: z.string().optional(),
    sso_account_id: z.string().optional(),
    sso_role_name: z.string().optional(),
  }),
)
export const ConfigEntrySchema = SsoSessionSchema.merge(ProfileSchema)

export type ConfigEntry = z.infer<typeof ConfigEntrySchema>
export type Profile = z.infer<typeof ProfileSchema>
export type SsoSession = z.infer<typeof SsoSessionSchema>

export const CredentialsSchema = z
  .object({
    aws_access_key_id: z.string(),
    aws_secret_access_key: z.string(),
    aws_session_token: z.string().optional(),
  })
  .passthrough()

export type Credentials = z.infer<typeof CredentialsSchema>

export const ConfigSchema = z.object({
  profiles: z.record(z.string(), ProfileSchema),
  ssoSessions: z.record(z.string(), SsoSessionSchema).optional(),
  credentialProfiles: z.array(z.string()),
  longTermCredentialProfiles: z.array(z.string()),
  usableProfiles: z.array(z.string()),
  cachableProfiles: z.array(z.string()),
  standardProfiles: z.array(z.string()),
})

export type Config = z.infer<typeof ConfigSchema>

export const SigninResultSchema = z.object({ SigninToken: z.string() })

export type SigninResult = z.infer<typeof SigninResultSchema>

export const OidcClientSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  clientSecretExpiresAt: z.number(),
})

export type OidcClient = z.infer<typeof OidcClientSchema>

export const SsoTokenSchema = z.object({
  accessToken: z.string(),
  expiresAt: z.number(),
})

export type SsoToken = z.infer<typeof SsoTokenSchema>

export const SsoProfileSchema = z.object({
  accountId: z.string(),
  accountName: z.string(),
  roleName: z.string(),
})

export type SsoProfile = z.infer<typeof SsoProfileSchema>
