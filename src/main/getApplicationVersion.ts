import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { HasVersion } from './types';

export function getApplicationVersion(): string {
    const readFileOptions = {
        encoding: 'utf-8' as const, flag: 'r' as const,
    };
    const packageJsonFile = fs.readFileSync(path.join(app.getAppPath(), 'package.json'), readFileOptions);
    const packageJson = JSON.parse(packageJsonFile) as HasVersion;
    return packageJson.version;
}
