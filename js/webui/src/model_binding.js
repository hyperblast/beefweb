import React from 'react';
import ServiceContext from './service_context.js'
import { createSubscriber } from './model_base.js';

const subscription = Symbol('subscription');

export default function ModelBinding(InnerComponent, eventBindings)
{
    const BaseComponent =
        InnerComponent.prototype instanceof React.PureComponent
            ? React.PureComponent
            : React.Component;

    const subscriber = createSubscriber(eventBindings);

    class ModelBinder extends BaseComponent
    {
        static contextType = ServiceContext;

        constructor(props)
        {
            super(props);

            this.setComponent = c => this.component = c;
        }

        handleModelUpdate()
        {
            if (this.component)
                this.component.setState(this.component.getStateFromModel());
        }

        componentDidMount()
        {
            this[subscription] = subscriber(this.context, this.handleModelUpdate.bind(this));
        }

        componentWillUnmount()
        {
            this[subscription]();
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
