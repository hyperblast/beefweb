import React from 'react';
import ServiceContext from './service_context.js'
import { subscribeAll } from './model_base.js';

export default function ModelBinding(InnerComponent, eventDefs)
{
    const BaseComponent =
        InnerComponent.prototype instanceof React.PureComponent
            ? React.PureComponent
            : React.Component;

    class ModelBinder extends BaseComponent
    {
        static contextType = ServiceContext;

        constructor(props)
        {
            super(props);

            this.unsubscribe = null;
            this.setComponent = c => this.component = c;
        }

        handleModelUpdate()
        {
            if (this.component)
                this.component.setState(this.component.getStateFromModel());
        }

        componentDidMount()
        {
            this.unsubscribe = subscribeAll(this.context, eventDefs, this.handleModelUpdate.bind(this));
        }

        componentWillUnmount()
        {
            this.unsubscribe();
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
