import React from 'react';
import { bindHandlers } from './utils';
import PropTypes from 'prop-types';
import { Button } from './elements';

const DropdownSource = Symbol('DropdownSource');

export class DropdownButton extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = {};
        this.setButtonRef = this.setButtonRef.bind(this);

        bindHandlers(this);
    }

    handleButtonClick(e)
    {
        if (e.button !== 0)
            return;

        e.preventDefault();
        e[DropdownSource] = this;

        this.props.onRequestOpen(!this.props.isOpen);
    }

    handleWindowClick(e)
    {
        if (e.button !== 0)
            return;

        if (this.props.autoHide && this !== e[DropdownSource])
            this.props.onRequestOpen(false);
    }

    setButtonRef(button)
    {
        if (this.button)
            this.button.removeEventListener('click', this.handleButtonClick);

        this.button = button;

        if (this.button)
            this.button.addEventListener('click', this.handleButtonClick);
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
        const { isOpen, title, iconName, children, direction } = this.props;

        const contentClass = (
            'dropdown-content dropdown-'
            + direction
            + (isOpen ? ' active' : '')
        );

        return (
            <div className='dropdown'>
                <Button
                    ref={this.setButtonRef}
                    name={iconName}
                    title={title}
                    active={isOpen} />
                <div className={contentClass}>
                    {children}
                </div>
            </div>
        );
    }
}

DropdownButton.propTypes = {
    title: PropTypes.string.isRequired,
    iconName: PropTypes.string.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onRequestOpen: PropTypes.func.isRequired,
    autoHide: PropTypes.bool,
    direction: PropTypes.oneOf(['left', 'center', 'right']),
};

DropdownButton.defaultProps = {
    autoHide: true,
    direction: 'right'
};