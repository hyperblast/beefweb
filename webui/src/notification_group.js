import React from 'react'
import PropTypes from 'prop-types'
import { Button, Icon } from './elements';

export default class NotificationGroup extends React.Component
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

        const items = this.props.items.map((item, index) => (
            <div id={index} className='notification-box'>
                <div className='notification-text'>
                    { item.title }<br/>{ item.message }
                </div>
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

const notificationType = PropTypes.shape({
    title: PropTypes.string,
    message: PropTypes.string,
});

NotificationGroup.propTypes = {
    items: PropTypes.arrayOf(notificationType).isRequired,
    onCloseQuery: PropTypes.func.isRequired,
};
