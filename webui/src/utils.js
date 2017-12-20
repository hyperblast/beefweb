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

export function clamp(value, lower, upper)
{
    if (value < lower)
        return lower;

    if (value > upper)
        return upper;

    return value;
}

export function getParentDir(path)
{
    var index = path.lastIndexOf('/');

    if (index < 0)
        return '';

    return path.substr(0, index);
}

export function mapObject(obj, callback)
{
    let result = {};

    for (let prop in obj)
    {
        if (obj.hasOwnProperty(prop))
            result[prop] = callback(obj[prop], prop);
    }

    return result;
}