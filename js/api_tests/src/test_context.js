import os from 'os';

async function getContextType()
{
    switch (os.type())
    {
    case 'Windows_NT':
        return await import('./foobar2000/test_context.js');

    default:
        return await import('./deadbeef/test_context.js');
    }
}

const TestContext = await getContextType();

export default new TestContext();
