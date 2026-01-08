import { arrayRemove } from './utils.js';
import Timer from './timer.js';
import ModelBase from './model_base.js';

const maxNotifications = 5;
const timeToLive = 3000;

export class NotificationModel extends ModelBase
{
    constructor()
    {
        super();

        this.items = [];
        this.timer = new Timer(this.removeStaleItems.bind(this), timeToLive / 2);
        this.nextItemId = 0;
        this.defineEvent('change');
    }

    start()
    {
        this.timer.restart();
    }

    notifyAddItem(path)
    {
        this.notify('Adding track:', path);
    }

    notifyAddDirectory(path)
    {
        this.notify('Adding directory:', path);
    }

    notify(title, message)
    {
        const items = [...this.items];

        if (items.length >= maxNotifications)
            items.splice(0, 1);

        items.push({
            id: this.nextItemId++,
            timeout: Date.now() + timeToLive,
            title,
            message,
        });

        this.items = items;
        this.emit('change');
    }

    close(id)
    {
        const index = this.items.findIndex(item => item.id === id);
        if (index < 0)
            return;

        this.items = arrayRemove(this.items, index);
        this.emit('change');
    }

    removeStaleItems(delta, now)
    {
        const isAlive = i => i.timeout >= now;

        if (this.items.every(isAlive))
            return;

        this.items = this.items.filter(isAlive);
        this.emit('change');
    }
}
