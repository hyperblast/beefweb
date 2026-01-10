import React from 'react';
import PropTypes from 'prop-types';
import { clamp, throttle } from './lodash.js';
import { Icon } from './elements.js';
import { mapRange } from './utils.js';
import { generateElementId, getFontSize, makeClassName } from './dom_utils.js';
import ScrollManager from './scroll_manager.js';
import { DropdownButton, DropdownLink } from './dropdown.js';

const maxColumns = 100;

// These values must be synced with variables in styles.less
const rowHeight = 2;
const subrowHeight = 1.5;
const rowMarginWithSubrows = 0.5;
const rowPadding = 0.25;

const cellClassNames = mapRange(
    0, maxColumns, value => `dtable-cell dtable-column-${value}`);

function normalizeColumns(columns)
{
    const result = [];

    let prevIsBreak = true;

    for (const column of columns)
    {
        if (prevIsBreak && column.lineBreak)
            continue;

        prevIsBreak = column.lineBreak;
        result.push(column)
    }

    if (result.length > 0 && result[result.length - 1].lineBreak)
        result.pop();

    return result;
}

function getSubrowCount(columns)
{
    let count = 1;

    for (let column of columns)
    {
        if (column.lineBreak)
            count++;
    }

    return count;
}

function getColumnsConfig(originalColumns)
{
    const columns = normalizeColumns(originalColumns);
    const subrowCount = getSubrowCount(columns);
    const rowHeightRem =
        subrowCount > 1
            ? subrowHeight * subrowCount + 2 * rowPadding + rowMarginWithSubrows
            : rowHeight;

    return {
        originalColumns,
        columns,
        subrowCount,
        rowHeightRem
    };
}

export default class DataTable extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.elementId = generateElementId('dtable');
        this.state = { columnMenuIndex: -1, rowMenuIndex: -1 };
        this.columnsConfig = getColumnsConfig(props.columns);
        this.setBodyRef = this.setBodyRef.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.throttledScroll = throttle(this.handleScroll.bind(this), 50);
    }

    componentDidMount()
    {
        this.registerInScrollManager(this.props);
        this.restoreScrollPosition();
    }

    componentWillUnmount()
    {
        this.throttledScroll.cancel();
        this.unregisterInScrollManager(this.props);
    }

    componentDidUpdate(prevProps)
    {
        if (prevProps.globalKey !== this.props.globalKey ||
            prevProps.scrollManager !== this.props.scrollManager)
        {
            this.unregisterInScrollManager(prevProps);
            this.registerInScrollManager(this.props);
            this.restoreScrollPosition();
        }
        else if (prevProps.columns !== this.props.columns)
        {
            this.restoreScrollPosition();
        }
    }

    updateColumnsConfig()
    {
        if (this.props.columns === this.columnsConfig.originalColumns)
            return;

        this.columnsConfig = getColumnsConfig(this.props.columns);
    }

    rowHeightPx(fontSize)
    {
        return fontSize * this.columnsConfig.rowHeightRem;
    }

    pixelToRow(px, fontSize)
    {
        return (px / this.rowHeightPx(fontSize)) | 0;
    }

    rowToPixel(row, fontSize)
    {
        return (row * this.rowHeightPx(fontSize)) | 0;
    }

    saveScrollPosition()
    {
        const { globalKey, scrollManager } = this.props;

        if (!globalKey || !scrollManager)
            return;

        const fontSize = getFontSize();
        const item = this.pixelToRow(this.body.scrollTop, fontSize);
        const offset = this.body.scrollTop - this.rowToPixel(item, fontSize);

        scrollManager.savePosition(globalKey, item, offset);
    }

    restoreScrollPosition()
    {
        const { globalKey, scrollManager } = this.props;

        if (globalKey && scrollManager)
            this.scrollTo(scrollManager.getPosition(globalKey));
    }

    scrollTo(position)
    {
        setTimeout(() => {
            if (!this.body)
                return;

            const fontSize = getFontSize();
            this.body.scrollTop = (
                this.rowToPixel(position.item, fontSize) +
                Math.min(position.offset, this.rowHeightPx(fontSize))
            );
        }, 30);
    }

    registerInScrollManager(props)
    {
        const { globalKey, scrollManager } = props;

        if (globalKey && scrollManager)
            scrollManager.registerComponent(globalKey, this);
    }

    unregisterInScrollManager(props)
    {
        const { globalKey, scrollManager } = props;

        if (globalKey && scrollManager)
            scrollManager.unregisterComponent(globalKey, this);
    }

    setBodyRef(body)
    {
        if (this.body)
            this.body.removeEventListener('scroll', this.throttledScroll);

        this.body = body;

        if (this.body)
            this.body.addEventListener('scroll', this.throttledScroll);
    }

    handleScroll()
    {
        this.saveScrollPosition();

        const { offset, pageSize, totalCount } = this.props;

        const margin = pageSize / 5 | 0;

        const fontSize = getFontSize();
        const visibleOffset = this.pixelToRow(this.body.scrollTop, fontSize);
        const visibleCount = this.pixelToRow(this.body.clientHeight, fontSize);

        if (visibleOffset - margin >= offset &&
            visibleOffset + visibleCount + margin <= offset + pageSize)
        {
            // Current page covers entire visible area, and we have some margins for scrolling without loading
            return;
        }

        const newOffset = clamp(
            // Center data page around center of visible area
            visibleOffset + ((visibleCount - pageSize) >> 1),
            0,
            totalCount - pageSize);

        if (offset === newOffset)
            return;

        this.props.onLoadPage(newOffset);
    }

    openColumnMenu(index, isOpen)
    {
        if (isOpen)
        {
            this.setState({
                columnMenuIndex: index,
                rowMenuIndex: -1,
            });
        }
        else
        {
            this.setState(state => (
                state.columnMenuIndex === index ? { columnMenuIndex: -1 } : null
            ));
        }
    }

    openRowMenu(index, isOpen)
    {
        if (isOpen)
        {
            this.setState({
                columnMenuIndex: -1,
                rowMenuIndex: index,
            });
        }
        else
        {
            this.setState(state => (
                state.rowMenuIndex === index ? { rowMenuIndex: -1 } : null
            ));
        }
    }

    handleClick(e)
    {
        if (e.target.parentNode.getAttribute('href') !== '#')
            return;

        e.preventDefault();
        this.callHandler('onClick', e);
    }

    handleDoubleClick(e)
    {
        this.callHandler('onDoubleClick', e);
    }

    callHandler(key, e)
    {
        const handler = this.props[key];
        if (!handler)
            return;

        const index = e.target.parentNode.getAttribute('data-idx');
        if (!index)
            return;

        handler(Number(index));
    }

    render()
    {
        this.updateColumnsConfig();

        const { className, style, useIcons, onRenderRowMenu } = this.props;
        const hasSubrows = this.columnsConfig.subrowCount > 1;

        const fullClassName = makeClassName([
            'dtable',
            useIcons ? 'dtable-has-row-icons' : null,
            onRenderRowMenu ? 'dtable-has-row-menu' : null,
            hasSubrows ? 'dtable-has-subrows' : null,
            className,
        ]);

        const head = hasSubrows ? null : <div className="dtable-head">{this.renderColumnHeaders()}</div>;

        return (
            <div id={this.elementId} className={fullClassName} style={style}>
                <style>{this.renderCellStyles()}</style>
                {head}
                <div
                    className='dtable-body'
                    ref={this.setBodyRef}
                    onClick={this.handleClick}
                    onDoubleClick={this.handleDoubleClick}>
                    {this.renderRows()}
                </div>
            </div>
        );
    }

    renderSpacer(key, height)
    {
        if (height <= 0)
            return null;

        const size = height * this.columnsConfig.rowHeightRem;
        const style = { height: `${size}rem` };

        return (
            <div key={key} className='dtable-spacer' style={style}/>
        );
    }

    renderRow(rowIndex, rowData)
    {
        let icon = null;

        if (this.props.useIcons)
        {
            if (rowData.icon)
            {
                icon = <Icon name={rowData.icon} className='dtable-row-icon'/>;
            }
            else
            {
                icon = <div className='dtable-row-icon-text'>{rowData.iconText}</div>;
            }
        }

        const { columns } = this.columnsConfig;
        const cells = [];
        let cellIndex = 0;

        for (let columnIndex = 0; columnIndex < columns.length; columnIndex++)
        {
            if (columns[columnIndex].lineBreak)
                continue;

            let { dataIndex } = columns[columnIndex];

            if (!Number.isInteger(dataIndex))
                dataIndex = cellIndex;

            cells.push(<span key={cellIndex} className={cellClassNames[cellIndex]}>{rowData.columns[dataIndex]}</span>);
            cellIndex++;
        }

        const url = rowData.url || '#';
        const title = rowData.columns.join(' | ');
        const rowContent = (
            <a data-idx={rowIndex} href={url} title={title} className='dtable-row-content'>{cells}</a>
        );

        let rowMenuButton = null;

        if (this.props.onRenderRowMenu)
        {
            const rowMenu = this.props.onRenderRowMenu(rowIndex);
            if (rowMenu)
            {
                rowMenuButton = (
                    <DropdownButton
                        title={this.props.rowMenuTitle}
                        iconName={this.props.rowMenuIconName}
                        isOpen={this.state.rowMenuIndex === rowIndex}
                        onRequestOpen={o => this.openRowMenu(rowIndex, o)}
                        className='dtable-row-menu'>
                        {rowMenu}
                    </DropdownButton>
                );
            }
            else
            {
                rowMenuButton = <Icon name='none'/>;
            }
        }

        return (
            <div key={rowIndex} className='dtable-row'>
                {icon}
                {rowContent}
                {rowMenuButton}
            </div>
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
        const { columns } = this.columnsConfig;
        const { onRenderColumnMenu } = this.props;

        const headers = [];

        for (let i = 0; i < columns.length; i++)
        {
            const column = columns[i];

            if (column.lineBreak)
                break;

            if (onRenderColumnMenu)
                headers.push(this.renderColumnHeaderWithMenu(column.title, i));
            else
                headers.push(this.renderColumnHeaderSimple(column.title, i))
        }

        return headers;
    }

    renderColumnHeaderSimple(name, index)
    {
        const className = `dtable-column-header dtable-column-${index}`;

        return (
            <span
                key={index}
                title={name}
                className={className}>{name}</span>
        );
    }

    renderColumnHeaderWithMenu(name, index)
    {
        return (
            <DropdownLink
                key={index}
                title={name}
                className={`dtable-column-header dtable-column-header-link dtable-column-${index}`}
                isOpen={this.state.columnMenuIndex === index}
                onRequestOpen={o => this.openColumnMenu(index, o)}>
                {this.props.onRenderColumnMenu(index)}
            </DropdownLink>
        );
    }

    renderCellStyle(index, column, size, withHeader)
    {
        const rules = [
            `width: ${size * 100}%;`
        ];

        if (column.align === 'right' || column.align === 'center')
        {
            rules.push(`text-align: ${column.align};`)
        }

        if (column.bold)
        {
            rules.push('font-weight: bold;')
        }

        if (column.italic)
        {
            rules.push('font-style: italic;')
        }

        if (column.small)
        {
            rules.push('font-size: 0.8rem;')
        }

        const headerStyle = withHeader
                            ? `#${this.elementId} .dtable-column-header.dtable-column-${index} { ${rules[0]} }\n`
                            : '';

        return `${headerStyle}#${this.elementId} .dtable-cell.dtable-column-${index} { ${rules.join(' ')} }`;
    }

    renderCellStyles()
    {
        const { columns } = this.columnsConfig;
        const styles = [];

        let subrowStart = 0;
        let subrowSize = 0;
        let subrowIndex = 0;

        for (let i = 0; i < columns.length; i++)
        {
            if (!columns[i].lineBreak)
            {
                subrowSize += columns[i].size;
                continue;
            }

            for (let j = subrowStart; j < i; j++)
            {
                styles.push(this.renderCellStyle(
                    j - subrowIndex,
                    columns[j],
                    columns[j].size / subrowSize,
                    subrowIndex === 0));
            }

            subrowStart = i + 1;
            subrowSize = 0;
            subrowIndex++;
        }

        for (let j = subrowStart; j < columns.length; j++)
        {
            styles.push(this.renderCellStyle(
                j - subrowIndex,
                columns[j],
                columns[j].size / subrowSize,
                subrowIndex === 0));
        }

        return styles.join('\n');
    }
}

DataTable.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    offset: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    totalCount: PropTypes.number.isRequired,

    columns: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string,
        size: PropTypes.number,
        lineBreak: PropTypes.bool,
        dataIndex: PropTypes.number,
        bold: PropTypes.bool,
        italic: PropTypes.bool,
        align: PropTypes.oneOf(['left', 'center', 'right'])
    })).isRequired,

    globalKey: PropTypes.string,
    scrollManager: PropTypes.instanceOf(ScrollManager),

    useIcons: PropTypes.bool,
    className: PropTypes.string,
    rowMenuTitle: PropTypes.string,
    rowMenuIconName: PropTypes.string,

    onLoadPage: PropTypes.func.isRequired,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onRenderColumnMenu: PropTypes.func,
    onRenderRowMenu: PropTypes.func,
};

DataTable.defaultProps = {
    useIcons: false,
    className: '',
    rowMenuTitle: 'Menu',
    rowMenuIconName: 'ellipses'
};
