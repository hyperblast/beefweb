import React from 'react';
import { bindHandlers } from './utils.js';
import PropTypes from 'prop-types';
import { Button } from './elements.js';
import { makeClassName } from './dom_utils.js';
import { pick } from 'lodash';

const dropdownTarget = Symbol('dropdownTarget');

const basePropTypes = Object.freeze({
    className: PropTypes.string,
    isOpen: PropTypes.bool.isRequired,
    onRequestOpen: PropTypes.func.isRequired,
    hideOnContentClick: PropTypes.bool,
    direction: PropTypes.oneOf(['left', 'center', 'right', 'top-right']),
    up: PropTypes.bool,
});

const baseDefaultProps = Object.freeze({
    hideOnContentClick: true,
    direction: 'right',
    up: false,
});

export class Dropdown extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = {};
        this.setToggleRef = this.setToggleRef.bind(this);
        this.setContentRef = this.setContentRef.bind(this);

        bindHandlers(this);
    }

    handleToggleClick(e)
    {
        if (e.button !== 0)
            return;

        e.preventDefault();
        e[dropdownTarget] = this;

        this.props.onRequestOpen(!this.props.isOpen);
    }

    handleContentClick(e)
    {
        if (e.button !== 0)
            return;

        e[dropdownTarget] = this;

        if (this.props.hideOnContentClick)
            this.props.onRequestOpen(false);
    }

    handleWindowClick(e)
    {
        if (e.button !== 0)
            return;

        if (this !== e[dropdownTarget])
            this.props.onRequestOpen(false);
    }

    setToggleRef(element)
    {
        if (this.toggleElement)
            this.toggleElement.removeEventListener('click', this.handleToggleClick);

        this.toggleElement = element;

        if (this.toggleElement)
            this.toggleElement.addEventListener('click', this.handleToggleClick);
    }

    setContentRef(element)
    {
        if (this.contentElement)
            this.contentElement.removeEventListener('click', this.handleContentClick);

        this.contentElement = element;

        if (this.contentElement)
            this.contentElement.addEventListener('click', this.handleContentClick);
    }

    componentDidMount()
    {
        window.addEventListener('click', this.handleWindowClick);
    }

    componentWillUnmount()
    {
        window.removeEventListener('click', this.handleWindowClick);
    }

    render()
    {
        const { isOpen, children, direction, onRenderElement, className, up } = this.props;

        const dropdownClass = makeClassName([ 'dropdown', className ]);
        const contentClass = makeClassName([
            'dropdown-content',
            'dropdown-' + direction,
            up ? 'dropdown-up' : null,
            isOpen ? 'active' : ''
        ]);

        const element = onRenderElement(this.setToggleRef, isOpen);

        return (
            <div className={dropdownClass}>
                { element }
                <div ref={this.setContentRef} className={contentClass}>
                    {children}
                </div>
            </div>
        );
    }
}

Dropdown.propTypes = Object.assign(
    { onRenderElement: PropTypes.func.isRequired },
    basePropTypes
);

Dropdown.defaultProps = baseDefaultProps;

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
            <Button
                ref={ref}
                name={this.props.iconName}
                title={this.props.title}
                active={isOpen}
                className={this.props.buttonClassName} />
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

DropdownButton.propTypes = Object.assign(
    {
        title: PropTypes.string.isRequired,
        iconName: PropTypes.string.isRequired,
        buttonClassName: PropTypes.string,
    },
    basePropTypes
);

DropdownButton.defaultProps = baseDefaultProps;

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
        const { title, linkClassName } = this.props;
        const fullClassName = makeClassName([linkClassName, isOpen ? 'active' : null]);

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

DropdownLink.propTypes = Object.assign(
    {
        title: PropTypes.string.isRequired,
        linkClassName: PropTypes.string,
    },
    basePropTypes
);

DropdownLink.defaultProps = baseDefaultProps;
