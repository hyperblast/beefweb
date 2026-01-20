import { Foobar2000TestContextFactory } from './test_context_foobar2000.js'
import { DeadbeefTestContextFactory } from './test_context_deadbeef.js'
import { selectBySystem } from './utils.js';
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

function getContextFactory()
{
    const foobar2000Factory = new Foobar2000TestContextFactory();
    const deadbeefFactory = new DeadbeefTestContextFactory();

    const availableFactories = selectBySystem({
        windows: [foobar2000Factory],
        mac: [foobar2000Factory, deadbeefFactory],
        posix: [deadbeefFactory]
    });

    const playerId = process.env.BEEFWEB_TEST_PLAYER;
    if (!playerId)
        return availableFactories[0];

    const factory = availableFactories.find(f => f.playerId === playerId);
    if (!factory)
        throw new Error(`Unknown or unsupported player id: ${playerId}`);

    return factory;
}

export const context = getContextFactory().createContext();
export const tracks = context.tracks;
export const config = context.config;
export const client = context.client;
export const outputConfigs = context.outputConfigs;

export function setupPlayer(options)
{
    beforeAll(() => context.beginSuite(options));
    afterAll(() => context.endSuite());
    beforeEach(() => context.beginTest());
    afterEach(() => context.endTest());
}
