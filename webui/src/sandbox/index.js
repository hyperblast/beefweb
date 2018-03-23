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

        this.handleGetUrl = index => `#/${index}`;
        this.handleDoubleClick = index => console.log(index);
    }

    render()
    {
        const tableStyle = { marginTop: '0.5rem', marginBottom: '0.5rem' };

        return (
            <div className='app'>
                <DataTable
                    className='panel main-panel'
                    style={tableStyle}
                    columnNames={['Artist', 'Album', 'Track', 'Title']}
                    pageSize={100}
                    totalCount={100000}
                    onGetRowData={this.handleGetRowData}
                    onDoubleClick={this.handleDoubleClick} />
            </div>
        );
    }
}

document.title = 'Sandbox';

ReactDom.render(
    <Sandbox />,
    document.getElementById('app-container'));
