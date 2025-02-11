import EventEmitter from 'wolfy87-eventemitter';

class PlayQueueMap
{
    getQueueIndices(playlistId, itemIndex)
    {
        const playlistMap = this.playlists.get(playlistId);
        if (playlistMap === undefined)
        {
            return null;
        }

        const indices = playlistMap.get(itemIndex);
        return indices === undefined ? null : indices;
    }

    constructor(items)
    {
        this.playlists = new Map();

        let queueIndex = 1;

        for (let queueItem of items)
        {
            let playlistMap = this.playlists.get(queueItem.playlistId);
            if (playlistMap === undefined)
            {
                playlistMap = new Map();
                this.playlists.set(queueItem.playlistId, playlistMap);
            }

            let queueIndices = playlistMap.get(queueItem.itemIndex);
            if (queueIndices === undefined)
            {
                queueIndices = [];
                playlistMap.set(queueItem.itemIndex, queueIndices);
            }

            queueIndices.push(queueIndex);
            queueIndex++;
        }
    }
}

export default class PlayQueueModel extends EventEmitter
{
    constructor(client, dataSource)
    {
        super();

        this.client = client;
        this.dataSource = dataSource;
        this.queue = [];
        this.queueMap = new PlayQueueMap(this.queue);

        this.defineEvent('change');
    }

    start()
    {
        this.dataSource.on('playQueue', this.update.bind(this));
        this.dataSource.watch('playQueue');
    }

    update(queue)
    {
        this.queue = queue;
        this.queueMap = new PlayQueueMap(queue);
        this.emit('change');
    }

    addToQueue(playlist, index)
    {
        this.client.addToPlayQueue(playlist, index);
    }

    removeFromQueue(playlist, index)
    {
        this.client.removeFromPlayQueueByItemIndex(playlist, index);
    }
}