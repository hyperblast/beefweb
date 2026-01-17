import os from 'os';
import path from 'path';
import mkdirp from 'mkdirp';
import fsObj from 'fs';
import childProcess from 'child_process';
import { promisify } from 'util';

const fs = fsObj.promises;

export const execFile = promisify(childProcess.execFile);

export async function spawnProcess(parameters)
{
    const { command, env, cwd, args, logFile, onExit } = parameters;

    let realCommand;
    let realArgs;
    let logFileHandle = null;

    const options = { detached: true };

    if (os.type() === 'Darwin' && command.endsWith('.app'))
    {
        realCommand = 'open';
        realArgs = ['-W', command];

        if (logFile)
        {
            args.push('--stdout');
            args.push(logFile);
            args.push('--stderr');
            args.push(logFile);
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

export function callBySystem(thisObj, arg)
{
    return selectBySystem(arg).apply(thisObj);
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
        await fs.unlink(to);
        await fs.symlink(from, to);
    },
});

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
    windows: p => p.toUpperCase(),
    mac: p => p.toUpperCase(),
    posix: p => p
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

export const sharedLibraryExt = selectBySystem({
    windows: 'dll',
    mac: 'dylib',
    posix: 'so'
});
