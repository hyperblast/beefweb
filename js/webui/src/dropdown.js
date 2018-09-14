import React from 'react';
import { bindHandlers } from './utils';
import PropTypes from 'prop-types';
import { Button } from './elements';

const dropdownTarget = Symbol('dropdownTarget');

const basePropTypes = Object.freeze({
    isOpen: PropTypes.bool.isRequired,
    onRequestOpen: PropTypes.func.isRequired,
    autoHide: PropTypes.bool,
    direction: PropTypes.oneOf(['left', 'center', 'right']),
});

const baseDefaultProps = Object.freeze({
    autoHide: true,
    direction: 'right'
});

export class Dropdown extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = {};
        this.setElementRef = this.setElementRef.bind(this);

        bindHandlers(this);
    }

    handleButtonClick(e)
    {
        if (e.button !== 0)
            return;

        e.preventDefault();
        e[dropdownTarget] = this;

        this.props.onRequestOpen(!this.props.isOpen);
    }

    handleWindowClick(e)
    {
        if (e.button !== 0)
            return;

        if (this.props.autoHide && this !== e[dropdownTarget])
            this.props.onRequestOpen(false);
    }

    setElementRef(element)
    {
        if (this.element)
            this.element.removeEventListener('click', this.handleButtonClick);

        this.element = element;

        if (this.element)
            this.element.addEventListener('click', this.handleButtonClick);
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
        const { isOpen, children, direction, onRenderElement } = this.props;

        const contentClass = (
            'dropdown-content dropdown-'
            + direction
            + (isOpen ? ' active' : '')
        );

        const element = onRenderElement(this.setElementRef, isOpen);

        return (
            <div className='dropdown'>
                { element }
                <div className={contentClass}>
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
                active={isOpen} />
        );
    }

    render()
    {
        const { isOpen, onRequestOpen, autoHide, direction, children } = this.props;

        return (
            <Dropdown
                onRenderElement={this.renderElement}
                onRequestOpen={onRequestOpen}
                isOpen={isOpen}
                autoHide={autoHide}
                direction={direction}>
                { children }
            </Dropdown>
        );
    }
}

DropdownButton.propTypes = Object.assign(
    {
        title: PropTypes.string.isRequired,
        iconName: PropTypes.string.isRequired,
    },
    basePropTypes
);

DropdownButton.defaultProps = baseDefaultProps;
