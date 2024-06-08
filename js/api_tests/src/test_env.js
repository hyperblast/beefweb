import os from 'os';
import { Foobar2000TestContextFactory } from './foobar2000/test_context.js'
import { DeadbeefTestContextFactory } from './deadbeef/test_context.js'

function getContextFactory()
{
    switch (os.type())
    {
    case 'Windows_NT':
        return new Foobar2000TestContextFactory();

    default:
        return new DeadbeefTestContextFactory();
    }
}

export const context = getContextFactory().createContext();
export const tracks = context.tracks;
export const config = context.config;
export const client = context.client;

export function usePlayer(options)
{
    return {
        before: () => context.beginSuite(options),
        after: () => context.endSuite(),
        beforeEach: () => context.beginTest(),
        afterEach: () => context.endTest(),
    };
}