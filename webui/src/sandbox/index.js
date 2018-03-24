import React from 'react'
import ReactDom from 'react-dom'
import { mapRange } from '../utils'
import DataTable from '../data_table'

function createRow(index)
{
    return {
        icon: index == 5 ? 'media-play' : null,
        url: `#/row/${index}`,
        columns: [
            'Artist ' + index,
            'Album ' + index,
            'Track ' + ((index % 10) + 1),
            'Title ' + index
        ]
    };
}

const pageSize = 100;
const tableStyle = { marginTop: '0.5rem', marginBottom: '0.5rem' };

class Sandbox extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getState(0);
        this.handleLoadPage = this.handleLoadPage.bind(this);
    }

    handleLoadPage(offset)
    {
        setTimeout(() => this.setState(this.getState(offset, pageSize)), 50);
    }

    getState(offset)
    {
        return {
            offset,
            data: mapRange(offset, pageSize, createRow)
        };
    }

    render()
    {
        return (
            <div className='app'>
                <DataTable
                    useIcons={true}
                    data={this.state.data}
                    className='panel main-panel'
                    style={tableStyle}
                    columnNames={['Artist', 'Album', 'Track', 'Title']}
                    offset={this.state.offset}
                    pageSize={pageSize}
                    totalCount={5000}
                    onLoadPage={this.handleLoadPage} />
            </div>
        );
    }
}

document.title = 'Sandbox';

ReactDom.render(
    <Sandbox />,
    document.getElementById('app-container'));
