import React from 'react'
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'
import sum from 'lodash/sum'
import { Icon } from './elements';
import { mapRange, once } from './utils'
import { addStyleSheet, generateElementId, getFontSize, getScrollBarSize, makeClassName } from './dom_utils'
import ScrollManager from './scroll_manager';
import { DropdownButton, DropdownLink } from './dropdown';

const maxColumns = 100;
const rowHeight = 1.75;

function pixelToRow(px, fontSize)
{
    return (px / (fontSize * rowHeight)) | 0;
}

function rowToPixel(row, fontSize)
{
    return (row * rowHeight * fontSize) | 0;
}

const addGeneratedStyles = once(() =>
{
    const margin = getScrollBarSize();

    addStyleSheet(`.dtable-head { margin-right: ${margin}px }`);
});

const cellClassNames = mapRange(
    0, maxColumns, value => `dtable-cell dtable-column${value}`);

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
        addGeneratedStyles();

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
                this.body.scrollTop = rowToPixel(offsetItem, getFontSize());
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
        const visibleOffset = pixelToRow(this.body.scrollTop, fontSize);
        const visibleCount = pixelToRow(this.body.offsetHeight, fontSize);
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
        if (e.target.getAttribute('href') !== '#')
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

        const index = e.target.getAttribute('data-idx');
        if (!index)
            return;

        handler(Number(index));
    }

    render()
    {
        addGeneratedStyles();

        const { className, style, useIcons, onRenderRowMenu } = this.props;
        const { elementId } = this.state;

        const fullClassName = makeClassName([
            'dtable',
            useIcons ? 'dtable-has-row-icons' : null,
            onRenderRowMenu ? 'dtable-has-row-menu' : null,
            className
        ]);

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

        const style = { height: `${height * rowHeight}rem` };

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
        {
            cells.push(
                <Icon
                    key='icon'
                    name={rowData.icon}
                    className='dtable-row-icon' />
            );
        }

        for (let columnIndex = 0; columnIndex < columns.length; columnIndex++)
        {
            const value = columns[columnIndex];

            cells.push(
                <a
                    key={columnIndex}
                    data-idx={rowIndex}
                    href={url}
                    title={value}
                    className={cellClassNames[columnIndex]}>{value}</a>
            );
        }

        if (this.props.onRenderRowMenu) {
            const rowMenu = this.props.onRenderRowMenu(rowIndex);
            if (rowMenu)
            {
                cells.push(
                    <DropdownButton
                        key='menu'
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
        const render = this.props.onRenderColumnMenu
            ? this.renderColumnHeaderWithMenu
            : this.renderColumnHeaderSimple;

        return this.props.columnNames.map(render);
    }

    renderColumnHeaderSimple(name, index)
    {
        const className = `dtable-column-header dtable-column-header-text dtable-column${index}`;

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
                className={`dtable-column-header dtable-column${index}`}
                linkClassName='dtable-column-header-text dtable-column-header-link'
                isOpen={this.state.columnMenuIndex === index}
                onRequestOpen={o => this.openColumnMenu(index, o)}>
                { this.props.onRenderColumnMenu(index) }
            </DropdownLink>
        );
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
    columnNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    columnSizes: PropTypes.arrayOf(PropTypes.number),

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
    className: '',
    rowMenuTitle: 'Menu',
    rowMenuIconName: 'menu'
};
