import PlayerModel from './player_model';
import silenceMp3 from './5-seconds-of-silence.mp3';

export default class MediaSessionController {
    /**
     * @param {PlayerModel} playerModel
     */
    constructor(playerModel) {
        this.playerModel = playerModel;
    }

    start() {
        if (!'mediaSession' in navigator) {
            return;
        }

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

    update() {
        const playbackStateMap = {
            playing: 'playing',
            paused: 'paused',
            stopped: 'none',
        };

        const audioElement = document.getElementById('silence');

        switch (this.playerModel.playbackState) {
            case 'playing':
                audioElement.play();
                break;
            case 'paused':
                audioElement.pause();
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
