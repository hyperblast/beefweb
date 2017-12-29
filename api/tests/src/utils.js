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

module.exports = { sleep, waitUntil };
