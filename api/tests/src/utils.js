'use strict';

function sleep(timeout)
{
    return new Promise(resolve => setTimeout(resolve, timeout));
}

async function waitUntil(check, delay = 200, retry = 10)
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

function waitForExit(process, timeout = -1)
{
    return new Promise(resolve =>
    {
        if (timeout >= 0)
            setTimeout(() => resolve(false), timeout);

        process.on('exit', () => resolve(true));
    });
}

module.exports = { sleep, waitUntil, waitForExit };
