import startsWith from 'lodash/startsWith'
import isFunction from 'lodash/isFunction'

function formatTimePart(value)
{
    var str = '' + value;
    return str.length >= 2 ? str : '0' + str;
}

export function formatTime(value, withHours = false)
{
    var intValue = Math.round(value);
    var seconds = intValue % 60;
    var minutes = Math.floor(intValue / 60) % 60;
    var hours = Math.floor(intValue / (60 * 60)) % (60 * 60);

    var hoursStr = withHours || hours > 0 ? formatTimePart(hours) + ':' : '';
    return hoursStr + formatTimePart(minutes) + ':' + formatTimePart(seconds);
}

export function getParentDir(path)
{
    var index = path.lastIndexOf('/');

    if (index < 0)
        return '';

    return path.substr(0, index);
}

export function bindHandlers(obj)
{
    const proto = Object.getPrototypeOf(obj);

    for (let prop of Object.keys(proto))
    {
        if (!startsWith(prop, 'handle'))
            continue;

        const handler = proto[prop];

        if (!isFunction(handler))
            continue;

        obj[prop] = handler.bind(obj);
    }
}
