import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types'
import spriteSvg from 'open-iconic/sprite/sprite.svg'
import { generateElementId, makeClassName } from './dom_utils.js';
import { debounce } from './lodash.js';

function makeClickHandler(callback)
{
    if (!callback)
        return null;

    return function handleClick(e)
    {
        if (e.button !== 0)
            return;

        e.preventDefault();
        callback(e);
    };
}

export function Icon(props)
{
    const { name, className } = props;
    const fullClassName = 'icon icon-' + name + (className ? ' ' + className : '');

    if (name === 'none')
        return (<div className={fullClassName} />);

    const href = `${spriteSvg}#${name}`;

    return (
        <svg className={fullClassName}>
            <use xlinkHref={href} href={href} />
        </svg>
    );
}

Icon.propTypes = {
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export const IconButton = React.forwardRef(function IconButton(props, ref)
{
    const { name, title, className, href, onClick, active } = props;

    const fullClassName = 'icon-button'
        + (className ? ' ' + className : '')
        + (active ? ' active' : '');

    return (
        <a
            ref={ref}
            href={href || '#'}
            title={title}
            className={fullClassName}
            onClick={makeClickHandler(onClick)}>
            <Icon name={name} />
        </a>
    );
});

IconButton.propTypes = {
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    className: PropTypes.string,
    href: PropTypes.string,
    onClick: PropTypes.func,
    active: PropTypes.bool
};

export function Menu(props)
{
    const { children } = props;

    return (
        <ul className='menu'>
            {children}
        </ul>
    );
}

export function MenuItem(props)
{
    const { title, href, onClick, checked } = props;

    let menuIcon;

    if (checked === true)
        menuIcon = (<Icon name='check' />);
    else if (checked === false)
        menuIcon = (<Icon name='none' />);
    else
        menuIcon = null;

    return (
        <li className='menu-item'>
            <a href={href || '#'} onClick={makeClickHandler(onClick)}>
                { menuIcon }<span>{ title }</span>
            </a>
        </li>
    );
}

MenuItem.propTypes = {
    title: PropTypes.string.isRequired,
    href: PropTypes.string,
    onClick: PropTypes.func,
    checked: PropTypes.bool,
};

export function MenuSeparator(props)
{
    return (
        <li className='menu-separator' />
    );
}

export function MenuLabel(props)
{
    return (
        <li className='menu-label'>{props.title}</li>
    );
}

MenuLabel.propTypes = {
    title: PropTypes.string.isRequired
};

export function PanelHeader(props)
{
    return (
        <div className='panel panel-header'>
            <div className='header-block header-block-primary'>
                <span className='header-label header-label-primary'>{props.title}</span>
            </div>
        </div>
    );
}

PanelHeader.propTypes = {
    title: PropTypes.string.isRequired
};

export function PanelHeaderTab(props)
{
    const className = makeClassName({
        'header-tab': true,
        'header-tab-active': props.active
    });

    return (
        <li className={className}>
            <a href={props.href} title={props.title}>{props.title}</a>
        </li>
    );
}

PanelHeaderTab.propTypes = {
    active: PropTypes.bool.isRequired,
    href: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
};

export function Select(props)
{
    const { id, name, selectedItemId, items, onChange, className, disabled } = props;

    if (!items || items.length === 0)
    {
        return <select className={className} id={id} disabled={true}>
            <option>Not available</option>
        </select>
    }

    const idProperty = props.idProperty || 'id';
    const nameProperty = props.nameProperty || 'name';

    return <select
        id={id}
        name={name}
        className={className}
        value={selectedItemId}
        onChange={onChange}
        disabled={disabled}>
        {items.map(t => {
            const id = t[idProperty];
            const name = t[nameProperty];
            return <option key={id} value={id}>{name}</option>;
        })}
    </select>;
}

Select.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    selectedItemId: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.object),
    onChange: PropTypes.func,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    idProperty: PropTypes.string,
    nameProperty: PropTypes.string,
};

function autoScrollCss(elementId, labelWidth)
{
    return `@keyframes ${elementId} { from { left: 0; } to { left: -${labelWidth}px; } }
.auto-scroll-overflow > #${elementId},
.auto-scroll-overflow > #${elementId}-h { animation: ${labelWidth / 20}s linear 0s ${elementId} infinite; }`;
}

export function AutoScrollText(props)
{
    const { text, className } = props;

    const container = useRef(null);
    const label = useRef(null);

    const elementId = useMemo(() => generateElementId('auto-scroll'), []);
    const [isOverflow, setOverflow] = useState(false);
    const [labelWidth, setLabelWidth] = useState(0);

    useLayoutEffect(() => {
        const updateOverflow = () => setOverflow(container.current.clientWidth < label.current.clientWidth);
        const updateOverflowWithDelay = debounce(updateOverflow, 10);

        setLabelWidth(label.current.clientWidth);
        updateOverflow();

        window.addEventListener('resize', updateOverflowWithDelay);
        return () => window.removeEventListener('resize', updateOverflowWithDelay);
    }, [text]);

    const fullClassName = makeClassName([
        'auto-scroll-container',
        isOverflow ? 'auto-scroll-overflow' : null,
        className,
    ]);

    return <div className={fullClassName} ref={container} title={text}>
        <style>{ autoScrollCss(elementId, labelWidth) }</style>
        <span id={elementId} className='auto-scroll-text' ref={label}>{text}</span>
        <span id={elementId + '-h'} className='auto-scroll-text auto-scroll-text-helper'>{text}</span>
    </div>
}
