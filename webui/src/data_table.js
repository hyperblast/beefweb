import React from 'react'
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'

let nextElementId = 0;

function getNextElementId()
{
    const id = nextElementId++;

    return `dtable${id}`;
}

function pixelToRow(px, fontSize, rowHeight)
{
    return (px / (fontSize * rowHeight)) | 0;
}

function getFontSize()
{
    return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export default class DataTable extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = { startOffset: 0 };
        this.setBodyRef = this.setBodyRef.bind(this);
        this.handleScroll = throttle(this.handleScroll.bind(this), 50);
    }

    componentWillMount()
    {
        this.setState({ elementId: getNextElementId() });
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
                <div className='dtable-body' ref={this.setBodyRef}>
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

    renderRow(rowIndex)
    {
        const data = this.props.onGetRowData(rowIndex);

        const cells = data.map((value, columnIndex) => (
            <span
                key={columnIndex}
                className={'dtable-cell dtable-column' + columnIndex}>{value}</span>
        ));

        return (
            <div key={rowIndex} className='dtable-row'>{ cells }</div>
        );
    }

    renderRows()
    {
        const { totalCount, pageSize } = this.props;
        const { startOffset } = this.state;
        const endOffset = startOffset + pageSize;
        const rows = [];

        rows.push(this.renderSpacer('header', startOffset));

        for (let i = startOffset; i < endOffset; i++)
            rows.push(this.renderRow(i));

        rows.push(this.renderSpacer('footer', totalCount - endOffset));

        return rows;
    }

    renderColumnHeaders()
    {
        return this.props.columnNames.map((name, index) => (
            <span
                key={index}
                className={'dtable-column-header dtable-column' + index}>{name}</span>
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
};

DataTable.defaultProps = {
    className: '',
    pageSize: 100,
    rowHeight: 1.25,
};
