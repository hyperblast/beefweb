import React from 'react'
import ReactDom from 'react-dom'
import { mapRange } from '../utils.js'
import DataTable from '../data_table.js'
import { Menu, MenuLabel } from '../elements.js';
import { DialogButton } from '../dialogs.js';
import { createRoot } from 'react-dom/client';

function createRow(index)
{
    return {
        icon: index % 5 === 0 ? 'cog' : null,
        columns: [
            'Artist ' + index,
            'Album ' + index,
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
    { lineBreak: true },
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

const root = createRoot(document.getElementById('app-container'));
root.render(<Sandbox />);
