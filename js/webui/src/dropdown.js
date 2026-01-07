import React from 'react';
import { bindHandlers } from './utils.js';
import PropTypes from 'prop-types';
import { IconButton } from './elements.js';
import { makeClassName } from './dom_utils.js';
import { pick, throttle } from 'lodash';
import { createPortal } from 'react-dom';

const dropdownTarget = Symbol('dropdownTarget');

const basePropTypes = Object.freeze({
    isOpen: PropTypes.bool,
    onRequestOpen: PropTypes.func,
    hideOnContentClick: PropTypes.bool,
});

const baseDefaultProps = Object.freeze({
    hideOnContentClick: true
});

const dropdownMargin = 4;

function createContentElement()
{
    const element = document.createElement('div');
    const appContainer = document.getElementById('app-container');

    element.className = 'dropdown-content';
    appContainer.parentNode.insertBefore(element, appContainer);

    return element;
}

function guessPosition(toggleElement, contentElement)
{
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const contentWidth = contentElement.clientWidth;
    const contentHeight = contentElement.clientHeight;
    const { top, right, bottom, left } = toggleElement.getBoundingClientRect();

    const offsetX = left + contentWidth <= windowWidth
                    ? left
                    : right - contentWidth;

    const offsetY = bottom <= windowHeight / 2
                    ? bottom + dropdownMargin
                    : top - contentHeight - dropdownMargin;

    return [offsetX, offsetY];
}

export class Dropdown extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = { isOpen: false };
        this.offsetX = 0;
        this.offsetY = 0;
        this.contentElement = createContentElement();
        this.setToggleRef = this.setToggleRef.bind(this);

        bindHandlers(this);

        this.resizeWithDelay = throttle(this.resize.bind(this), 50);
    }

    handleToggleClick(e)
    {
        if (e.button !== 0)
            return;

        e.preventDefault();
        e[dropdownTarget] = this;

        const newState = !this.isOpen();

        if (newState)
            this.updatePosition();

        this.setOpen(newState);
    }

    handleContentClick(e)
    {
        if (e.button !== 0)
            return;

        e[dropdownTarget] = this;

        if (this.props.hideOnContentClick)
            this.setOpen(false);
    }

    handleWindowClick(e)
    {
        if (e.button !== 0)
            return;

        if (this !== e[dropdownTarget])
            this.setOpen(false);
    }

    isOpen()
    {
        return this.props.onRequestOpen ? this.props.isOpen : this.state.isOpen;
    }

    setOpen(value)
    {
        if (this.props.onRequestOpen)
            this.props.onRequestOpen(value);
        else
            this.setState({ isOpen: value });
    }

    setToggleRef(element)
    {
        this.toggleElement?.removeEventListener('click', this.handleToggleClick);
        this.toggleElement = element;
        this.toggleElement?.addEventListener('click', this.handleToggleClick);
    }

    updateElement()
    {
        const isOpen = this.isOpen();

        if (isOpen)
        {
            this.contentElement.style.left = this.offsetX + 'px';
            this.contentElement.style.top = this.offsetY + 'px';
        }

        this.contentElement.className = makeClassName([
            'dropdown-content',
            this.isOpen() ? 'dropdown-content-active' : null,
        ]);
    }

    updatePosition()
    {
        const [x, y] = guessPosition(this.toggleElement, this.contentElement);
        this.offsetX = x;
        this.offsetY = y;
    }

    resize()
    {
        if (this.isOpen())
        {
            this.updatePosition();
            this.updateElement();
        }
    }

    componentDidMount()
    {
        this.updateElement();
        this.contentElement.addEventListener('click', this.handleContentClick);
        window.addEventListener('click', this.handleWindowClick);
        window.addEventListener('resize', this.resizeWithDelay);
    }

    componentWillUnmount()
    {
        this.contentElement.removeEventListener('click', this.handleContentClick);
        this.contentElement.parentNode.removeChild(this.contentElement);
        window.removeEventListener('click', this.handleWindowClick);
        window.removeEventListener('resize', this.resizeWithDelay);
    }

    componentDidUpdate(prevProps, prevState, snapshot)
    {
        this.updateElement();
    }

    render()
    {
        const { children, onRenderElement } = this.props;

        return (
            <>
                { onRenderElement(this.setToggleRef, this.isOpen()) }
                { createPortal(children, this.contentElement) }
            </>
        );
    }
}

Dropdown.propTypes = {
    onRenderElement: PropTypes.func.isRequired,
    ...basePropTypes
};

Dropdown.defaultProps = {
    ...baseDefaultProps
};

export class DropdownButton extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = {};
        this.renderElement = this.renderElement.bind(this);
    }

    renderElement(ref, isOpen)
    {
        return (
            <IconButton
                ref={ref}
                name={this.props.iconName}
                title={this.props.title}
                active={isOpen}
                className={this.props.className} />
        );
    }

    render()
    {
        const props = pick(this.props, Object.keys(basePropTypes));

        return (
            <Dropdown onRenderElement={this.renderElement} {... props}>
                { this.props.children }
            </Dropdown>
        );
    }
}

DropdownButton.propTypes = {
    title: PropTypes.string.isRequired,
    iconName: PropTypes.string.isRequired,
    className: PropTypes.string,
    ...basePropTypes
};

DropdownButton.defaultProps = {
    ...baseDefaultProps
};

export class DropdownLink extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = {};
        this.renderElement = this.renderElement.bind(this);
    }

    renderElement(ref, isOpen)
    {
        const { title, className } = this.props;
        const fullClassName = makeClassName([className, isOpen ? 'active' : null]);

        return (
            <a
                ref={ref}
                href='#'
                title={title}
                className={fullClassName}>{ title }</a>
        );
    }

    render()
    {
        const props = pick(this.props, Object.keys(basePropTypes));

        return (
            <Dropdown onRenderElement={this.renderElement} {... props}>
                { this.props.children }
            </Dropdown>
        );
    }
}

DropdownLink.propTypes = {
    title: PropTypes.string.isRequired,
    className: PropTypes.string,
    ...basePropTypes
};

DropdownLink.defaultProps = {
    ...baseDefaultProps
};
