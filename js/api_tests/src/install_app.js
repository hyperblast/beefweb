#!/usr/bin/env node

import fsObj from 'fs'
import util from 'util';
import path from 'path';
import os from 'os';
import stream from 'stream';
import crypto from 'crypto';
import mkdirp from 'mkdirp';
import { execFile, rimraf, rootDir } from './utils.js';
import { getAppDefs } from './app_defs.js';

const fs = fsObj.promises;
const streamPipeline = util.promisify(stream.pipeline);

const isWindows = os.type() === 'Windows_NT';
const exeSuffix = isWindows ? '.exe' : '';
const tarFileMatcher = /\.tar(\.(gz|bz2|xz))?$/;

function getFileNameFromUrl(url)
{
    const index = url.lastIndexOf('/');
    if (index < 0 || index === url.length - 1)
        throw new Error('Invalid url: ' + url);
    return url.substring(index + 1);
}

async function computeHash(filePath)
{
    const hash = crypto.createHash('sha256');
    const input = fsObj.createReadStream(filePath);
    await streamPipeline(input, hash);
    return hash.digest('hex');
}

async function downloadFile(app, def)
{
    const { version, url, sha256 } = def;
    const fileName = getFileNameFromUrl(url);
    const outputDir = path.join(rootDir, 'apps', app, version || '');
    const outputFile = path.join(outputDir, fileName);

    await rimraf(outputDir);
    await mkdirp(outputDir);

    console.error('Downloading ' + url);

    const { error } = await execFile(
        `curl${exeSuffix}`,
        ['--silent', '--fail', '--show-error', '--location', '-o', outputFile, url]);

    if (error)
        throw new Error(`Failed to download URL`);

    const hash = await computeHash(outputFile);
    if (hash !== sha256)
        throw new Error(`Hash mismatch for ${fileName}, expected: ${sha256}, actual: ${hash}`);

    return outputFile;
}

async function unpackZip(workDir, fileName)
{
    const options = { cwd: workDir };
    const { error } = isWindows
        ? await execFile('7z.exe', ['x', fileName], options)
        : await execFile('unzip', [fileName], options);

    if (error)
        throw new Error(`Failed to unpack file`);
}

async function unpackTar(workDir, fileName)
{
    if (isWindows)
        throw new Error('Unpacking tar files is not supported on Windows');

    const { error } = await execFile('tar', ['xf', fileName, '--strip-components=1'], { cwd: workDir });

    if (error)
        throw new Error(`Failed to unpack file`);
}

async function unpackFile(filePath)
{
    const workDir = path.dirname(filePath);
    const fileName = path.basename(filePath);

    console.error('Unpacking ' + filePath.substring(rootDir.length + 1));

    if (fileName.endsWith('.zip'))
        await unpackZip(workDir, fileName);
    else if (tarFileMatcher.test(fileName))
        await unpackTar(workDir, fileName);
    else
        throw new Error('Unsupported archive type: ' + fileName);

    await fs.unlink(filePath);
}

async function downloadAndUnpack(app, def)
{
    const outputFile = await downloadFile(app, def);
    await unpackFile(outputFile);
}

function printUsage(appDefs)
{
    console.error('Usage:');
    console.error('  install_app <app>                 install latest app version');
    console.error('  install_app <app> <version>       install specific app version');
    console.error('  install_app <app> all             install all available app version');
    console.error('  install_app <app> list-versions   print available app versions');
    console.error('  install_app everything            install all versions of all apps');
    console.error();
    console.error('Available apps:');

    for (let app in appDefs)
    {
        const versions = appDefs[app].map(d => d.version || 'no-version').join(' ');
        console.error(`  ${app}: ${versions}`);
    }
}

async function run(appDefs, app, version)
{
    if (!(app in appDefs))
        throw new Error(`Unknown app name ${app}`);

    const defs = appDefs[app];

    if (!version)
    {
        const def = defs[defs.length - 1];
        await downloadAndUnpack(app, def);
        return;
    }

    if (version === 'list-versions')
    {
        for (let def of defs)
            console.log(def.version || 'no-version');

        return;
    }

    if (version === 'all')
    {
        for (let def of defs)
            await downloadAndUnpack(app, def);

        return;
    }

    const def = defs.find(d => d.version === version);
    if (!def)
        throw new Error(`Unknown app version: ${version}`);

    await downloadAndUnpack(app, def);
}

async function main()
{
    try
    {
        const appDefs = await getAppDefs();
        const appName = process.argv[2];
        const appVersion = process.argv[3];

        if (appName === 'everything')
        {
            for (let app in appDefs)
                await run(appDefs, app, 'all');

            return;
        }

        if (process.argv.length === 3 || process.argv.length === 4)
        {
            await run(appDefs, appName, appVersion);
            return;
        }

        printUsage(appDefs);
        process.exit(process.argv.length === 2 ? 0 : 1);
    }
    catch (e)
    {
        console.error(e.message);
        process.exit(1);
    }
}

main();
