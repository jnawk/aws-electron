import * as path from 'path';
import * as sprintf from 'sprintf-js';
import { AppPath } from './types';

export default function getWindowURL(appPath?: AppPath, profileName?: string): string {
    const pathVariables = {
        file: path.join(__dirname, './index.html'),
        appPath,
        profileName,
    };
    if (!appPath) {
        return sprintf.sprintf('file://%(file)s', pathVariables);
    }
    if (profileName) {
        return sprintf.sprintf('file://%(file)s#/%(appPath)s/%(profileName)s', pathVariables);
    }
    return sprintf.sprintf('file://%(file)s#/%(appPath)s', pathVariables);
}
