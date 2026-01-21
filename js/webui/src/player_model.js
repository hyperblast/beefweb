import { debounce, clamp } from './lodash.js'
import Timer from './timer.js'
import { PlaybackState } from 'beefweb-client'
import { defaultPlayerFeatures, getPlayerFeatures } from './player_features.js';
import ModelBase from './model_base.js';
import { getColumnExpressions } from './columns.js';
import { looseDeepEqual } from './utils.js';

const playerInfoKeys = [
    'info',
    'options',
    'permissions',
    'playbackState',
    'volume'
];

const initialPlayerInfo = Object.freeze({
    features: defaultPlayerFeatures,
    info: {
        name: '',
        title: '',
        version: '0.0',
        pluginVersion: '0.0',
    },
    playbackState: PlaybackState.stopped,
    options: [],
    volume: {
        type: 'db',
        min: 0.0,
        max: 0.0,
        value: 0.0,
        isMuted: false,
    },
    activeItem: {
        playlistId: '',
        playlistIndex: -1,
        index: -1,
        position: -1,
        duration: -1,
        playbackInfoWindow: '',
        playbackInfoPanel: '',
        filePath: '',
        playlistColumns: [],
    },
    activeItemId: '',
    permissions: {
        changePlaylists: true,
        changeOutput: true,
        changeClientConfig: true
    }
});


/**
 * @class PlayerModel
 * @property {object} features
 * @property {object} info
 * @property {string} playbackState
 * @property {array} options
 * @property {object} volume
 * @property {object} activeItem
 * @property {string} activeItemId
 * @property {object} permissions
 */
export default class PlayerModel extends ModelBase
{
    constructor(client, dataSource, settingsModel)
    {
        super();

        this.client = client;
        this.dataSource = dataSource;
        this.settingsModel = settingsModel;
        this.positionTimer = new Timer(this.updatePosition.bind(this), 500);
        this.featuresInitialized = false;

        Object.assign(this, initialPlayerInfo);

        this.defineEvent('change');
        this.defineEvent('positionChange');
        this.defineEvent('trackSwitch');

        this.reload = this.reload.bind(this);
        this.reloadWithDelay = debounce(this.reload, 1000);
        this.setVolumeRemote = debounce(value => this.client.setVolume(value), 80);
    }

    start()
    {
        this.dataSource.on('player', this.update.bind(this));

        this.settingsModel.on('mediaSize', this.reload);
        this.settingsModel.on('columns', this.reload);
        this.settingsModel.on('windowTitleExpression', this.reloadWithDelay);
        this.settingsModel.on('playbackInfoExpression', this.reloadWithDelay);

        this.reload();
    }

    play()
    {
        this.client.playCurrent();
    }

    playRandom()
    {
        this.client.playRandom();
    }

    stop()
    {
        this.client.stop();
    }

    playOrPause()
    {
        this.client.playOrPause();
    }

    pause()
    {
        this.client.togglePause();
    }

    next()
    {
        this.client.next();
    }

    nextBy(expression)
    {
        this.client.next({ by: expression });
    }

    previous()
    {
        this.client.previous();
    }

    previousBy(expression)
    {
        this.client.previous({ by: expression });
    }

    mute()
    {
        const isMuted = !this.volume.isMuted;
        this.updateState('volume', { isMuted });
        this.client.setMuted(isMuted);
    }

    setVolume(value)
    {
        this.updateState('volume', { value });
        this.setVolumeRemote(value);
    }

    volumeUp()
    {
       if (this.volume.value === this.volume.max)
           return;

        this.client.volumeUp();
    }

    volumeDown()
    {
        if (this.volume.value === this.volume.min)
            return;

        this.client.volumeDown();
    }

    setPosition(value)
    {
        this.client.setPlaybackPosition(value);
    }

    setOption(id, value)
    {
        this.client.setOption(id, value);
    }

    update(playerInfo)
    {
        if (!this.featuresInitialized)
        {
            this.features = getPlayerFeatures(this.info.name);
            this.featuresInitialized = true;
        }

        const wasPlaying = this.playbackState === PlaybackState.playing;
        const oldPlaylistColumns = this.activeItem.playlistColumns;
        const [playbackInfoWindow, playbackInfoPanel, filePath, ...newPlaylistColumns] = playerInfo.activeItem.columns;
        const playlistColumns =
            looseDeepEqual(oldPlaylistColumns, newPlaylistColumns)
                ? oldPlaylistColumns
                : newPlaylistColumns;

        this.activeItem = {
            ...playerInfo.activeItem,
            playbackInfoWindow,
            playbackInfoPanel,
            filePath,
            playlistColumns,
        };

        delete this.activeItem.columns;

        console.log(this.activeItem);

        for (let key of playerInfoKeys)
            this[key] = playerInfo[key];

        if (this.playbackState === PlaybackState.playing)
            this.positionTimer.restart();
        else
            this.positionTimer.stop();

        this.emit('change');
        this.notifyTrackSwitch(wasPlaying);
    }

    reload()
    {
        const { mediaSize } = this.settingsModel;
        const { columns } = this.settingsModel.columns[mediaSize];

        this.dataSource.watch('player', {
            trcolumns: [
                this.settingsModel.windowTitleExpression,
                this.settingsModel.playbackInfoExpression,
                '%path%',
                ...getColumnExpressions(columns)
            ]
        });
    }

    updateState(key, value, eventName = 'change')
    {
        this[key] = Object.assign({}, this[key], value);
        this.emit(eventName);
    }

    updatePosition(delta)
    {
        const { position, duration } = this.activeItem;

        if (position < 0 || duration < 0)
            return;

        const newPosition = clamp(position + delta / 1000, 0, duration);

        this.updateState('activeItem', { position: newPosition }, 'positionChange');
    }

    notifyTrackSwitch(wasPlaying)
    {
        const previousItemId = this.activeItemId;
        const { playlistId, index } = this.activeItem;

        this.activeItemId = `${playlistId}:${index}`;

        if (wasPlaying &&
            this.playbackState === PlaybackState.playing &&
            this.activeItemId !== previousItemId)
        {
            this.emit('trackSwitch');
        }
    }
}
