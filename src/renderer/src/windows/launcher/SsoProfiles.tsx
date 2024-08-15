import "@coreui/coreui/dist/css/coreui.min.css"
import "../../assets/main.css"
import {
  dispatcher,
  initialState,
  setSsoRoles as _setSsoRoles,
} from "@renderer/rendererState"
import ProfileAccordion from "./ProfileAccordion"
import { useEffect, useReducer } from "react"
const { api } = window
import { SsoProfile } from "models"

interface SsoProfilesProps {
  profileName: string
}

function SsoProfiles({ profileName }: SsoProfilesProps): JSX.Element {
  const [{ ssoRoles }, dispatch] = useReducer(
    dispatcher,
    undefined,
    initialState,
  )
  const setSsoRoles = _setSsoRoles(dispatch, profileName)

  useEffect(() => {
    if (ssoRoles) {
      return undefined
    }
    const timeoutNumber = setTimeout(() => {
      // this janky shit makes it so  we don't actually fire the damn event
      // before react has finished piss-farting around calling things twice
      api.getSsoConfig(profileName).then(setSsoRoles)
    }, 1000)
    return (): void => {
      clearTimeout(timeoutNumber)
    }
  }, [ssoRoles])

  if (!ssoRoles || ssoRoles[profileName] === undefined) {
    return <>Fetching roles for SSO Profile {profileName}</>
  }
  return (
    <>
      {ssoRoles[profileName].map((role: SsoProfile, index: number) => (
        <ProfileAccordion
          key={index}
          profileName={`${role.accountName}-${role.roleName}`}
          profile={{
            entryType: "sso-session",
            order: index,
            source_profile: profileName,
            sso_account_id: role.accountId,
            sso_role_name: role.roleName,
          }}
          launchAction={() => {
            api.launchSsoConsole(profileName, role.accountId, role.roleName)
            dispatch({ type: "launch-console" })
          }}
        />
      ))}
    </>
  )
}

export default SsoProfiles
