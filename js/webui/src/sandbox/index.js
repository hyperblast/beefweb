import React from 'react'
import ReactDom from 'react-dom'
import { mapRange } from '../utils.js'
import DataTable from '../data_table.js'
import { Menu, MenuLabel } from '../elements.js';
import { DialogButton } from '../dialogs.js';

function createRow(index)
{
    return {
        icon: index % 5 === 0 ? 'cog' : null,
        columns: [
            'Artist ' + index,
            'Album ' + index,
            null,
            '' + ((index % 10) + 1),
            'Title ' + index
        ]
    };
}

function renderMenu()
{
    return <Menu>
        <MenuLabel title='hello'/>
    </Menu>;
}

const pageSize = 100;
const tableStyle = { marginTop: '0.5rem', marginBottom: '0.5rem' };
const columns = [
    { title: 'Artist', size: 3, bold: true },
    { title: 'Album', size: 3 },
    { size: -1 },
    { title: 'Track', size: 1 },
    { title: 'Title', size: 3, align: 'right' },
];

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
            <div className='app st-uitheme-light'>
                <DataTable
                    useIcons={true}
                    columns={columns}
                    data={this.state.data}
                    onRenderColumnMenu={renderMenu}
                    onRenderRowMenu={renderMenu}
                    className='panel panel-main'
                    style={tableStyle}
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
