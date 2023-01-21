import os from 'os';

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

        process.on('exit', () => resolve(true));
    });
}

function getNormalizePathFunction()
{
    switch (os.type())
    {
    case 'Windows_NT':
        return p => p.toUpperCase();
    default:
        return p => p;
    }
}

export const normalizePath = getNormalizePathFunction();

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