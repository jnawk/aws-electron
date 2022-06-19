// this can't be a default import
import * as settings from 'electron-settings';

import { TabTitleOptions, Preferences } from './types';

export default async function getPreferences() {
    const translateTitlePreference = (title: TabTitleOptions) => title.replaceAll('}', ')s').replaceAll('{', '%(');
    const preferences = (await settings.get('preferences')) as Preferences;
    if (preferences) {
        if (preferences.tabTitlePreferenceV2) {
            return preferences;
        }
        if (preferences.tabTitlePreference) {
            preferences.tabTitlePreferenceV2 = translateTitlePreference(preferences.tabTitlePreference);
        }
    }
    return preferences;
}
