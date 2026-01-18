import path from 'path';
import { PlayerId, TestContextFactory } from '../test_context.js';
import PlayerController from './player_controller.js';

export class Foobar2000TestContextFactory extends TestContextFactory
{
    constructor()
    {
        super();
        this.playerId = PlayerId.foobar2000;
    }

    createOutputConfigs()
    {
        return {
            default: {
                // Null Output
                typeId: 'output',
                deviceId: 'EEEB07DE-C2C8-44C2-985C-C85856D96DA1:5243F9AD-C84F-4723-8194-0788FC021BCC'
            },

            alternate: [
                {
                    // Primary Sound Driver
                    typeId: 'output',
                    deviceId: 'D41D2423-FBB0-4635-B233-7054F79814AB:00000000-0000-0000-0000-000000000000'
                }
            ]
        }
    }

    createPlayer(config)
    {
        return new PlayerController(config);
    }
}
