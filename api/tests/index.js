const PlayerController = require('./player_controller');

async function runPlayer()
{
    const player = new PlayerController();

    await player.start();

    console.log(player);

    await player.stop();
}

runPlayer();