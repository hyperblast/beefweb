export function skipUndefined(params)
{
    const result = {};

    for (let key in params)
    {
        if (!params.hasOwnProperty(key))
            continue;

        const value = params[key];

        if (typeof value !== 'undefined')
            result[key] = value;
    }

    return result;
}

export function formatRange(range)
{
    return `${range.offset}:${range.count}`;
}

export function parseRange(arg)
{
    switch (typeof arg)
    {
        case 'number':
            return { offset: arg, count: 1000 };

        case 'string':
        {
            const [ offset = 0, count = 1000 ] = arg.split(':', 2).map(v => parseInt(v));
            return { offset, count };
        }

        case 'object':
        {
            const { offset = 0, count = 1000 } = arg;
            return { offset, count };
        }

        default:
            return { offset: 0, count: 1000 };
    }
}

export function formatQueryOptions(arg)
{
    if (arg.playlistItems)
    {
        const plrange = formatRange(parseRange(arg.plrange));
        return Object.assign({}, arg, { plrange });
    }
    else
        return arg;
}

export function isTransferBetweenPlaylists(options)
{
    const { playlist, from, to } = options;

    const hasPlaylist = typeof playlist !== 'undefined';
    const hasFromTo = typeof from !== 'undefined' && typeof to !== 'undefined';

    if (hasPlaylist === hasFromTo)
        throw Error("Either 'playlist' or 'from' and 'to' options are required");

    return hasFromTo;
}
