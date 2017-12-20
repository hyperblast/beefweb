import React from 'react'
import PropTypes from 'prop-types'
import spriteSvg from 'open-iconic/sprite/sprite.svg'

export function Icon(props)
{
    const { name, className } = props;

    if (name === 'none')
        return (<div className='icon icon-none' />);

    const fullClassName = 'icon icon-' + name + (className ? ' ' + className : '');

    return (
        <svg className={fullClassName}>
            <use xlinkHref={spriteSvg + '#' + name} />
        </svg>
    );
}

Icon.propTypes = {
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export function Button(props)
{
    const { name, title, className, href, onClick, active } = props;

    const fullClassName = 'button'
        + (className ? ' ' + className : '')
        + (active ? ' active' : '');

    return (
        <a href={href || '#'} title={title} className={fullClassName} onClick={onClick}>
            <Icon name={name} />
        </a>
    );
}

Button.propTypes = {
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    className: PropTypes.string,
    href: PropTypes.string,
    onClick: PropTypes.func,
    active: PropTypes.bool,
};

export class Dropdown extends React.PureComponent
{
    constructor()
    {
        super();
        this.state = { isVisible: false };
        this.handleDropdownClick = this.handleDropdownClick.bind(this);
        this.handleWindowClick = this.handleWindowClick.bind(this);
    }

    handleDropdownClick(e)
    {
        e.preventDefault();
        e.stopPropagation();

        this.setState({ isVisible: !this.state.isVisible });
    }

    handleWindowClick()
    {
        if (this.props.autoHide)
            this.setState({ isVisible: false });
    }

    componentDidMount()
    {
        window.addEventListener('click', this.handleWindowClick);
    }

    componentWillUnmount()
    {
        window.removeEventListener('click', this.handleWindowClick);
    }

    render()
    {
        const { isVisible } = this.state;
        const { title, iconName, children, direction } = this.props;

        const contentClass = 'dropdown-content dropdown-' + direction + (isVisible ? ' active' : '');

        return (
            <div className='dropdown'>
                <Button
                    name={iconName}
                    title={title}
                    active={isVisible}
                    onClick={this.handleDropdownClick} />
                <div className={contentClass}>
                    {children}
                </div>
            </div>
        );
    }
}

Dropdown.propTypes = {
    title: PropTypes.string.isRequired,
    iconName: PropTypes.string.isRequired,
    autoHide: PropTypes.bool,
    direction: PropTypes.oneOf(['left', 'center', 'right']),
};

Dropdown.defaultProps = {
    autoHide: true,
    direction: 'right'
}

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
            <a href={href || '#'} onClick={onClick}>
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
        <div className='panel-header'>
            <div className='header-block header-block-primary'>
                <span className='header-label header-label-primary'>{props.title}</span>
            </div>
        </div>
    );
}

PanelHeader.propTypes = {
    title: PropTypes.string.isRequired
};
