import React from 'react'
import PropTypes from 'prop-types'
import spriteSvg from 'open-iconic/sprite/sprite.svg'

export function Icon(props)
{
    const { name, className } = props;
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
        const { title, iconName, children } = this.props;

        const activeClass = isVisible ? ' active' : '';
        const linkClass = 'button' + activeClass;
        const contentClass = 'dropdown-content' + activeClass;

        return (
            <div className='dropdown'>
                <a href='#' title={title} className={linkClass} onClick={this.handleDropdownClick}>
                    <Icon name={iconName} />
                </a>
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
    const { title, href, onClick } = props;

    return (
        <li className='menu-item'>
            <a href={href || '#'} onClick={onClick}>
                {title}
            </a>
        </li>
    );
}

MenuItem.propTypes = {
    title: PropTypes.string.isRequired,
    href: PropTypes.string,
    onClick: PropTypes.func,
};

export function MenuSeparator(props)
{
    return (
        <li className='menu-separator' />
    );
}

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
