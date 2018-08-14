import React from 'react'
import PropTypes from 'prop-types'
import { Button } from './elements';

function smartSplit(message)
{
    const position = Math.max(
        message.lastIndexOf('/'),
        message.lastIndexOf('\\'));

    if (position === -1)
        return { start: message, end: '' };

    return {
        start: message.substr(0, position),
        end: message.substr(position),
    };
}

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

    renderBox(index, item)
    {
        const { start, end } = smartSplit(item.message);

        return (
            <div key={index} className='notification-box'>
                <div className='notification-content'>
                    <div className='notification-header'>{ item.title }</div>
                    <div className='notification-text' title={item.message}>
                        <span className='notification-text-start'>{ start }</span>
                        <span className='notification-text-end'>{ end }</span>
                    </div>
                </div>
                <Button
                    name='x'
                    title='Dismiss'
                    className='notification-close-button'
                    onClick={e => this.handleCloseClick(e, index)}/>
            </div>
        );
    }

    render()
    {
        if (this.props.items.length === 0)
            return null;

        const items = this.props.items.map(
            (item, index) => this.renderBox(index, item));

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
