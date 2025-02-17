import EventEmitter from 'wolfy87-eventemitter';

export default class OutputSettingsModel extends EventEmitter
{
    constructor(client, dataSource)
    {
        super();

        this.client = client;
        this.dataSource = dataSource;

        this.supportsMultipleOutputTypes = false;
        this.outputTypes = [];
        this.activeOutput = {};
        this.selectedOutputType = { devices: [] };
        this.selectedOutputDevice = '';

        this.defineEvent('change');
    }

    start()
    {
        this.dataSource.on('outputs', this.update.bind(this));
        this.dataSource.watch('outputs');
    }

    update(outputs)
    {
        this.supportsMultipleOutputTypes = outputs.supportsMultipleOutputTypes;
        this.outputTypes = outputs.types;
        this.activeOutput = outputs.active;

        const oldOutputTypeId = this.selectedOutputType.id;

        if (oldOutputTypeId)
        {
            this.selectedOutputType = this.findOutputType(oldOutputTypeId)
                || this.findOutputType(this.activeOutput.typeId);
        }
        else
        {
            this.selectedOutputType = this.findOutputType(this.activeOutput.typeId);
        }

        if (oldOutputTypeId !== this.selectedOutputType.id)
            this.selectedOutputDevice = this.activeOutput.deviceId;

        this.emit('change');
    }

    findOutputType(typeId)
    {
        for (let type of this.outputTypes)
        {
            if (type.id === typeId)
                return type;
        }

        return null;
    }

    findOutputDevice(deviceId)
    {
        for (let device of this.selectedOutputType.devices)
        {
            if (device.id === deviceId)
            {
                return deviceId;
            }
        }

        return null;
    }

    setOutputType(typeId)
    {
        if (this.selectedOutputType.id === typeId)
            return;

        this.selectedOutputType = this.findOutputType(typeId);
        this.selectedOutputDevice = this.findOutputDevice('default') || this.selectedOutputType.devices[0].id;
        this.emit('change');
    }

    setOutputDevice(deviceId)
    {
        if (this.selectedOutputDevice === deviceId)
            return;

        this.selectedOutputDevice = deviceId;
        this.emit('change');
    }

    apply()
    {
        if (!this.selectedOutputType || !this.selectedOutputDevice)
            throw new Error('No output is selected');

        this.client.setOutputDevice(this.selectedOutputType.id, this.selectedOutputDevice);
    }

    revert()
    {
        this.selectedOutputType = this.findOutputType(this.activeOutput.typeId);
        this.selectedOutputDevice = this.activeOutput.deviceId;
        this.emit('change');
    }
}
