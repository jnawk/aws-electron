import { ElectronAPI } from "@electron-toolkit/preload"

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      registerConfigChangeListener: {
        (callback: { (payload: unknown): void }): { (): void }
      }
      registerSsoProfileListener: {
        (callback: { (payload: Record<string, Array<unknown>>): void }): {
          (): void
        }
      }
      registerProfileNameListener: {
        (callback: { (profileName: string): void }): { (): void }
      }
      registerTabsListener: {
        (callback: { (titles: string[], activeTab: number): void }): {
          (): void
        }
      }
      activateTab: { (profileName: string, index: number): void }
      closeTab: { (profileName: string, index: number): void }
      getConfig: { (): Promise<unknown> }
      setTop: { (profileName: string, top: number): void }
      launchConsole: { (profileName: string, mfaCode: string): void }
      launchSsoConsole: {
        (profileName: string, accountId: string, roleName: string): void
      }
      getVersion: { (): Promise<string> }
      getActiveProfileTab: { (): Promise<number> }
      setActiveProfileTab: { (activeProfileTab: number): void }
      getSsoConfig: {
        (profileName: string): Promise<Array<unknown>>
      }
    }
  }
}
