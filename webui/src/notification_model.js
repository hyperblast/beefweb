import React from 'react';
import ReactDom from 'react-dom'
import NotificationGroup from './notification_group'
import { bindHandlers } from './utils';
import Timer from './timer';

const maxNotifications = 5;
const timeToLive = 3000;

export default class NotificationModel
{
    constructor()
    {
        this.items = [];

        bindHandlers(this);

        this.timer = new Timer(this.handleTimeout, timeToLive / 2);
    }

    notifyAddItem(path)
    {
        this.notify(`Adding track ${path}`);
    }

    notifyAddDirectory(path)
    {
        this.notify(`Adding directory ${path}`);
    }

    notify(message)
    {
        if (this.items.length >= maxNotifications)
            this.items.splice(0, 1);

        this.items.push({ message, timeout: Date.now() + timeToLive });
        this.update();
    }

    load()
    {
        this.container = document.getElementById('notification-container');
    }

    start()
    {
        this.timer.restart();
    }

    handleCloseQuery(index)
    {
        this.items.splice(index, 1);
        this.update();
    }

    handleTimeout(delta, now)
    {
        const isAlive = i => i.timeout >= now;

        if (this.items.every(isAlive))
            return;

        this.items = this.items.filter(isAlive);
        this.update();
    }

    update()
    {
        const items = this.items.map(i => i.message);

        const box = (
            <NotificationGroup
                items={items}
                onCloseQuery={this.handleCloseQuery} />
        );

        ReactDom.render(box, this.container);
    }
}
