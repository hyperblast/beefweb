import os from 'os';
import path from 'path';
import mkdirp from 'mkdirp';
import fsObj from 'fs';
import childProcess from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import rimrafWithCallback from 'rimraf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = fsObj.promises;

export const rimraf = promisify(rimrafWithCallback);
export const execFile = promisify(childProcess.execFile);

export const testsRootDir = path.dirname(__dirname);
export const rootDir = path.dirname(path.dirname(testsRootDir));
export const appsDir = path.join(rootDir, 'apps');
export const isMacOs = os.type() === 'Darwin';
export const isWindows = os.type() === 'Windows_NT';

export function isObject(value)
{
    return typeof value === 'object' && !Array.isArray(value);
}

export async function checkedExecFile(command, args, options)
{
    const { error } = await execFile(command, args, options);

    if (error)
        throw new Error(`Command "${command} ${args.join(' ')}" failed with exit code ${error.code}`);
}

export async function tryStat(path)
{
    try
    {
        return await fs.lstat(path);
    }
    catch (e)
    {
        if (e.code === 'ENOENT')
            return null;

        throw e;
    }
}

async function removeFile(path)
{
    try
    {
        await fs.unlink(path);
    }
    catch (e)
    {
        if (e.code === 'ENOENT')
            return;

        throw e;
    }
}

export async function prepareProfileDir(dirPath)
{
    const realDirPath = dirPath + '.real';
    const testDirPath = dirPath + '.test';

    await rimraf(testDirPath);
    await mkdirp(testDirPath);

    const stat = await tryStat(dirPath);

    if (!stat)
    {
        await mkdirp(realDirPath);
        await fs.symlink(path.basename(testDirPath), dirPath);
        return;
    }

    if (stat.isSymbolicLink())
    {
        await mkdirp(realDirPath);
        await fs.unlink(dirPath);
        await fs.symlink(path.basename(testDirPath), dirPath);
        return;
    }

    if (stat.isDirectory())
    {
        if (await tryStat(realDirPath))
            throw new Error(`Both "${dirPath}" and "${realDirPath}" exist, unable to continue`);

        console.error(`Making backup of "${dirPath}" -> "${path.basename(realDirPath)}"`);
        await fs.rename(dirPath, realDirPath);
        await fs.symlink(path.basename(testDirPath), dirPath);
        return;
    }

    throw new Error(`Unable to proceed "${dirPath}" is not directory or symlink"`);
}

export async function restoreProfileDir(dirPath)
{
    const realDirPath = dirPath + '.real';
    const dirStat = await tryStat(dirPath);
    const realDirStat = await tryStat(realDirPath);

    if (dirStat && dirStat.isSymbolicLink() &&
        realDirStat && realDirStat.isDirectory())
    {
        await fs.unlink(dirPath);
        await fs.symlink(path.basename(realDirPath), dirPath);
    }
}

export async function spawnProcess(parameters)
{
    const { command, env, cwd, args, logFile, onExit } = parameters;

    let realCommand;
    let realArgs;
    let logFileHandle = null;

    const options = { detached: true };

    if (isMacOs && command.endsWith('.app'))
    {
        realCommand = 'open';
        realArgs = [command, '--wait-apps', '--hide'];

        if (logFile)
        {
            realArgs.push('--stdout');
            realArgs.push(logFile);
            realArgs.push('--stderr');
            realArgs.push(logFile);

            await removeFile(logFile);
        }

        if (args && args.length > 0)
        {
            realArgs.push('--args');

            for (let arg of args)
                realArgs.push(arg);
        }
    }
    else
    {
        realCommand = command;
        realArgs = args || [];

        options.cwd = cwd;
        options.env = env;

        if (logFile)
        {
            logFileHandle = await fs.open(logFile, 'w');
            options.stdio = ['ignore', logFileHandle, logFileHandle];
        }
    }

    const process = childProcess.spawn(realCommand, realArgs, options);

    let exitCalled = false;

    process.on('error', err => {
        console.error('Error spawning player process: %s', err);

        if (!onExit || exitCalled)
            return;

        exitCalled = true;
        onExit();
    });

    process.on('exit', () => {
        if (!onExit || exitCalled)
            return;

        exitCalled = true;
        onExit();
    });

    if (logFileHandle)
    {
        await logFileHandle.close();
    }

    process.unref();
    return process;
}

export function selectBySystem(args)
{
    switch (os.type())
    {
    case 'Windows_NT':
        if (args.windows !== undefined)
            return args.windows;

        break;

    case 'Darwin':
        if (args.mac !== undefined)
            return args.mac;

        if (args.posix !== undefined)
            return args.posix;

        break

    default:
        if (args.posix !== undefined)
            return args.posix;

        break;
    }

    throw new Error(`No configuration provided for ${os.type()} system`);
}

export function callBySystem(arg0, arg1)
{
    return arg1 === undefined
       ? selectBySystem(arg0).apply(undefined)
       : selectBySystem(arg1).apply(arg0);
}

export async function writePluginSettings(profileDir, settings)
{
    const pluginConfigDir = path.join(profileDir, 'beefweb');

    await mkdirp(path.join(pluginConfigDir, 'clientconfig'));

    await fs.writeFile(
        path.join(pluginConfigDir, 'config.json'),
        JSON.stringify(settings));
}

const fastCopyFile = selectBySystem({
    windows: fs.copyFile,
    async posix(from, to)
    {
        await removeFile(to);
        await fs.symlink(from, to);
    },
});

export async function replaceDirectory(source, target)
{
    await rimraf(target);

    // old Node.js can't copy directories recursively
    await callBySystem({
        async windows()
        {
            // Directory must exist, otherwise xcopy will ask stupid questions
            await mkdirp(target);
            await checkedExecFile('xcopy.exe', ['/S', source, target]);
        },

        async posix()
        {
            // Directory must not exist, otherwise cp will copy directory inside instead of copying contents
            await checkedExecFile('cp', ['-R', source, target]);
        },
    });
}

export async function installFile(fromDir, toDir, fileName)
{
    await mkdirp(toDir);
    await fastCopyFile(
        path.join(fromDir, fileName),
        path.join(toDir, fileName));
}

export async function installFiles(fromDir, toDir, fileNames)
{
    await mkdirp(toDir);

    for (let fileName of fileNames)
    {
        await fastCopyFile(
            path.join(fromDir, fileName),
            path.join(toDir, fileName));
    }
}

export function sleep(timeout)
{
    return new Promise(resolve => setTimeout(resolve, timeout));
}

export async function waitUntil(check, delay = 200, retry = 10)
{
    let ret;

    ret = await check();

    if (ret)
        return ret;

    for (let i = 1; i < retry; i++)
    {
        await sleep(delay);

        ret = await check();

        if (ret)
            return ret;
    }

    return null;
}

export function waitForExit(process, timeout = -1)
{
    return new Promise(resolve =>
    {
        if (timeout >= 0)
            setTimeout(() => resolve(false), timeout);

        process.on('error', () => resolve(true));
        process.on('exit', () => resolve(true));
    });
}

export const normalizePath = selectBySystem({
    posix: path => path,
    windows: path => path.toUpperCase(),
    mac(path)
    {
        if (path.startsWith('~/'))
            path = process.env.HOME + path.substring(1);
        path = path.toUpperCase();
        return path;
    },
});

export function pathsEqual(p1, p2)
{
    return normalizePath(p1) === normalizePath(p2);
}

export function pathCollectionsEqual(paths1, paths2, ignoreOrder = false)
{
    if (paths1.length !== paths2.length)
        return false;

    const items1 = paths1.map(normalizePath);
    const items2 = paths2.map(normalizePath);

    if (ignoreOrder)
    {
        items1.sort();
        items2.sort();
    }

    let i = 0;
    for (let item of items1)
    {
        if (item !== items2[i++])
            return false;
    }

    return true;
}

export const exeExt = selectBySystem({
    windows: '.exe',
    posix: ''
});

export const sharedLibraryExt = selectBySystem({
    windows: '.dll',
    mac: '.dylib',
    posix: '.so'
});
