import { contextBridge, ipcRenderer } from "electron"

function registerListener(
  event: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: { (...args: any[]): void },
): { (): void } {
  ipcRenderer.on(event, handler)
  return () => ipcRenderer.off(event, handler)
}

const api = {
  registerConfigChangeListener: (callback: {
    (payload: unknown): void
  }): { (): void } =>
    registerListener("new-config", (_, payload): void => callback(payload)),

  registerSsoProfileListener: (callback: {
    (payload: Record<string, Array<unknown>>): void
  }): { (): void } =>
    registerListener("sso-profiles-updated", (_, payload): void =>
      callback(payload),
    ),

  registerProfileNameListener: (callback: {
    (profileName: string): void
  }): { (): void } =>
    registerListener("set-profile-name", (_, profileName: string): void =>
      callback(profileName),
    ),

  registerTabsListener: (callback: {
    (titles: string[], activeTab: number): void
  }): { (): void } =>
    registerListener(
      "set-tabs",
      (_, titles: string[], activeTab: number): void =>
        callback(titles, activeTab),
    ),

  activateTab: (profileName: string, index: number): void =>
    ipcRenderer.send("activateTab", profileName, index),

  closeTab: (profileName: string, index: number): void =>
    ipcRenderer.send("closeTab", profileName, index),

  setTop: (profileName: string, top: number): void =>
    ipcRenderer.send("setTop", profileName, top),

  getConfig: async (): Promise<unknown> => ipcRenderer.invoke("getConfig"),

  launchConsole: (profileName: string, mfaCode: string): void =>
    ipcRenderer.send("launchConsole", profileName, mfaCode),

  launchSsoConsole: (
    profileName: string,
    accountId: string,
    roleName: string,
  ): void =>
    ipcRenderer.send("launchSsoConsole", profileName, accountId, roleName),

  getVersion: async (): Promise<string> => ipcRenderer.invoke("getVersion"),

  getActiveProfileTab: async (): Promise<number> =>
    ipcRenderer.invoke("getActiveProfileTab"),

  setActiveProfileTab: (profileTab: number): void =>
    ipcRenderer.send("setActiveProfileTab", profileTab),

  getSsoConfig: async (profileName: string): Promise<Array<unknown>> =>
    ipcRenderer.invoke("getSsoConfig", profileName),
}

contextBridge.exposeInMainWorld("api", api)
