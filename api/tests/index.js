const PlayerController = require('./player_controller');

function runPlayer()
{
    const player = new PlayerController();

    player.start();

    console.log(player);
}

runPlayer();