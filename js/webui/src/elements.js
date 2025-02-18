import React from 'react'
import PropTypes from 'prop-types'
import spriteSvg from 'open-iconic/sprite/sprite.svg'
import { makeClassName } from './dom_utils.js';

function makeClickHandler(callback)
{
    if (!callback)
        return null;

    return function handleClick(e)
    {
        if (e.button === 0 || e.button === 1)
        {
            e.preventDefault();

            if (e.button === 0)
                callback(e);
        }
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

export const Button = React.forwardRef(function Button(props, ref)
{
    const { name, title, className, href, onClick, active } = props;

    const fullClassName = 'button'
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

Button.propTypes = {
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
    const { id, selectedItemId, items, onChange, className } = props;

    if (!items || items.length === 0)
    {
        return <select className={className} id={id} disabled={true}>
            <option>Not available</option>
        </select>
    }

    return <select className={className} id={id} value={selectedItemId} onChange={onChange}>
        {items.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>;
}

Select.propTypes = {
    id: PropTypes.string.isRequired,
    selectedItemId: PropTypes.string,
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        })
    ),
    onChange: PropTypes.func,
    className: PropTypes.string,
};
