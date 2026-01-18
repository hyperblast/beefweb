import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toAbsolutePath(p)
{
    return path.isAbsolute(p) ? p : path.join(path.dirname(__dirname), p);
}

function getBuildDir(buildType)
{
    const binaryDir = process.env.BEEFWEB_BINARY_DIR;

    if (binaryDir)
        return toAbsolutePath(binaryDir);

    const binaryDirBase = process.env.BEEFWEB_BINARY_DIR_BASE || 'build';
    return path.join(toAbsolutePath(binaryDirBase), buildType);
}

function readBuildConfig(buildDir)
{
    try
    {
        const configFile = path.join(buildDir, 'build_config.json');
        return JSON.parse(fs.readFileSync(configFile, 'utf8'));
    }
    catch
    {
        console.error('Failed to load build confing, using platform defaults');
        return { isMultiConfig: os.type() === 'Windows_NT'};
    }
}

export function getBuildConfig(buildType)
{
    const buildDir = getBuildDir(buildType);
    const buildConfig = readBuildConfig(buildDir);
    buildConfig.buildDir = buildDir;
    return buildConfig;
}
