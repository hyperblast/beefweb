import path from 'path';
import { PlayerId, TestContextFactory } from '../test_context.js';
import PlayerController from './player_controller.js';

export class DeadbeefTestContextFactory extends TestContextFactory
{
    constructor()
    {
        super();
        this.playerId = PlayerId.deadbeef;
    }

    createOutputConfigs()
    {
        return {
            default: { typeId: 'nullout2', deviceId: 'default' },
            alternate: [
                { typeId: 'nullout', deviceId: 'default' },
                { typeId: 'alsa', deviceId: 'null' },
            ],
        }
    }

    createPlayer(config)
    {
        return new PlayerController(config);
    }
}
