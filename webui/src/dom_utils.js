import { once } from './utils'

export const getScrollBarSize = once(() =>
{
    // Based on https://github.com/sonicdoe/measure-scrollbar/blob/master/index.js

    const div = document.createElement('div');

    div.style.width = '100px';
    div.style.height = '100px';
    div.style.overflow = 'scroll';
    div.style.position = 'absolute';
    div.style.top = '-9999px';

    document.body.appendChild(div);
    const size = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);

    return size;
});

let nextElementId = 0;

export function generateElementId(prefix)
{
    const id = nextElementId++;

    return `${prefix}-id${id}`;
}

export function addStyleSheet(value)
{
    const element = document.createElement('style');
    element.type = 'text/css';
    element.innerText = value;
    document.head.appendChild(element);
    return element;
}

export function makeClassName(classes)
{
    const parts = [];

    if (Array.isArray(classes))
    {
        for (let cls of classes)
        {
            if (cls)
                parts.push(cls);
        }
    }
    else
    {
        for (let cls of Object.keys(classes))
        {
            if (classes[cls])
                parts.push(cls);
        }
    }

    return parts.join(' ');
}
