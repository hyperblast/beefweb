import fsObj from 'fs';
import path from 'path';
import os from 'os';
import { isObject, testsRootDir } from './utils.js';

const fs = fsObj.promises;

const OsTypeMap = {
    'Windows_NT': 'windows',
    'Darwin': 'mac',
    'Linux': 'linux',
};

function validateAppDefs(osType, app, defs)
{
    if (!Array.isArray(defs))
        throw new Error(`Invalid property "${osType}.${app}", expected array`);

    if (defs.length === 0)
        throw new Error(`Array "${osType}.${app}" is empty`);

    let index = 0;

    for (let def of defs)
    {
        function checkProperty(name)
        {
            const value = def[name];

            if (typeof value !== 'string' || value === '')
                throw new Error(`Missing or invalid "${osType}.${app}[${index}].${name}" property, expected non-empty string`);
        }

        checkProperty('url');
        checkProperty('sha256');
        checkProperty('version');
        index++;
    }
}

export async function getAppDefs()
{
    const osType = OsTypeMap[os.type()];
    if (!osType)
        throw new Error('Unsupported OS: ' + os.type());

    const appJsonFile = path.join(testsRootDir, 'apps.json');
    const dataRaw = await fs.readFile(appJsonFile, 'utf8');
    const dataParsed = JSON.parse(dataRaw);

    if (!isObject(dataParsed))
        throw new Error('Invalid root value, expected object');

    const apps = dataParsed[osType];

    if (!isObject(apps))
        throw new Error(`Missing or invalid property "${osType}", expected object`);

    for (let app in apps)
        validateAppDefs(osType, app, apps[app]);

    return apps;
}

export async function getDefaultAppVersion(app)
{
    const appDefs = await getAppDefs();
    const defs = appDefs[app];

    if (defs === undefined)
        throw new Error(`Unknown or unavailable app "${app}"`);

    const { version } = defs[defs.length - 1];
    if (!version)
        throw new Error(`Default entry for "${app}" has no version`);

    return version;
}