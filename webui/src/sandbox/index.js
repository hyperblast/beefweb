import React from 'react'
import ReactDom from 'react-dom'

import DataTable from '../data_table'

class Sandbox extends React.Component
{
    constructor(props)
    {
        super(props);

        this.handleGetRowData = index =>
        {
            return [
                'Artist ' + index,
                'Album ' + index,
                'Track ' + ((index % 10) + 1),
                'Title ' + index
            ];
        };

        this.handleLoadPage = (offset, count) => console.log({ offset, count });
    }

    render()
    {
        const style = { height: '100vh', background: 'white', padding: '1rem' };

        return (
            <DataTable
                columnNames={['Artist', 'Album', 'Track', 'Title']}
                pageSize={200}
                totalCount={100000}
                onGetRowData={this.handleGetRowData}
                onLoadPage={this.handleLoadPage}
                style={style} />
        );
    }
}

document.title = 'Sandbox';

ReactDom.render(
    <Sandbox />,
    document.getElementById('app-container'));
