import startsWith from 'lodash/startsWith'
import isFunction from 'lodash/isFunction'

function formatTimePart(value)
{
    const str = '' + value;
    return str.length >= 2 ? str : '0' + str;
}

export function formatTime(value, withHours = false)
{
    const intValue = Math.round(value);
    const seconds = intValue % 60;
    const minutes = Math.floor(intValue / 60) % 60;
    const hours = Math.floor(intValue / (60 * 60)) % (60 * 60);

    const hoursStr = withHours || hours > 0 ? formatTimePart(hours) + ':' : '';
    return hoursStr + formatTimePart(minutes) + ':' + formatTimePart(seconds);
}

export function getParentDir(path, sep)
{
    const index = path.lastIndexOf(sep);

    if (index < 0 || index === path.length - 1)
        return '';

    const result = path.substr(0, index);

    return result.indexOf(sep) >= 0
        ? result
        : result + sep;
}

export function getBaseName(path, sep)
{
    const index = path.lastIndexOf(sep);

    if (index < 0 || index === path.length - 1)
        return path;

    return path.substr(index + 1);
}

export function isSubpath(parentPath, childPath, sep)
{
    return childPath.startsWith(parentPath) && (
        /* C:\foo and C:\foo */
        parentPath.length === childPath.length
        /* C:\foo and C:\foo\bar */
        || childPath[parentPath.length] === sep
        /* C:\ and C:\foo\ */
        || (parentPath[parentPath.length - 1] === sep && childPath[parentPath.length - 1] === sep));
}

export function bindHandlers(obj)
{
    const proto = Object.getPrototypeOf(obj);

    for (let prop of Object.getOwnPropertyNames(proto))
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

export function once(func)
{
    let evaluated = false;
    let result;

    return function()
    {
        if (!evaluated)
        {
            result = func();
            evaluated = true;
        }

        return result;
    }
}

export function mapRange(start, count, func)
{
    const array = [];
    const end = start + count;

    for (let i = start; i < end; i++)
        array.push(func(i));

    return array;
}

export function arrayRemove(array, index)
{
    if (index < 0 || index >= array.length)
        throw new RangeError('Array index is out of bounds');

    const result = [... array];
    result.splice(index, 1);
    return result;
}

const kbSize = 1024;
const mbSize = 1024 * kbSize;
const gbSize = 1024 * mbSize;

export function getDisplaySize(size)
{
    if (size < 0)
        return '';

    if (size < kbSize)
        return size + ' bytes';

    if (size < mbSize)
        return (size / kbSize).toFixed(1) + ' KB';

    if (size < gbSize)
        return (size / mbSize).toFixed(1) + ' MB';

    return (size / gbSize).toFixed(1) + ' GB';
}

export function getDisplayDate(timestamp)
{
    return new Date(timestamp * 1000).toLocaleString();
}

export function linearToDb(value)
{
    return 10.0 * Math.log2(value);
}

export function dbToLinear(value)
{
    return Math.pow(2, value / 10.0);
}
