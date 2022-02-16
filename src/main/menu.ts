import { Menu, app } from 'electron';

import { ApplicationState } from './types';

const isMac = process.platform === 'darwin';

export default function buildAppMenu(state: ApplicationState): Menu {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: isMac ? app.name : 'AWS Console',
      submenu: [
        {
          label: 'Preferences',
          click: () => state.openPreferences(),
        },
        {
          label: 'Rotate Keys',
          click: () => state.openKeyRotation(),
        },
        {
          label: 'MFA Cache',
          click: () => state.openMfaCache(),
        },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
        ] : []) as Electron.MenuItemConstructorOptions[],
        { role: 'close' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' },
            ],
          },
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' },
        ]) as Electron.MenuItemConstructorOptions[],
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' },
        ] : [
          { role: 'close' },
        ]) as Electron.MenuItemConstructorOptions[],
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}
