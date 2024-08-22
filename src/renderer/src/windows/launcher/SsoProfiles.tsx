import "@coreui/coreui/dist/css/coreui.min.css"
import "../../assets/main.css"
import {
  dispatcher,
  initialState,
  setSsoProfiles as _setSsoProfiles,
} from "@renderer/rendererState"
import ProfileAccordion from "./ProfileAccordion"
import { useEffect, useReducer } from "react"
const { api } = window
import * as models from "models"

interface SsoProfilesProps {
  profileName: string
}

function SsoProfiles({
  profileName: tabProfileName,
}: SsoProfilesProps): JSX.Element {
  const [{ ssoProfiles }, dispatch] = useReducer(
    dispatcher,
    undefined,
    initialState,
  )
  const setSsoProfiles = _setSsoProfiles(dispatch, tabProfileName)

  useEffect(
    () =>
      api.registerSsoProfileListener(
        (ssoRoleList: Record<string, Array<unknown>>) => {
          Object.entries(ssoRoleList).forEach(([profileName, profile]) => {
            if (profileName === tabProfileName) {
              setSsoProfiles(profile)
            }
          })
        },
      ),
    [],
  )

  useEffect(() => {
    console.log(ssoProfiles)
    if (ssoProfiles) {
      return undefined
    }
    const timeoutNumber = setTimeout(() => {
      // this janky shit makes it so  we don't actually fire the damn event
      // before react has finished piss-farting around calling things twice
      api.getSsoConfig(tabProfileName)
    }, 1000)
    return (): void => {
      clearTimeout(timeoutNumber)
    }
  }, [ssoProfiles])

  return (
    <>
      {(!ssoProfiles ||
        ssoProfiles[tabProfileName] === undefined ||
        ssoProfiles[tabProfileName].fetching === true) && (
        <>Fetching roles for SSO Profile {tabProfileName}</>
      )}
      {ssoProfiles &&
        ssoProfiles[tabProfileName] !== undefined &&
        ssoProfiles[tabProfileName].profiles && (
          <>
            {[...ssoProfiles[tabProfileName].profiles].map(
              (role: models.SsoProfile, index: number) => (
                <ProfileAccordion
                  key={index}
                  profileName={`${role.accountName}-${role.roleName}`}
                  profile={{
                    entryType: "sso-session",
                    order: index,
                    source_profile: tabProfileName,
                    sso_account_id: role.accountId,
                    sso_role_name: role.roleName,
                  }}
                  launchAction={() => {
                    api.launchSsoConsole(
                      tabProfileName,
                      role.accountId,
                      role.roleName,
                    )
                    dispatch({ type: "launch-console" })
                  }}
                />
              ),
            )}
          </>
        )}
    </>
  )
}

export default SsoProfiles
