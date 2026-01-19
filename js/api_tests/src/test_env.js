import { Foobar2000TestContextFactory } from './foobar2000/test_context.js'
import { DeadbeefTestContextFactory } from './deadbeef/test_context.js'
import { selectBySystem } from './utils.js';
import qunit from 'qunit'

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

export function usePlayer(options)
{
    return {
        before: () => context.beginSuite(options),
        after: () => context.endSuite(),
        beforeEach: () => context.beginTest(),
        afterEach: () => context.endTest(),
    };
}

const maxFailedTests = 10;
let failedTests = 0;

qunit.on('testEnd', event => {
    if (event.status !== 'failed')
        return;

    if (++failedTests < maxFailedTests)
        return;

    console.error('Too many test failures, stopping');
    qunit.config.queue.length = 0;
});
