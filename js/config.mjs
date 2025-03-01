import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readFirstLine(filePath)
{
    try
    {
        const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
        const match = data.match(/.+/);
        return match ? match[0] : null;
    }
    catch (err)
    {
        return null;
    }
}

function toAbsolutePath(p)
{
    return path.isAbsolute(p) ? p : path.join(path.dirname(__dirname), p);
}

export function getBinaryDir(buildType)
{
    const binaryDir = process.env.BEEFWEB_BINARY_DIR;

    if (binaryDir)
        return toAbsolutePath(binaryDir);

    const binaryDirBase = process.env.BEEFWEB_BINARY_DIR_BASE || 'build';

    return path.join(toAbsolutePath(binaryDirBase), buildType);
}
