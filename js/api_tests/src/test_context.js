import os from 'os';
import Foobar2000TestContext from './foobar2000/test_context.js'
import DeadbeefTestContext from './deadbeef/test_context.js'

function getContextType()
{
    switch (os.type())
    {
    case 'Windows_NT':
        return Foobar2000TestContext;

    default:
        return DeadbeefTestContext;
    }
}

const TestContext = getContextType();
const context = new TestContext();
export default context;
