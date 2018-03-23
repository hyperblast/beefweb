import React from 'react'
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'
import range from 'lodash/range'
import { once } from './utils'
import { getScrollBarSize, generateElementId, addStyleSheet } from './dom_utils'

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

function getDummyUrl()
{
    return '#';
}

const maxColumns = 100;

const cellClassNames = range(0, maxColumns).map(
    value => `dtable-cell dtable-column${value}`);

const columnHeaderClassNames = range(0, maxColumns).map(
    value => `dtable-column-header dtable-column${value}`);

export default class DataTable extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = { startOffset: 0 };
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
        const { pageSize, totalCount, rowHeight, fontScale } = this.props;
        const { startOffset } = this.state;

        const fontSize = getFontSize();
        const endOffset = startOffset + pageSize;
        const margin = pageSize / 5 | 0;

        const visibleStartOffset = pixelToRow(this.body.scrollTop, fontSize, rowHeight);
        const visibleCount = pixelToRow(this.body.offsetHeight, fontSize, rowHeight);
        const visibleEndOffset = visibleStartOffset + visibleCount;

        if (visibleStartOffset - margin <= startOffset)
        {
            let delta = visibleStartOffset - startOffset;

            if (delta > -margin)
                delta = -margin;

            if (startOffset + delta < 0)
                delta = -startOffset;

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
        if (!this.props.onGetUrl)
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

        const { pageSize, onLoadPage } = this.props;
        const { startOffset } = this.state;

        const newStartOffset = startOffset + delta;

        if (onLoadPage)
            onLoadPage(newStartOffset, pageSize);

        this.setState({ startOffset: newStartOffset });
    }

    render()
    {
        addGeneratedStyles();

        const { className, style } = this.props;
        const { elementId } = this.state;

        return (
            <div id={elementId} className={'dtable ' + className} style={style}>
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
        if (height < 0)
            return null;

        const style = { height: `${height * this.props.rowHeight}rem` };

        return (
            <div key={key} className='dtable-spacer' style={style} />
        );
    }

    renderRow(rowIndex, url)
    {
        const data = this.props.onGetRowData(rowIndex);
        const cells = [];

        for (let columnIndex = 0; columnIndex < data.length; columnIndex++)
        {
            const value = data[columnIndex];

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
        const { totalCount, pageSize, onGetUrl } = this.props;
        const { startOffset } = this.state;

        const endOffset = startOffset + pageSize;
        const rows = [];

        let getUrl = onGetUrl || getDummyUrl;

        rows.push(this.renderSpacer('header', startOffset));

        for (let i = startOffset; i < endOffset; i++)
            rows.push(this.renderRow(i, getUrl(i)));

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
    rowHeight: PropTypes.number,
    className: PropTypes.string,
    style: PropTypes.object,
    pageSize: PropTypes.number,
    totalCount: PropTypes.number.isRequired,
    onGetRowData: PropTypes.func.isRequired,
    onLoadPage: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onGetUrl: PropTypes.func,
};

DataTable.defaultProps = {
    className: '',
    pageSize: 100,
    rowHeight: 1.25,
};
