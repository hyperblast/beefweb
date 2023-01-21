import React from 'react'
import ReactDom from 'react-dom'
import { mapRange } from '../utils.js'
import DataTable from '../data_table.js'

function createRow(index)
{
    return {
        icon: index == 5 ? 'media-play' : null,
        columns: [
            'Artist ' + index,
            'Album ' + index,
            '' + ((index % 10) + 1),
            'Title ' + index
        ]
    };
}

const pageSize = 100;
const tableStyle = { marginTop: '0.5rem', marginBottom: '0.5rem' };
const columnNames = ['Artist', 'Album', 'Track', 'Title'];
const columnSizes = [3, 3, 1, 3];

class Sandbox extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getState(0);
        this.handleLoadPage = this.handleLoadPage.bind(this);
        this.handleClick = index => console.log('click', index);
        this.handleDoubleClick = index => console.log('doubleClick', index);
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
                    columnNames={columnNames}
                    columnSizes={columnSizes}
                    offset={this.state.offset}
                    pageSize={pageSize}
                    totalCount={5000}
                    onLoadPage={this.handleLoadPage}
                    onClick={this.handleClick}
                    onDoubleClick={this.handleDoubleClick} />
            </div>
        );
    }
}

document.title = 'Sandbox';

ReactDom.render(
    <Sandbox />,
    document.getElementById('app-container'));
