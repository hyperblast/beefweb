'use strict';

const os = require('os');

function getContextType()
{
    switch (os.type())
    {
    case 'Windows_NT':
        return require('./foobar2000/test_context');

    default:
        return require('./deadbeef/test_context');
    }
}

const TestContext = getContextType();

module.exports = new TestContext();
