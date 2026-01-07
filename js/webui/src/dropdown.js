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
        this.setToggleRef = this.setToggleRef.bind(this);

        bindHandlers(this);

        this.throttledResize = throttle(this.resize.bind(this), 50);
    }

    handleToggleClick(e)
    {
        if (e.button !== 0)
            return;

        e.preventDefault();
        e[dropdownTarget] = this;
        this.setOpen(!this.isOpen());
    }

    handleContentClick(e)
    {
        if (e.button !== 0)
            return;

        e[dropdownTarget] = this;

        if (this.props.hideOnContentClick)
            setTimeout(() => this.setOpen(false), 0);
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

    createContentElement()
    {
        if (this.contentElement)
            return;

        this.contentElement = createContentElement();
        this.contentElement.addEventListener('click', this.handleContentClick);
    }

    destroyContentElement()
    {
        if (!this.contentElement)
            return;

        this.contentElement.removeEventListener('click', this.handleContentClick);
        this.contentElement.parentNode.removeChild(this.contentElement);
        this.contentElement = null;
    }

    updateContentElement()
    {
        if (!this.contentElement)
            return;

        const [x, y] = guessPosition(this.toggleElement, this.contentElement);
        this.contentElement.style.left = x + 'px';
        this.contentElement.style.top = y + 'px';
        this.contentElement.className = 'dropdown-content dropdown-content-active';
    }

    resize()
    {
        if (this.isOpen())
            this.updateContentElement();
    }

    componentDidMount()
    {
        window.addEventListener('resize', this.throttledResize);
        window.addEventListener('click', this.handleWindowClick);
    }

    componentWillUnmount()
    {
        window.removeEventListener('resize', this.throttledResize);
        window.removeEventListener('click', this.handleWindowClick);
        this.destroyContentElement();
    }

    componentDidUpdate(prevProps, prevState, snapshot)
    {
        if (this.isOpen())
            this.updateContentElement();
        else
            this.destroyContentElement();
    }

    render()
    {
        const { children, onRenderElement } = this.props;
        const isOpen = this.isOpen();

        if (isOpen)
            this.createContentElement();

        return (
            <>
                { onRenderElement(this.setToggleRef, isOpen) }
                { isOpen ? createPortal(children, this.contentElement) : null }
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
