import q from 'qunit';
import { client, outputConfigs, usePlayer } from './test_env.js';

q.module('outputs api', usePlayer());

q.test('get outputs config', async assert =>
{
   const outputs = await client.getOutputs();

   assert.ok(typeof outputs.supportsMultipleOutputTypes === 'boolean');
   assert.deepEqual(outputs.active, outputConfigs.default);
   assert.ok(Array.isArray(outputs.types));

   const type = outputs.types[0];
   assert.ok(type.id);
   assert.ok(type.name);
   assert.ok(Array.isArray(type.devices));

   const device = type.devices[0];
   assert.ok(device.id);
   assert.ok(device.name);
});

q.test('set output device', async assert =>
{
    for (const config of outputConfigs.alternate)
    {
        await client.setOutputDevice(config.typeId, config.deviceId);
        const output = (await client.getOutputs()).active;
        assert.equal(output.typeId, config.typeId);
        assert.equal(output.deviceId, config.deviceId);
    }
});
