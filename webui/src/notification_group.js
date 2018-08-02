import React from 'react'
import PropTypes from 'prop-types'
import { Button, Icon } from './elements';

export default class NotificationGroup extends React.PureComponent
{
    constructor(props)
    {
        super(props);
    }

    handleCloseClick(e, index)
    {
        e.preventDefault();

        this.props.onCloseQuery(index);
    }

    render()
    {
        if (this.props.items.length === 0)
            return null;

        const items = this.props.items.map((text, index) => (
            <div id={index} className='notification-box'>
                <div className='notification-text' title={text}>{ text }</div>
                <Button
                    name='x'
                    onClick={e => this.handleCloseClick(e, index)}/>
            </div>
        ));

        return (
            <div className='notification-group'>
                { items }
            </div>
        );
    }
}

NotificationGroup.propTypes = {
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
    onCloseQuery: PropTypes.func.isRequired,
};