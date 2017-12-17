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
    const { name, className, href, onClick } = props;
    const fullClassName = className ? className + ' button' : 'button';

    return (
        <a href={href || '#'} className={fullClassName} onClick={onClick}>
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
        const { iconName, children } = this.props;

        const activeClass = isVisible ? ' active' : '';
        const linkClass = 'button' + activeClass;
        const contentClass = 'dropdown-content' + activeClass;

        return (
            <div className='dropdown'>
                <a href='#' className={linkClass} onClick={this.handleDropdownClick}>
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

export function SwitcherHeader(props)
{
    return (
        <div className='panel-header'>
            <div className='header-block header-block-primary'>
                <span className='header-label header-label-primary'>{props.title}</span>
            </div>
        </div>
    );
}

SwitcherHeader.propTypes = {
    title: PropTypes.string.isRequired
};

const visibilityHidden = Object.freeze({ visibility: 'hidden' });

function makeOnClickAdapter(onClick)
{
    if (onClick)
    {
        return e => {
            e.preventDefault();
            var idx = Number(e.target.getAttribute('data-idx'));
            onClick(idx);
        };
    }
    else
    {
        return e => e.preventDefault();
    }
}

function renderHiddenColumnsRow(row)
{
    var cells = row.map((col, colIndex) => <td key={'c' + colIndex}>{col}</td>);
    return <tr key='headers' style={visibilityHidden}>{ cells }</tr>;
}

function renderTableRow(row, rowIndex, onClick)
{
    var url = row.url ? row.url : '#';
    var dataIdx = String(rowIndex);

    if (url != '#')
        onClick = null;

    var cells = row.columns.map((col, colIndex) =>
        <td key={'c' + colIndex}>
            <a href={url} onClick={onClick} data-idx={dataIdx}>{col}</a>
        </td>
    );

    return <tr key={'r' + rowIndex}>{ cells }</tr>;
}

export function Table(props)
{
    var columns = props.columns;
    var rows = props.rows;
    var onClick = makeOnClickAdapter(props.onClick);

    var renderedColumns = columns.map(
        (col, colIndex) => (<th key={'c' + colIndex}><div className='table-header-cell'>{col}</div></th>));

    var renderedRows = rows
        .map((row, rowIndex) => renderTableRow(row, rowIndex, onClick, null))
        .concat([renderHiddenColumnsRow(columns)]);

    return (
        <div className='table-content-inner'>
            <table>
                <thead><tr>{ renderedColumns }</tr></thead>
                <tbody>{ renderedRows }</tbody>
            </table>
        </div>
    );
}
