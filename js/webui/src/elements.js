import React from 'react'
import PropTypes from 'prop-types'
import spriteSvg from 'open-iconic/sprite/sprite.svg'
import { bindHandlers } from './utils'

export function Icon(props)
{
    const { name, className } = props;
    const fullClassName = 'icon icon-' + name + (className ? ' ' + className : '');

    if (name === 'none')
        return (<div className={fullClassName} />);

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

function defineButton()
{
    function Button(props, ref)
    {
        const { name, title, className, href, onClick, active } = props;

        const fullClassName = 'button'
            + (className ? ' ' + className : '')
            + (active ? ' active' : '');

        return (
            <a ref={ref} href={href || '#'} title={title} className={fullClassName} onClick={onClick}>
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
        active: PropTypes.bool
    };

    return Button;

}

export const Button = React.forwardRef(defineButton());

const DropdownSource = Symbol('DropdownSource');

export class DropdownButton extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = { };
        this.setButtonRef = this.setButtonRef.bind(this);

        bindHandlers(this);
    }

    handleButtonClick(e)
    {
        if (e.button !== 0)
            return;

        e.preventDefault();
        e[DropdownSource] = this;

        this.props.onRequestOpen(!this.props.isOpen);
    }

    handleWindowClick(e)
    {
        if (e.button !== 0)
            return;

        if (this.props.autoHide && this !== e[DropdownSource])
            this.props.onRequestOpen(false);
    }

    setButtonRef(button)
    {
        if (this.button)
            this.button.removeEventListener('click', this.handleButtonClick);

        this.button = button;

        if (this.button)
            this.button.addEventListener('click', this.handleButtonClick);
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
        const { isOpen, title, iconName, children, direction } = this.props;

        const contentClass = (
            'dropdown-content dropdown-'
            + direction
            + (isOpen ? ' active' : '')
        );

        return (
            <div className='dropdown'>
                <Button
                    ref={this.setButtonRef}
                    name={iconName}
                    title={title}
                    active={isOpen} />
                <div className={contentClass}>
                    { children }
                </div>
            </div>
        );
    }
}

DropdownButton.propTypes = {
    title: PropTypes.string.isRequired,
    iconName: PropTypes.string.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onRequestOpen: PropTypes.func.isRequired,
    autoHide: PropTypes.bool,
    direction: PropTypes.oneOf(['left', 'center', 'right']),
};

DropdownButton.defaultProps = {
    autoHide: true,
    direction: 'right'
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
