import React from 'react'
import PropTypes from 'prop-types'
import spriteSvg from 'open-iconic/sprite/sprite.svg'

export function Icon(props)
{
    return (
        <svg className={'icon icon-' + props.name}>
            <use xlinkHref={spriteSvg + '#' + props.name} />
        </svg>
    );
}

Icon.propTypes = {
    name: PropTypes.string.isRequired
};

export function IconLink(props)
{
    const { name, className, href, onClick } = props;
    return (
        <a href={href || '#'} className={className} onClick={onClick}>
            <Icon name={name} />
        </a>
    );
}

IconLink.propTypes = {
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    className: PropTypes.string,
    href: PropTypes.string,
    onClick: PropTypes.func,
};

export function SwitcherHeader(props)
{
    return (
        <div className='panel-header tabs-wrapper'>
            <div className='tabs tabs-primary'>
                <div className='tab active'>
                    <span>{props.title}</span>
                </div>
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
