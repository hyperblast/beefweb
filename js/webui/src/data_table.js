import React from 'react'
import PropTypes from 'prop-types'
import { throttle } from 'lodash'
import { sum } from 'lodash'
import { Icon } from './elements.js';
import { mapRange, once } from './utils.js'
import { generateElementId, getFontSize, getScrollBarWidth, makeClassName } from './dom_utils.js'
import ScrollManager from './scroll_manager.js';
import { DropdownButton, DropdownLink } from './dropdown.js';

const maxColumns = 100;
const rowHeight = 1.75;

const setScrollBarWidthVariable = once(() =>
{
    const width = getScrollBarWidth();
    document.documentElement.style.setProperty('--dtable-scroll-bar-width', `${width}px`);
});

const cellClassNames = mapRange(
    0, maxColumns, value => `dtable-cell dtable-cell${value}`);

export default class DataTable extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = { elementId: generateElementId('dtable'), columnMenuIndex: -1, rowMenuIndex: -1 };
        this.setBodyRef = this.setBodyRef.bind(this);
        this.handleScroll = throttle(this.handleScroll.bind(this), 50);
        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.renderColumnHeaderSimple = this.renderColumnHeaderSimple.bind(this);
        this.renderColumnHeaderWithMenu = this.renderColumnHeaderWithMenu.bind(this);
    }

    componentDidMount()
    {
        setScrollBarWidthVariable();

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

    pixelsPerRow(fontSize)
    {
        return fontSize * rowHeight * (this.props.verticalColumns ? this.props.columnCount : 1);
    }

    pixelToRow(px, fontSize)
    {
        return (px / this.pixelsPerRow(fontSize)) | 0;
    }

    rowToPixel(row, fontSize)
    {
        return (row * this.pixelsPerRow(fontSize)) | 0;
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
        setScrollBarWidthVariable();

        const { className, style, useIcons, onRenderRowMenu } = this.props;
        const { elementId } = this.state;

        const fullClassName = makeClassName([
            'dtable',
            useIcons ? 'dtable-has-row-icons' : null,
            onRenderRowMenu ? 'dtable-has-row-menu' : null,
            className
        ]);

        let columnStyles = null;
        let tableHeader = null;

        if (!this.props.verticalColumns)
        {
            columnStyles = <style>
                { this.renderStyles() }
            </style>;

            tableHeader = <div className='dtable-head'>
                { this.renderColumnHeaders() }
            </div>
        }

        return (
            <div id={elementId} className={fullClassName} style={style}>
                { columnStyles }
                { tableHeader }
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

        const subrows = this.props.verticalColumns ? this.props.columnCount : 1;
        const style = { height: `${height * rowHeight * subrows}rem` };

        return (
            <div key={key} className='dtable-spacer' style={style} />
        );
    }

    renderRow(rowIndex, rowData, rowClassName)
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

        const url = rowData.url || '#';
        const cells = rowData.columns;

        const rowContent = (
            <a
                data-idx={rowIndex}
                href={url}
                title={cells[0]}
                className='dtable-row-content'>
                { cells.map(((value, index) => <span key={index} className={cellClassNames[index]}>{value}</span>)) }
            </a>
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
                        direction='left'
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
            <div key={rowIndex} className={rowClassName}>
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
        const rowClassName = makeClassName([
            'dtable-row',
            this.props.verticalColumns ? 'dtable-row-vertical' : 'dtable-row-horizontal']);

        rows.push(this.renderSpacer('header', offset));

        for (let i = offset; i < endOffset; i++)
            rows.push(this.renderRow(i, data[i - offset], rowClassName));

        rows.push(this.renderSpacer('footer', totalCount - endOffset));

        return rows;
    }

    renderColumnHeaders()
    {
        const render = this.props.onRenderColumnMenu
            ? this.renderColumnHeaderWithMenu
            : this.renderColumnHeaderSimple;

        return this.props.columnNames.map(render);
    }

    renderColumnHeaderSimple(name, index)
    {
        const className = `dtable-column-header dtable-column-header-text dtable-cell${index}`;

        return (
            <span
                key={index}
                title={name}
                className={className}>{name}</span>
        );
    }

    renderColumnHeaderWithMenu(name, index)
    {
        const direction = index === this.props.columnNames.length - 1
            ? 'left'
            : 'right';

        return (
            <DropdownLink
                key={index}
                title={name}
                direction={direction}
                className={`dtable-column-header dtable-cell${index}`}
                linkClassName='dtable-column-header-text dtable-column-header-link'
                isOpen={this.state.columnMenuIndex === index}
                onRequestOpen={o => this.openColumnMenu(index, o)}>
                { this.props.onRenderColumnMenu(index) }
            </DropdownLink>
        );
    }

    renderColumnStyle(index, size)
    {
        return `#${this.state.elementId} .dtable-cell${index} { width: ${size * 100}%; }`;
    }

    renderStyles()
    {
        const { columnNames, columnSizes } = this.props;

        let styles;

        if (columnSizes)
        {
            const totalSize = sum(columnSizes);

            styles = columnSizes.map((size, index) => (
                this.renderColumnStyle(index, size / totalSize)));
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
    columnCount: PropTypes.number.isRequired,
    columnNames: PropTypes.arrayOf(PropTypes.string),
    columnSizes: PropTypes.arrayOf(PropTypes.number),
    verticalColumns: PropTypes.bool,

    globalKey: PropTypes.string,
    scrollManager: PropTypes.instanceOf(ScrollManager),

    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    offset: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    totalCount: PropTypes.number.isRequired,

    useIcons: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
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
    verticalColumns: false,
    className: '',
    rowMenuTitle: 'Menu',
    rowMenuIconName: 'ellipses'
};
