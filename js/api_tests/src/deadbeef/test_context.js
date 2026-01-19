import { PlayerId, TestContextFactory } from '../test_context.js';
import PlayerController from './player_controller.js';
import { isLinux } from '../utils.js';

export class DeadbeefTestContextFactory extends TestContextFactory
{
    constructor()
    {
        super();
        this.playerId = PlayerId.deadbeef;
    }

    createOutputConfigs()
    {
        const result = {
            default: { typeId: 'nullout2', deviceId: 'default' },
            alternate: [
                { typeId: 'nullout', deviceId: 'default' }
            ],
        };

        if (isLinux)
            result.alternate.push({ typeId: 'alsa', deviceId: 'null' });

        return result;
    }

    createPlayer(config)
    {
        return new PlayerController(config);
    }
}
