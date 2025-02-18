import q from 'qunit';
import { client, outputConfigs, usePlayer } from './test_env.js';

const resetOptions = {
    output: true,
};

q.module('outputs api', usePlayer({ resetOptions }));

q.test('get outputs config', async assert =>
{
   const outputs = await client.getOutputs();

   assert.ok(typeof outputs.supportsMultipleOutputTypes === 'boolean');
   assert.ok(typeof outputs.active === 'object');
   assert.equal(outputs.active.typeId, outputConfigs.default.typeId);
   assert.equal(outputs.active.deviceId, outputConfigs.default.deviceId);
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
        for (const deviceId of config.deviceIds)
        {
            try
            {
                await client.setOutputDevice(config.typeId, deviceId);
            }
            catch(error)
            {
                throw new Error(
                    `setOutputDevice error: type: ${config.typeId}; device: ${deviceId}; error: ${error.message}`);
            }

            const output = (await client.getOutputs()).active;
            assert.equal(output.typeId, config.typeId);
            assert.equal(output.deviceId, deviceId);
        }
    }
});
