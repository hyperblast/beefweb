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

function arraysEqual(arr1, arr2)
{
    if (arr1.length !== arr2.length)
        return false;

    for (let i = 0; i < arr1.length; i++)
    {
        if (arr1[i] !== arr2[i])
            return false;
    }

    return true;
}

module.exports = { sleep, waitUntil, arraysEqual };
