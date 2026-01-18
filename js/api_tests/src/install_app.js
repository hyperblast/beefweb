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
import picomatch from 'picomatch';

const fs = fsObj.promises;
const streamPipeline = util.promisify(stream.pipeline);

const isWindows = os.type() === 'Windows_NT';
const exeSuffix = isWindows ? '.exe' : '';
const tarFileMatcher = /\.tar(\.(gz|bz2|xz))?$/;

async function runApp(command, args, options)
{
    const { error } = await execFile(command, args, options);

    if (error)
        throw new Error(`Command "${command} ${args.join(' ')}" failed with exit code ${error.code}`);
}

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

    await runApp(
        `curl${exeSuffix}`,
        ['--silent', '--fail', '--show-error', '--location', '-o', outputFile, url]);

    const hash = await computeHash(outputFile);
    if (hash !== sha256)
        throw new Error(`Hash mismatch for ${fileName}, expected: ${sha256}, actual: ${hash}`);

    return outputFile;
}

async function unpackZip(workDir, fileName)
{
    const options = { cwd: workDir };

    if (isWindows)
        await runApp('7z.exe', ['x', fileName], options);
    else
        await runApp('unzip', [fileName], options);
}

async function unpackTar(workDir, fileName)
{
    if (isWindows)
        throw new Error('Unpacking tar files is not supported on Windows');

    await runApp('tar', ['xf', fileName, '--strip-components=1'], { cwd: workDir });
}

async function installFoobar2000(workDir, fileName)
{
    if (!isWindows)
        throw new Error('Running exe installer is supported only on Windows');

    await fs.writeFile(path.join(workDir, 'portable_mode_enabled'), '');
    await runApp(path.join(workDir, fileName), ['/S', '/D=' + workDir]);
}

async function unpackFile(app, filePath)
{
    const workDir = path.dirname(filePath);
    const fileName = path.basename(filePath);

    console.error('Unpacking ' + filePath.substring(rootDir.length + 1));

    if (fileName.endsWith('.zip'))
        await unpackZip(workDir, fileName);
    else if (tarFileMatcher.test(fileName))
        await unpackTar(workDir, fileName);
    else if (app === 'foobar2000' && fileName.endsWith('.exe'))
        await installFoobar2000(workDir, fileName);
    else
        throw new Error('Unsupported archive type: ' + fileName);

    await fs.unlink(filePath);
}

async function downloadAndUnpack(app, def)
{
    console.log(`Installing ${app} ${def.version || ''}`);
    const outputFile = await downloadFile(app, def);
    await unpackFile(app, outputFile);
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
        const versions = appDefs[app].map(d => d.version || 'no-version').join(' ');
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
        console.log(def.version || 'no-version');
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
