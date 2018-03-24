import React from 'react'
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'
import { Icon } from './elements';
import { once, mapRange } from './utils'
import { getScrollBarSize, generateElementId, addStyleSheet, makeClassName } from './dom_utils'

function pixelToRow(px, fontSize, rowHeight)
{
    return (px / (fontSize * rowHeight)) | 0;
}

function getFontSize()
{
    return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const addGeneratedStyles = once(() =>
{
    const margin = getScrollBarSize();

    addStyleSheet(`.dtable-head { margin-right: ${margin}px }`);
});

const maxColumns = 100;

const cellClassNames = mapRange(
    0, maxColumns, value => `dtable-cell dtable-column${value}`);

const columnHeaderClassNames = mapRange(
    0, maxColumns, value => `dtable-column-header dtable-column${value}`);

export default class DataTable extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = {};
        this.setBodyRef = this.setBodyRef.bind(this);
        this.handleScroll = throttle(this.handleScroll.bind(this), 50);
        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
    }

    componentWillMount()
    {
        this.setState({ elementId: generateElementId('dtable') });
    }

    setBodyRef(body)
    {
        if (this.body)
            this.body.removeEventListener('scroll', this.handleScroll);

        this.body = body;

        if (this.body)
            this.body.addEventListener('scroll', this.handleScroll);
    }

    handleScroll()
    {
        const { offset, pageSize, totalCount, rowHeight, fontScale } = this.props;

        const fontSize = getFontSize();
        const endOffset = offset + pageSize;
        const margin = pageSize / 5 | 0;

        const visibleOffset = pixelToRow(this.body.scrollTop, fontSize, rowHeight);
        const visibleCount = pixelToRow(this.body.offsetHeight, fontSize, rowHeight);
        const visibleEndOffset = visibleOffset + visibleCount;

        if (visibleOffset - margin <= offset)
        {
            let delta = visibleOffset - offset;

            if (delta > -margin)
                delta = -margin;

            if (offset + delta < 0)
                delta = -offset;

            this.movePage(delta);
        }
        else if (visibleEndOffset + margin >= endOffset)
        {
            let delta = visibleEndOffset - endOffset;

            if (delta < margin)
                delta = margin;

            if (endOffset + delta > totalCount)
                delta = totalCount - endOffset;

            this.movePage(delta);
        }
    }

    handleClick(e)
    {
        if (!this.props.useUrls)
            e.preventDefault();
    }

    handleDoubleClick(e)
    {
        const { onDoubleClick } = this.props;

        if (!onDoubleClick)
            return;

        const index = e.target.getAttribute('data-idx');

        if (index)
            onDoubleClick(Number(index));
    }

    movePage(delta)
    {
        if (delta === 0)
            return;

        const { offset, onLoadPage } = this.props;

        onLoadPage(offset + delta);
    }

    render()
    {
        addGeneratedStyles();

        const { className, style, useIcons } = this.props;
        const { elementId } = this.state;

        const fullClassName = makeClassName(
            ['dtable', useIcons ? 'dtable-icons' : null, className]);

        return (
            <div id={elementId} className={fullClassName} style={style}>
                <style>
                    { this.renderStyles() }
                </style>
                <div className='dtable-head'>
                    { this.renderColumnHeaders() }
                </div>
                <div
                    className='dtable-body'
                    ref={this.setBodyRef}
                    onClick={this.handleClick}
                    onDoubleClick={this.handleDoubleClick}>
                    { this.renderRows() }
                </div>
            </div>
        );
    }

    renderSpacer(key, height)
    {
        if (height <= 0)
            return null;

        const style = { height: `${height * this.props.rowHeight}rem` };

        return (
            <div key={key} className='dtable-spacer' style={style} />
        );
    }

    renderRow(rowIndex, rowData)
    {
        const cells = [];

        const columns = rowData.columns;
        const url = rowData.url || '#';

        if (this.props.useIcons && rowData.icon)
            cells.push(<Icon name={rowData.icon} className='dtable-icon' />);

        for (let columnIndex = 0; columnIndex < columns.length; columnIndex++)
        {
            const value = columns[columnIndex];

            cells.push(
                <a
                    key={columnIndex}
                    data-idx={rowIndex}
                    href={url}
                    className={cellClassNames[columnIndex]}>{value}</a>
            );
        }

        return (
            <div key={rowIndex} className='dtable-row'>{ cells }</div>
        );
    }

    renderRows()
    {
        const { data, offset, totalCount, pageSize } = this.props;

        let endOffset = offset + pageSize;

        if (endOffset > totalCount)
            endOffset = totalCount;

        const rows = [];

        rows.push(this.renderSpacer('header', offset));

        for (let i = offset; i < endOffset; i++)
            rows.push(this.renderRow(i, data[i - offset]));

        rows.push(this.renderSpacer('footer', totalCount - endOffset));

        return rows;
    }

    renderColumnHeaders()
    {
        return this.props.columnNames.map((name, index) => (
            <span
                key={index}
                className={columnHeaderClassNames[index]}>{name}</span>
        ));
    }

    renderColumnStyle(index, size)
    {
        return `#${this.state.elementId} .dtable-column${index} { width: ${size * 100}%; }`;
    }

    renderStyles()
    {
        const { columnNames, columnSizes } = this.props;

        let styles;

        if (columnSizes)
        {
            styles = this.props.columnSizes.map(
                (size, index) => this.renderColumnStyle(index, size));
        }
        else
        {
            styles = [];

            const size = 1 / columnNames.length;

            for (let i = 0; i < columnNames.length; i++)
                styles.push(this.renderColumnStyle(i, size));
        }

        return styles.join('\n');
    }
}

DataTable.propTypes = {
    columnNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    columnSizes: PropTypes.arrayOf(PropTypes.number),

    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    offset: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    totalCount: PropTypes.number.isRequired,

    useUrls: PropTypes.bool,
    useIcons: PropTypes.bool,
    rowHeight: PropTypes.number,
    className: PropTypes.string,
    style: PropTypes.object,

    onLoadPage: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
};

DataTable.defaultProps = {
    useUrls: false,
    useIcons: false,
    className: '',
    rowHeight: 1.25,
};
