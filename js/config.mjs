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

export function getBinaryDir(buildType)
{
    const binaryDir = process.env.BEEFWEB_BINARY_DIR;

    if (!binaryDir)
        return path.join(path.dirname(__dirname), 'build', buildType);

    return path.isAbsolute(binaryDir) ? binaryDir : path.join(path.dirname(__dirname), binaryDir);
}
