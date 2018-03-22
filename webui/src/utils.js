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

export function getParentDir(path, sep)
{
    var index = path.lastIndexOf(sep);

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

export function looseDeepEqual(value1, value2)
{
    if (value1 === value2)
        return true;

    const isArray = Array.isArray(value1);

    if (isArray !== Array.isArray(value2))
        return false;

    if (isArray)
    {
        if (value1.length !== value2.length)
            return false;

        for (let i = 0; i < value1.length; i++)
        {
            if (!looseDeepEqual(value1[i], value2[i]))
                return false;
        }

        return true;
    }

    if (!(value1 instanceof Object) || !(value2 instanceof Object))
        return false;

    // Skip check for added/removed properties.
    // Objects returned by API always have the same structure.

    for (let key in value1)
    {
        if (!looseDeepEqual(value1[key], value2[key]))
            return false;
    }

    return true;
}
