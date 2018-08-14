import React from 'react'

const eventBindings = Symbol('eventBindings');

function forEachEvent(component, callback)
{
    const bindings = component[eventBindings];

    for (let modelKey of Object.keys(bindings))
    {
        const event = bindings[modelKey];

        if (Array.isArray(event))
        {
            for (let item of event)
                callback(modelKey, item);
        }
        else if (typeof event === 'string')
            callback(modelKey, event);
        else
            throw Error(`Invalid event name or event list for model '${modelKey}': '${event}'`);
    }
}

export default class Component extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.handleModelUpdate = this.handleModelUpdate.bind(this);
    }

    updateOn(bindings)
    {
        if (this[eventBindings])
            throw Error('Event bindings are already specified');

        this[eventBindings] = Object.freeze(bindings);
    }

    handleModelUpdate()
    {
        this.setState(this.getStateFromModel());
    }

    componentDidMount()
    {
        forEachEvent(this, (modelKey, event) =>
        {
            const model = this.props[modelKey];

            if (model)
                model.on(event, this.handleModelUpdate);
        });
    }

    componentWillUnmount()
    {
        forEachEvent(this, (modelKey, event) =>
        {
            const model = this.props[modelKey];

            if (model)
                model.off(event, this.handleModelUpdate);
        });
    }

    componentWillReceiveProps(nextProps)
    {
        let wantUpdate = false;

        forEachEvent(this, (modelKey, event) =>
        {
            const oldModel = this.props[modelKey];
            const newModel = nextProps[modelKey];

            if (oldModel === newModel)
                return;

            if (oldModel)
                oldModel.off(event, this.handleModelUpdate);

            if (newModel)
                newModel.on(event, this.handleModelUpdate);

            wantUpdate = true;
        });

        if (wantUpdate)
            this.handleModelUpdate();
    }
}
