import DataSource from "./data_source";
import PlayerModel from "./player_model";
import silenceMp3 from "./5-seconds-of-silence.mp3";

export default class MediaSessionController {
  /**
   * @param {any} client
   * @param {PlayerModel} playerModel
   */
  constructor(client, playerModel) {
    this.dataSource = new DataSource(client);
    this.playerModel = playerModel;
  }

  start() {
    if (!"mediaSession" in navigator) {
      return;
    }

    navigator.mediaSession.setActionHandler("play", () =>
      this.playerModel.play()
    );
    navigator.mediaSession.setActionHandler("pause", () =>
      this.playerModel.pause()
    );
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      this.playerModel.previous()
    );
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      this.playerModel.next()
    );

    this.dataSource.on("player", (player) => this.updateMetadata(player));
    this.dataSource.watch("player", {
      trcolumns: ["%artist%", "%album%", "%title%"],
    });

    this.playerModel.on("change", () => this.updatePlaybackState());

    this.updatePlaybackState();
    this.dataSource.start();
  }

  updatePlaybackState() {
    const playbackStateMap = {
      playing: "playing",
      paused: "paused",
      stopped: "none",
    };

    const audioElement = document.getElementById("silence");

    switch (this.playerModel.playbackState) {
      case "playing":
        audioElement.play();
        break;
      case "paused":
        audioElement.pause();
        break;
      default:
        break;
    }

    navigator.mediaSession.playbackState =
      playbackStateMap[this.playerModel.playbackState];
  }

  updateMetadata(player) {
    const { activeItem } = player;
    const [artist, album, title] = activeItem.columns;

    navigator.mediaSession.metadata = new MediaMetadata({
      artist,
      album,
      title,
    });
  }
}
