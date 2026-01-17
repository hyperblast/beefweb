import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'

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

export function getBuildConfig(buildType)
{
    const buildDir = getBuildDir(buildType);
    const buildConfigFile = path.join(buildDir, 'build_config.json');
    const config = JSON.parse(fs.readFileSync(buildConfigFile, 'utf8'));

    return { buildDir, isMultiConfig: config.isMultiConfig || false };
}
