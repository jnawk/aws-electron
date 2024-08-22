import * as os from "os"
import * as path from "path"
import * as fs from "fs"
import * as util from "util"
import * as models from "models"
import * as ini from "ini"
import debounce from "debounce"
import settings from "electron-settings"
import * as ssoOidc from "@aws-sdk/client-sso-oidc"
import * as sso from "@aws-sdk/client-sso"

import { shell } from "electron"

const readFile = util.promisify(fs.readFile)

const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code"

interface GetOidcClientArgs {
  profileName: string
  ssoSession: models.SsoSession
}

interface GetConfigArgs {
  configPath?: string
}

interface GetSsoConfigArgs extends GetConfigArgs {
  profileName: string
  receiver: { (profiles?: Array<models.SsoProfile>): void }
}

interface GetProfilesArgs {
  entries: [string, models.ConfigEntry][]
}

interface UsableProfileFilterArguments {
  profiles: Record<string, models.Profile>
  profileName: string
}

interface CredentialsProfiles {
  credentialProfiles: string[]
  longTermCredentialProfiles: string[]
}

const readFileOptions = {
  encoding: "utf-8" as const,
  flag: "r" as const,
}

function cleanProfileKey(key: string): string {
  return key.replace("profile ", "").replace("sso-session ", "")
}

function entryType(name: string): models.EntryType {
  const components = name.split(" ")
  if (components.length === 1) {
    return "profile"
  }
  return models.EntryTypeSchema.parse(components[0])
}

async function getConfigEntries({
  configPath,
}: GetConfigArgs): Promise<[string, models.ConfigEntry][]> {
  const configFilePath = path.join(configPath!, "config")
  const configFileContent = await readFile(configFilePath, readFileOptions)
  const awsConfig = ini.parse(configFileContent)
  const entries = Object.entries(awsConfig).map(
    ([entryName, entry], index): [string, models.ConfigEntry] => [
      cleanProfileKey(entryName),
      models.ConfigEntrySchema.parse({
        ...entry,
        order: index,
        entryType: entryType(entryName),
      }),
    ],
  )
  return entries
}

function getProfiles({
  entries,
}: GetProfilesArgs): Record<string, models.Profile> {
  const profiles = entries
    .filter(([, entry]): boolean => entry.entryType === "profile")
    .map(([profileName, profile]) => ({
      [profileName]: profile,
    }))
    .reduce((prev, cur) => ({ ...cur, ...prev }), {})
  return profiles
}

function getSsoSessions({
  entries,
}: GetProfilesArgs): Record<string, models.SsoSession> {
  const ssoSessions = entries
    .filter(([, entry]): boolean => entry.entryType === "sso-session")
    .map(([sessionName, session]) => ({
      [sessionName]: session,
    }))
    .reduce((prev, cur) => ({ ...cur, ...prev }), {})
  return ssoSessions
}

async function getCredentials({
  configPath,
}: GetConfigArgs): Promise<CredentialsProfiles> {
  const credentialsFilePath = path.join(configPath!, "credentials")
  let credentialsFileContent: string
  try {
    credentialsFileContent = await readFile(
      credentialsFilePath,
      readFileOptions,
    )
  } catch {
    // There is no credentials profile!  Shock!  Must be a SSO-only user, or a
    // dirty vault user
    return { credentialProfiles: [], longTermCredentialProfiles: [] }
  }
  const awsCredentials = ini.parse(credentialsFileContent)
  const credentials = Object.entries(awsCredentials)
    .map(([profileName, profile]) => ({
      [profileName]: models.CredentialsSchema.parse(profile),
    }))
    .reduce((prev, cur) => ({ ...prev, ...cur }))

  return {
    credentialProfiles: Object.keys(credentials),
    longTermCredentialProfiles: Object.entries(credentials)
      .filter(([_, profile]) => profile.aws_access_key_id.startsWith("AKIA"))
      .map(([profileName]) => profileName),
  }
}

export function getProfileList(
  config: Record<string, models.Profile>,
  profileName: string,
): Array<string> {
  const profiles = [profileName]
  let profileConfig = config[profileName]
  while (profileConfig !== undefined && profileConfig.source_profile) {
    const sourceProfile = profileConfig.source_profile
    if (profiles.includes(sourceProfile)) {
      throw new Error(
        `Loop in profiles: ${profiles.join(", ")} + ${sourceProfile}`,
      )
    }
    profiles.push(sourceProfile)
    const nextProfile = config[sourceProfile]

    if (nextProfile && nextProfile.role_arn === undefined) {
      // if we've found a config profile with no role_arn, then the chain
      // is supposed to stop with a credentials profile with the same name.
      return profiles.reverse()
    }
    profileConfig = nextProfile
  }
  return profiles.reverse()
}

function isMultiStageRoleAssumingProfile({
  profiles,
  profileName,
}: UsableProfileFilterArguments): boolean {
  const profileList = getProfileList(profiles, profileName).slice(1)

  return (
    profileList.length > 0 &&
    profileList
      .map((profileName) => profiles[profileName])
      .every((profile) => profile.role_arn !== undefined)
  )
}

export async function getConfig({
  configPath = path.join(os.homedir(), ".aws"),
}: GetConfigArgs = {}): Promise<models.Config> {
  const configEntries = await getConfigEntries({ configPath })
  const profiles = getProfiles({ entries: configEntries })
  const ssoSessions = getSsoSessions({ entries: configEntries })

  const { credentialProfiles, longTermCredentialProfiles } =
    await getCredentials({ configPath })
  const usableProfiles = Object.entries(profiles)
    .filter(
      ([profileName, profile]) =>
        (profile.role_arn !== undefined &&
          credentialProfiles.includes(profile.source_profile || profileName)) ||
        isMultiStageRoleAssumingProfile({ profiles, profileName }) ||
        profile.sso_session !== undefined,
    )
    .map(([profileName]) => profileName)

  const cachableProfiles = Object.entries(profiles)
    .filter(([profileName, profile]) => {
      if (profile.mfa_serial === undefined) {
        return false
      }
      if (profile.role_arn !== undefined) {
        return false
      }
      const shortTermCredentialsProfile = profile.source_profile || profileName
      const longTermCredentialProfile = `${shortTermCredentialsProfile}::source-profile`
      return (
        longTermCredentialProfiles.includes(longTermCredentialProfile) ||
        longTermCredentialProfiles.includes(shortTermCredentialsProfile)
      )
    })
    .map(([profileName]) => profileName)

  const standardProfiles = usableProfiles.filter(
    (profile) => profiles[profile].sso_session === undefined,
  )

  return {
    profiles,
    credentialProfiles,
    longTermCredentialProfiles,
    usableProfiles,
    cachableProfiles,
    ssoSessions,
    standardProfiles,
  }
}

export function watchConfigFile(callback: {
  (newConfig: models.Config): void
}): void {
  const configChanged = debounce(async () => {
    callback(await getConfig())
  }, 10)

  fs.watch(
    path.join(os.homedir(), ".aws"),
    { persistent: false },
    (eventType: string, filename: string | Buffer | null) => {
      if (filename !== "config") {
        return
      }
      if (eventType === "change") {
        configChanged()
      }
    },
  )
}

async function getOidcClient({
  profileName,
  ssoSession,
}: GetOidcClientArgs): Promise<models.OidcClient> {
  let oidcClient: models.OidcClient
  const cachedClient = await settings.get(["oidcClients", profileName])
  if (cachedClient !== undefined) {
    oidcClient = models.OidcClientSchema.parse(cachedClient)
    if (oidcClient.clientSecretExpiresAt * 1000 > new Date().getTime()) {
      return oidcClient
    }
  }
  const ssoClient = new ssoOidc.SSOOIDCClient({
    region: ssoSession.sso_region,
  })
  const response = await ssoClient.send(
    new ssoOidc.RegisterClientCommand({
      clientName: "nz.jnawk.awsconsole",
      clientType: "public",
      grantTypes: [DEVICE_GRANT],
      issuerUrl: ssoSession.sso_start_url,
      scopes: ["sso:account:access"],
    }),
  )
  oidcClient = {
    clientId: response.clientId!,
    clientSecret: response.clientSecret!,
    clientSecretExpiresAt: response.clientSecretExpiresAt!,
  }
  settings.set(["oidcClients", profileName], oidcClient)
  return oidcClient
}

export async function getAccessToken(
  { profileName, ssoSession }: GetOidcClientArgs,
  cacheOnly: boolean = false,
): Promise<models.SsoToken> {
  let ssoToken: models.SsoToken
  const cachedToken = await settings.get(["ssoTokens", profileName])
  if (cachedToken !== undefined) {
    ssoToken = models.SsoTokenSchema.parse(cachedToken)
    if (ssoToken.expiresAt > new Date().getTime()) {
      return ssoToken
    }
    // TODO token renewal??
  }

  // TODO this is janky.
  if (cacheOnly) {
    throw new Error("oops, not in cache")
  }
  const oidcClient = await getOidcClient({ profileName, ssoSession })
  const ssoOidcClient = new ssoOidc.SSOOIDCClient({
    region: ssoSession.sso_region,
  })
  const response = await ssoOidcClient.send(
    new ssoOidc.StartDeviceAuthorizationCommand({
      clientId: oidcClient.clientId,
      clientSecret: oidcClient.clientSecret,
      startUrl: ssoSession.sso_start_url!,
    }),
  )

  const deadline = new Date().getTime() + 1000 * response.expiresIn!

  const tokenGetter = (
    resolve: {
      (response: ssoOidc.CreateTokenCommandOutput): void
    },
    reject: { (value: unknown): void },
  ): void => {
    ssoOidcClient
      .send(
        new ssoOidc.CreateTokenCommand({
          clientId: oidcClient.clientId,
          clientSecret: oidcClient.clientSecret,
          grantType: DEVICE_GRANT,
          deviceCode: response.deviceCode!,
        }),
      )
      .then(resolve)
      .catch((e) => {
        if (new Date().getTime() > deadline) {
          reject(e)
        } else if (e instanceof ssoOidc.AuthorizationPendingException) {
          setTimeout(() => {
            tokenGetter(resolve, reject)
          }, response.interval! * 1000)
        } else {
          reject(e)
        }
      })
  }

  shell.openExternal(`${response.verificationUriComplete}`)

  const tokenResponse: ssoOidc.CreateTokenCommandOutput = await new Promise(
    tokenGetter,
  )
  ssoToken = {
    accessToken: tokenResponse.accessToken!,
    expiresAt: new Date().getTime() + tokenResponse.expiresIn! * 1000,
  }

  settings.set(["ssoTokens", profileName], ssoToken)
  return ssoToken
}

export async function getSsoConfig({
  profileName,
  configPath = path.join(os.homedir(), ".aws"),
  receiver,
}: GetSsoConfigArgs): Promise<void> {
  const configFile = await getConfig({ configPath })
  const ssoSession = configFile.ssoSessions?.[profileName]
  if (ssoSession === undefined) {
    return
  }
  let accessToken: models.SsoToken
  try {
    accessToken = await getAccessToken({
      profileName,
      ssoSession,
    })
  } catch (e) {
    console.log(e)
    return
  }

  const ssoClient = new sso.SSOClient({
    region: ssoSession.sso_region,
    maxAttempts: 10,
  })

  const listAccountsPaginator = sso.paginateListAccounts(
    { client: ssoClient, pageSize: 100 },
    { accessToken: accessToken.accessToken },
  )
  // TODO this needs to stream back rather than this long pause to collect..
  for await (const page of listAccountsPaginator) {
    for (const account of page.accountList!) {
      console.log(`${account.accountName}`)
      const listAccountRolesPaginator = sso.paginateListAccountRoles(
        { client: ssoClient, pageSize: 100 },
        {
          accessToken: accessToken.accessToken,
          accountId: account.accountId,
        },
      )
      for await (const page of listAccountRolesPaginator) {
        receiver(
          page.roleList?.map((role) => ({
            roleName: role.roleName!,
            accountId: role.accountId!,
            accountName: account.accountName!,
          })),
        )
      }
    }
  }
  receiver([])
}
