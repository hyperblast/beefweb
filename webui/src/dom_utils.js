import measureScrollBar from 'measure-scrollbar'
import { once } from './utils'

export const getScrollBarSize = once(measureScrollBar);

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
