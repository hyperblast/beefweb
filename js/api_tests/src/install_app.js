#!/usr/bin/env node

import fsObj from 'fs'
import util from 'util';
import path from 'path';
import stream from 'stream';
import crypto from 'crypto';
import mkdirp from 'mkdirp';
import {
    appsDir,
    checkedExecFile,
    execFile,
    replaceDirectory,
    rimraf,
    tryStat,
    isWindows,
    isMacOs,
    exeExt,
} from './utils.js';
import { getAppDefs } from './app_defs.js';
import picomatch from 'picomatch';

const fs = fsObj.promises;
const streamPipeline = util.promisify(stream.pipeline);

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

function hashMismatchMessage(fileName, expected, actual)
{
    return `Hash mismatch for ${fileName}, expected: ${expected}, actual: ${actual}`;
}

async function downloadFile(app, def)
{
    const { version, url, sha256 } = def;
    const fileName = getFileNameFromUrl(url);
    const downloadDir = path.join(appsDir, '.cache', app, version);
    const outputFile = path.join(downloadDir, fileName);

    await mkdirp(downloadDir);

    const stat = await tryStat(outputFile);
    if (stat)
    {
        if (!stat.isFile())
            throw new Error(`File ${outputFile} exists and is not a file, aborting`);

        const cachedHash = await computeHash(outputFile);
        if (cachedHash === sha256)
        {
            console.error(`Using cached file ${fileName}`);
            return outputFile;
        }

        console.error(hashMismatchMessage(fileName, sha256, cachedHash) + ', removing cached file');
        await fs.unlink(outputFile);
    }

    console.error('Downloading ' + url);

    await checkedExecFile(
        `curl${exeExt}`,
        ['--silent', '--fail', '--show-error', '--location', '-o', outputFile, url]);

    const downloadedHash = await computeHash(outputFile);
    if (downloadedHash !== sha256)
        throw new Error(hashMismatchMessage(fileName, sha256, downloadedHash));

    return outputFile;
}

async function unpackZip(pkgFilePath, outputDir)
{
    const options = { cwd: outputDir };

    if (isWindows)
        await checkedExecFile('7z.exe', ['x', pkgFilePath], options);
    else
        await checkedExecFile('unzip', [pkgFilePath], options);
}

async function unpackTar(pkgFilePath, outputDir)
{
    if (isWindows)
        throw new Error('Unpacking tar files is not supported on Windows');

    await checkedExecFile('tar', ['xf', pkgFilePath, '--strip-components=1'], { cwd: outputDir });
}

async function installFoobar2000(pkgFilePath, outputDir)
{
    if (!isWindows)
        throw new Error('Running .exe installer is supported only on Windows');

    await fs.writeFile(path.join(outputDir, 'portable_mode_enabled'), '');
    await checkedExecFile(pkgFilePath, ['/S', '/D=' + outputDir]);
}

async function unpackDmg(pkgFilePath, outputDir)
{
    if (!isMacOs)
        throw new Error('Installing from .dmg is supported only on macOS');

    const volumesRoot = '/Volumes';
    const existingVolumes = new Set(await fs.readdir(volumesRoot));
    await checkedExecFile('hdiutil', ['attach', pkgFilePath]);
    const newVolumes = (await fs.readdir(volumesRoot)).filter(v => !existingVolumes.has(v));

    if (newVolumes.length === 0)
        throw new Error('No volumes were mounted');

    for (let vol of newVolumes)
        console.error(`Mounted "${vol}"`);

    if (newVolumes.length > 1)
        console.error(`Multiple volumes were mounted, using "${newVolumes[0]}"`);

    const volumePath = path.join(volumesRoot, newVolumes[0]);

    try
    {
        const entries = (await fs.readdir(volumePath)).filter(e => e.endsWith('.app'));
        if (entries.length !== 1)
            throw new Error(`Expected single .app entry, got: ` + entries.join(' '));

        const appBundle = entries[0];

        await replaceDirectory(
            path.join(volumePath, appBundle),
            path.join(outputDir, appBundle));
    }
    finally
    {
        for (let vol of newVolumes)
        {
            console.error(`Unmounting "${vol}"`);
            await execFile('hdiutil', ['detach', path.join(volumesRoot, vol)]);
        }
    }
}

async function unpackFile(app, def, pkgFilePath)
{
    const pkgFileName =  path.basename(pkgFilePath);
    const outputDir = path.join(appsDir, app, def.noVersionInPath ? '' : def.version);

    console.error('Unpacking ' + pkgFileName);

    await rimraf(outputDir);
    await mkdirp(outputDir);

    if (pkgFilePath.endsWith('.zip'))
        await unpackZip(pkgFilePath, outputDir);
    else if (tarFileMatcher.test(pkgFilePath))
        await unpackTar(pkgFilePath, outputDir);
    else if (pkgFilePath.endsWith('.dmg'))
        await unpackDmg(pkgFilePath, outputDir);
    else if (app === 'foobar2000' && pkgFilePath.endsWith('.exe'))
        await installFoobar2000(pkgFilePath, outputDir);
    else
        throw new Error('Unsupported package type: ' + pkgFileName);
}

async function downloadAndUnpack(app, def)
{
    console.error(`Installing ${app} ${def.version}`);
    const pkgFilePath = await downloadFile(app, def);
    await unpackFile(app, def, pkgFilePath);
}

function printUsage(appDefs)
{
    console.error('Usage:');
    console.error('  install_app <app>                          install latest app version');
    console.error('  install_app <app> <pattern>                install app versions matching <pattern>');
    console.error('  install_app <app> all                      install all available app versions');
    console.error('  install_app list-versions <app>            print all available app versions');
    console.error('  install_app list-versions <app> <pattern>  print app versions matching <pattern>');
    console.error('  install_app everything                     install all versions of all apps');
    console.error();
    console.error('Available apps:');

    for (let app in appDefs)
    {
        const versions = appDefs[app].map(d => d.version).join(' ');
        console.error(`  ${app}: ${versions}`);
    }
}

function getMatchingVersions(defs, condition)
{
    if (!condition)
        return [defs[defs.length - 1]];

    if (condition === 'all')
        return defs;

    const matcher = condition.includes('?') || condition.includes('*')
        ? picomatch(condition)
        : v => v === condition;

    const matchingDefs = defs.filter(d => matcher(d.version));
    if (matchingDefs.length === 0)
        throw new Error(`Unknown no versions match pattern "${condition}"`);

    return matchingDefs;
}

async function listVersions(appDefs, app, version)
{
    if (!(app in appDefs))
        throw new Error(`Unknown app name "${app}"`);

    for (let def of getMatchingVersions(appDefs[app], version))
        console.log(def.version);
}

async function install(appDefs, app, version)
{
    if (!(app in appDefs))
        throw new Error(`Unknown app name "${app}"`);

    for (let def of getMatchingVersions(appDefs[app], version))
        await downloadAndUnpack(app, def);
}

async function installEverything(appDefs)
{
    for (let app in appDefs)
    {
        for (let def of appDefs[app])
            await downloadAndUnpack(app, def);
    }
}

async function main()
{
    try
    {
        const appDefs = await getAppDefs();
        const args = process.argv.slice(2);

        if (args[0] === 'everything')
        {
            if (args.length === 1)
            {
                await installEverything(appDefs);
                return 0;
            }
            else
            {
                printUsage(appDefs);
                return 1;
            }
        }

        if (args[0] === 'list-versions')
        {
            if (args.length >= 2 && args.length <= 3)
            {
                await listVersions(appDefs, args[1], args[2] || 'all');
                return 0;
            }
            else
            {
                printUsage(appDefs)
                return 1;
            }
        }

        if (args.length >= 1 && args.length <= 2)
        {
            await install(appDefs, args[0], args[1]);
            return 0;
        }

        printUsage(appDefs);
        return args.length === 0 ? 0 : 1;
    }
    catch (e)
    {
        console.error(e.message);
        return 1;
    }
}

main().then(ret => process.exit(ret));
