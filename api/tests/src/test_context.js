'use strict';

const os = require('os');

function getContextType()
{
    switch (os.type())
    {
    case 'Windows_NT':
        throw new Error('Not implemented');

    default:
        return require('./deadbeef/test_context');
    }
}

const TestContext = getContextType();

module.exports = new TestContext();
