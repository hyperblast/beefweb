import React from 'react'
import PropTypes from 'prop-types'
import PlaylistModel from './playlist_model'
import FileBrowserModel from './file_browser_model'
import urls from './urls'
import { Table } from './elements'

const fileTypes = Object.freeze({
    F: 'File',
    D: 'Directory'
});

export default class FileBrowser extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
        this.handleClick = this.handleClick.bind(this);
    }

    getStateFromModel()
    {
        var model = this.props.fileBrowserModel;

        return {
            rows: model.entries.map(e => ({
                url: e.type == 'D' ? urls.browsePath(e.path) : null,
                columns: [e.name, fileTypes[e.type]]
            }))
        };
    }

    componentDidMount()
    {
        this.props.fileBrowserModel.on('change', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.fileBrowserModel.off('change', this.handleUpdate);
    }

    handleClick(idx)
    {
        var itemPath = this.props.fileBrowserModel.entries[idx].path;
        this.props.playlistModel.addItems([itemPath]);
    }

    render()
    {
        return (
            <div className='panel main-panel table-content file-browser'>
                <Table columns={['Name', 'Type']} rows={this.state.rows} onClick={this.handleClick} />
            </div>
        )
    }
}

FileBrowser.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired,
    fileBrowserModel: PropTypes.instanceOf(FileBrowserModel).isRequired
};
