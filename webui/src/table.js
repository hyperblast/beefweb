import React from 'react'
import PropTypes from 'prop-types'

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

export default function Table(props)
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
