import React, { PureComponent } from 'react';
import { IconButton } from './elements.js';
import ModelBinding from './model_binding.js';
import ServiceContext from './service_context.js';

function smartSplit(message)
{
    const position = Math.max(
        message.lastIndexOf('/'),
        message.lastIndexOf('\\'));

    if (position === -1)
        return { start: message, end: '' };

    return {
        start: message.substring(0, position),
        end: message.substring(position),
    };
}

class NotificationContainer_ extends PureComponent
{
    static contextType = ServiceContext;

    constructor(props, context)
    {
        super(props, context);

        this.state = this.getStateFromModel();
    }

    getStateFromModel()
    {
        const { items } = this.context.notificationModel;
        return { items };
    }

    handleClose(id)
    {
        this.context.notificationModel.close(id);
    }

    renderBox(item)
    {
        const { start, end } = smartSplit(item.message);

        return (
            <div key={item.id} className='notification-box'>
                <div className='notification-content'>
                    <div className='notification-header'>{ item.title }</div>
                    <div className='notification-text' title={item.message}>
                        <span className='notification-text-start'>{ start }</span>
                        <span className='notification-text-end'>{ end }</span>
                    </div>
                </div>
                <IconButton
                    name='x'
                    title='Dismiss'
                    className='notification-close-button'
                    onClick={() => this.handleClose(item.id)}/>
            </div>
        );
    }

    render()
    {
        if (this.state.items.length === 0)
            return null;

        return (
            <div className='notification-container'>
                { this.state.items.map(item => this.renderBox(item)) }
            </div>
        );
    }
}

export const NotificationContainer = ModelBinding(NotificationContainer_, {
    notificationModel: 'change'
});
