import React from 'react';
import ServiceContext from './service_context.js';

export default class DefaultsSettings extends React.PureComponent
{
    static contextType = ServiceContext;

    render()
    {
        return <div>Defaults</div>;
    }
}