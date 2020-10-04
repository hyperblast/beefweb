import PlayerModel from './player_model';
import silenceMp3 from './5-seconds-of-silence.mp3';

export default class MediaSessionController {
    /**
     * @param {PlayerModel} playerModel
     */
    constructor(playerModel) {
        this.playerModel = playerModel;
    }

    isSupported() {
        return 'mediaSession' in navigator;
    }

    /**
     * @returns {HTMLAudioElement}
     */
    getAudioElement() {
        return document.getElementById('silence');
    }

    start() {
        if (!this.isSupported()) {
            return;
        }

        this.isStopped = false;

        navigator.mediaSession.setActionHandler('play', () =>
            this.playerModel.play()
        );
        navigator.mediaSession.setActionHandler('pause', () =>
            this.playerModel.pause()
        );
        navigator.mediaSession.setActionHandler('previoustrack', () =>
            this.playerModel.previous()
        );
        navigator.mediaSession.setActionHandler('nexttrack', () =>
            this.playerModel.next()
        );

        this.playerModel.on('change', () => this.update());

        this.update();
    }

    stop() {
        if (!this.isSupported()) {
            return;
        }

        this.isStopped = true;

        navigator.mediaSession.playbackState = 'none';
        this.getAudioElement().pause();

        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
    }

    update() {
        if (this.isStopped) {
            return true;
        }

        const playbackStateMap = {
            playing: 'playing',
            paused: 'paused',
            stopped: 'none',
        };

        switch (this.playerModel.playbackState) {
            case 'playing':
                this.getAudioElement().play();
                break;
            case 'paused':
                this.getAudioElement().pause();
                break;
            default:
                break;
        }

        navigator.mediaSession.playbackState =
            playbackStateMap[this.playerModel.playbackState];

        const { activeItem } = this.playerModel;
        const [, , artist, album, title] = activeItem.columns;

        navigator.mediaSession.metadata = new MediaMetadata({
            artist,
            album,
            title,
        });
    }
}
