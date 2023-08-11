import React from 'react';
import ServiceContext from './service_context.js'

function makeBindingList(bindings)
{
    let result = [];

    for (let model of Object.keys(bindings))
    {
        const event = bindings[model];

        if (Array.isArray(event))
        {
            for (let item of event)
                result.push({ model, event: item });
        }
        else if (typeof event === 'string')
            result.push({ model, event });
        else
            throw Error(`Invalid event name or event list for model '${model}': '${event}'`);
    }

    return result;
}

export default function ModelBinding(InnerComponent, eventBindings)
{
    const BaseComponent =
        InnerComponent.prototype instanceof React.PureComponent
            ? React.PureComponent
            : React.Component;

    const bindings = makeBindingList(eventBindings);

    class ModelBinder extends BaseComponent
    {
        static contextType = ServiceContext;

        constructor(props)
        {
            super(props);

            this.handleModelUpdate = this.handleModelUpdate.bind(this);
            this.setComponent = c => this.component = c;
        }

        handleModelUpdate()
        {
            if (this.component)
                this.component.setState(this.component.getStateFromModel());
        }

        componentDidMount()
        {
            for (let binding of bindings)
            {
                const model = this.context[binding.model];

                if (model)
                    model.on(binding.event, this.handleModelUpdate);
            }
        }

        componentWillUnmount()
        {
            for (let binding of bindings)
            {
                const model = this.context[binding.model];

                if (model)
                    model.off(binding.event, this.handleModelUpdate);
            }
        }

        render()
        {
            return <InnerComponent {...this.props} ref={this.setComponent} />;
        }
    }

    ModelBinder.propTypes = InnerComponent.propTypes;
    ModelBinder.defaultProps = InnerComponent.defaultProps;
    ModelBinder.displayName = `ModelBinding<${InnerComponent.displayName || InnerComponent.name}>`

    return ModelBinder;
}
