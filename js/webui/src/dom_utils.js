import { debounce } from './lodash.js';

export function setScrollBarSize()
{
    // Based on https://github.com/sonicdoe/measure-scrollbar/blob/master/index.js

    const div = document.createElement('div');

    div.style.width = '100px';
    div.style.height = '100px';
    div.style.overflow = 'scroll';
    div.style.position = 'absolute';
    div.style.top = '-9999px';

    document.body.appendChild(div);
    const width = div.offsetWidth - div.clientWidth;
    const height = div.offsetHeight - div.clientHeight;
    document.body.removeChild(div);

    document.documentElement.style.setProperty('--scroll-bar-width', `${width}px`);
    document.documentElement.style.setProperty('--scroll-bar-height', `${height}px`);
}

export function subscribeWindowResize(callback)
{
    const debouncedCallback = debounce(callback, 50);
    window.addEventListener('resize', debouncedCallback);
    return () => window.removeEventListener('resize', debouncedCallback);
}

let nextElementId = 0;

export function generateElementId(prefix)
{
    const id = nextElementId++;

    return `${prefix}-id-${id}`;
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

export function getFontSize()
{
    return parseFloat(getComputedStyle(document.documentElement).fontSize);
}
