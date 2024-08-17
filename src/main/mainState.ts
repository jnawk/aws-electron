import { randomUUID } from "crypto"
import { WebContentsView, BrowserWindow } from "electron"
import * as models from "models"

interface LauncherWindowCreated {
  type: "launcher-window-created"
  payload: { window: Electron.BrowserWindow }
}

interface LauncherWindowClosed {
  type: "launcher-window-closed"
}

interface PreferencesWindowCreated {
  type: "preferences-window-created"
  payload: { window: Electron.BrowserWindow }
}

interface PreferencesWindowClosed {
  type: "preferences-window-closed"
}

interface OpenWindow {
  type: "open-window"
  payload: {
    profileName: string
    window: BrowserWindow
  }
}

interface CloseWindow {
  type: "close-window"
  payload: string
}

interface AddTab {
  type: "add-tab"
  payload: {
    profileName: string
    // url: string
    tab: WebContentsView
  }
}

interface SetTop {
  type: "set-top"
  payload: {
    profileName: string
    top: number
  }
}

interface ActivateTab {
  type: "activate-tab"
  payload: {
    profileName: string
    index: number
  }
}
interface CloseTab {
  type: "close-tab"
  payload: {
    profileName: string
    index: number
    activeTab: number
  }
}

interface AddSsoProfiles {
  type: "add-sso-profiles"
  payload: {
    profileName: string
    profiles: Array<models.SsoProfile>
  }
}

export type MainEvent =
  | LauncherWindowCreated
  | LauncherWindowClosed
  | PreferencesWindowCreated
  | PreferencesWindowClosed
  | OpenWindow
  | CloseWindow
  | AddTab
  | SetTop
  | ActivateTab
  | CloseTab
  | AddSsoProfiles

interface WindowDetails {
  // TODO how much of this is fluff?
  window: BrowserWindow
  tabs: WebContentsView[]
  activeTab: number
  top: number
  // boundsChangedHandlerBound?: boolean
  // zoomHandlerBound?: boolean
  // expiryTime: number
  // titleUpdateTimer?: NodeJS.Timeout
}

export interface MainState {
  mainWindow?: Electron.BrowserWindow
  preferencesWindow?: Electron.BrowserWindow
  windows: Record<string, WindowDetails>
  ssoProfiles?: Record<string, Array<models.SsoProfile>>
}

export function reducer(state: MainState, event: MainEvent): MainState {
  switch (event.type) {
    case "launcher-window-created":
      return { ...state, mainWindow: event.payload.window }

    case "launcher-window-closed":
      return { ...state, mainWindow: undefined }

    case "preferences-window-created":
      return { ...state, preferencesWindow: event.payload.window }

    case "preferences-window-closed":
      return { ...state, preferencesWindow: undefined }

    case "open-window": {
      const { windows } = state
      const { profileName, window } = event.payload
      const computedTop = parseInt(
        (42 * window.webContents.zoomFactor).toFixed(0),
      )
      const windowDetails: WindowDetails = {
        window,
        tabs: [],
        top: computedTop,
        activeTab: 0,
      }
      return {
        ...state,
        windows: {
          ...windows,
          [profileName]: windowDetails,
        },
      }
    }

    case "close-window": {
      const { windows } = state
      return {
        ...state,
        windows: Object.entries(windows)
          .filter(([profileName]) => profileName !== event.payload)
          .reduce(
            (
              accumulator: Record<string, WindowDetails>,
              [profileName, details],
            ) => ({
              ...accumulator,
              [profileName]: details,
            }),
            {},
          ),
      }
    }

    case "add-tab": {
      const { windows } = state
      const { profileName, tab } = event.payload
      const windowDetails = windows[profileName]
      const { tabs } = windowDetails

      return {
        ...state,
        windows: {
          ...windows,
          [profileName]: {
            ...windowDetails,
            tabs: [...tabs, tab],
            activeTab: tabs.length,
          },
        },
      }
    }

    case "set-top": {
      const { windows } = state
      const { profileName, top } = event.payload
      const windowDetails = windows[profileName]
      return {
        ...state,
        windows: {
          ...windows,
          [profileName]: {
            ...windowDetails,
            top,
          },
        },
      }
    }

    case "activate-tab": {
      const { windows } = state
      const { profileName, index } = event.payload

      return {
        ...state,
        windows: Object.entries(windows).reduce(
          (windows: Record<string, WindowDetails>, [name, details]) => {
            if (profileName === name) {
              return {
                ...windows,
                [profileName]: { ...details, activeTab: index },
              }
            }
            return { ...windows, [profileName]: details }
          },
          {},
        ),
      }
    }

    case "close-tab": {
      const { windows } = state
      const { profileName, index, activeTab } = event.payload

      return {
        ...state,
        windows: Object.entries(windows).reduce(
          (windows: Record<string, WindowDetails>, [name, details]) => {
            if (profileName === name) {
              const { tabs } = details
              return {
                ...windows,
                [profileName]: {
                  ...details,
                  activeTab,
                  tabs: tabs.filter((_, tabIndex) => tabIndex !== index),
                },
              }
            }
            return { ...windows, [profileName]: details }
          },
          {},
        ),
      }
    }

    case "add-sso-profiles":
      return {
        ...state,
        ssoProfiles: {
          ...state.ssoProfiles,
          [event.payload.profileName]: [
            ...new Set(
              [
                ...((state.ssoProfiles || {})[event.payload.profileName] || []),
                ...event.payload.profiles,
              ]
                .map((x) =>
                  JSON.stringify(x, ["accountName", "accountId", "roleName"]),
                )
                .sort(),
            ),
          ].map((x) => models.SsoProfileSchema.parse(JSON.parse(x))),
        },
      }
  }
}

export function initialState(): MainState {
  return {
    windows: {},
  }
}

// framework from here down

// the states we are tracking, held generically
const states: Record<string, unknown> = {}

/**
 * @template S Type of the state
 * @template E Type of the events
 * @param initialState the initial state
 * @param reducer the dispatch function
 * @returns initial state & dispatcher
 */
export function createReducer<E, S>(
  reducer: {
    (state: S, event: E): S
  },
  initialState: S | { (): S },
): [S, { (event: E): void }] {
  // generate a random UUID we will close over
  const uuid = randomUUID()

  if (typeof initialState === "function") {
    states[uuid] = (initialState as { (): S })()
  } else {
    states[uuid] = initialState
  }

  function dispatch(event: E): void {
    // cast our state to a generic record,
    // now we can mess with the properties dynamically
    const state = states[uuid] as unknown as Record<string, unknown>

    // update the state, casting the result as a generic record
    // now we can figure out what properties disappeared
    // TODO is this really necessary? can I just require the dispatcher function set things to delete to unknown
    const newState = reducer(state as S, event) as unknown as Record<
      string,
      unknown
    >
    const newStaKeys = Object.keys(newState)
    Object.keys(state)
      .filter((key) => !newStaKeys.includes(key))
      .forEach((key) => {
        delete state[key]
      })

    // we're modifying the state in place -
    // this isn't running in something like react
    // where a change will cause a rerender.
    Object.entries(newState).forEach(([key, value]) => {
      state[key] = value
    })
  }

  return [states[uuid] as S, dispatch]
}
