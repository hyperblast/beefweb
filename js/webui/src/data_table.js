import React from 'react'
import PropTypes from 'prop-types'
import { throttle } from './lodash.js'
import { Icon } from './elements.js';
import { mapRange } from './utils.js'
import { generateElementId, getFontSize, makeClassName } from './dom_utils.js'
import ScrollManager from './scroll_manager.js';
import { DropdownButton, DropdownLink } from './dropdown.js';

const maxColumns = 100;

// These values must be synced with variables in styles.less
const rowHeight = 2;
const subrowHeight = 1.5;
const rowMarginWithSubrows = 1;
const rowPadding = 0.25;

const cellClassNames = mapRange(
    0, maxColumns, value => `dtable-cell dtable-column-${value}`);

export default class DataTable extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.elementId = generateElementId('dtable');
        this.state = { columnMenuIndex: -1, rowMenuIndex: -1 };
        this.setBodyRef = this.setBodyRef.bind(this);
        this.handleScroll = throttle(this.handleScroll.bind(this), 50);
        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
    }

    componentDidMount()
    {
        this.registerInScrollManager(this.props);
        this.restoreScrollPosition();
    }

    componentWillUnmount()
    {
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
    }

    subrowCount()
    {
        let count = 1;

        for (let column of this.props.columns)
        {
            if (column.lineBreak)
                count++;
        }

        return count;
    }

    rowHeightRem()
    {
        const subrows = this.subrowCount();
        return subrows > 1 ? subrowHeight * subrows + 2 * rowPadding + rowMarginWithSubrows: rowHeight;
    }

    rowHeightPx(fontSize)
    {
        return fontSize * this.rowHeightRem();
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

        if (globalKey && scrollManager)
            scrollManager.savePosition(globalKey, this.body.scrollTop);
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

            const { offset, offsetItem } = position;

            if (offset !== undefined)
                this.body.scrollTop = offset;
            else if (offsetItem !== undefined)
                this.body.scrollTop = this.rowToPixel(offsetItem, getFontSize());
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
            this.body.removeEventListener('scroll', this.handleScroll);

        this.body = body;

        if (this.body)
            this.body.addEventListener('scroll', this.handleScroll);
    }

    movePage(delta, offset, endOffset, totalCount)
    {
        if (offset + delta < 0)
            delta = -offset;

        if (endOffset + delta > totalCount)
            delta = totalCount - endOffset;

        if (delta === 0)
            return;

        this.props.onLoadPage(offset + delta);
    }

    handleScroll()
    {
        this.saveScrollPosition();

        const { offset, pageSize, totalCount } = this.props;

        let endOffset = offset + pageSize;

        if (endOffset > totalCount)
            endOffset = totalCount;

        const margin = pageSize / 5 | 0;

        const fontSize = getFontSize();
        const visibleOffset = this.pixelToRow(this.body.scrollTop, fontSize);
        const visibleCount = this.pixelToRow(this.body.offsetHeight, fontSize);
        const visibleEndOffset = visibleOffset + visibleCount;

        if (visibleOffset - margin <= offset)
        {
            let delta = visibleOffset - offset;

            if (delta > -margin)
                delta = -margin;

            this.movePage(delta, offset, endOffset, totalCount);
        }
        else if (visibleEndOffset + margin >= endOffset)
        {
            let delta = visibleEndOffset - endOffset;

            if (delta < margin)
                delta = margin;

            this.movePage(delta, offset, endOffset, totalCount);
        }
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
        const { className, style, useIcons, onRenderRowMenu } = this.props;

        const subrowCount = this.subrowCount();
        const fullClassName = makeClassName([
            'dtable',
            useIcons ? 'dtable-has-row-icons' : null,
            onRenderRowMenu ? 'dtable-has-row-menu' : null,
            subrowCount > 1 ? 'dtable-has-subrows' : null,
            className,
        ]);

        const head = this.props.showHeader
            ? <div className="dtable-head">{ this.renderColumnHeaders() }</div>
             : null;

        return (
            <div id={this.elementId} className={fullClassName} style={style}>
                <style>{ this.renderCellStyles() }</style>
                { head }
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

        const size = height * this.rowHeightRem();
        const style = { height: `${size}rem` };

        return (
            <div key={key} className='dtable-spacer' style={style} />
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

        const { columns } = this.props;
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
            <a data-idx={rowIndex} href={url} title={title} className='dtable-row-content'>{ cells }</a>
        );

        let rowMenuButton = null;

        if (this.props.onRenderRowMenu) {
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
                        { rowMenu }
                    </DropdownButton>
                );
            }
            else {
                rowMenuButton = <Icon name='none'/>;
            }
        }

        return (
            <div key={rowIndex} className='dtable-row'>
                { icon }
                { rowContent }
                { rowMenuButton }
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
        const { columns, onRenderColumnMenu } = this.props;

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
                { this.props.onRenderColumnMenu(index) }
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
        const { columns } = this.props;
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
    showHeader: PropTypes.bool,
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
    showHeader: true,
    className: '',
    rowMenuTitle: 'Menu',
    rowMenuIconName: 'ellipses'
};
