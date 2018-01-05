import React from 'react'
import PropTypes from 'prop-types'
import Component from './component'
import PlaylistModel from './playlist_model'
import Table from './table'

export default class PlaylistContent extends Component
{
    constructor(props)
    {
        super(props);

        this.updateOn({ playlistModel: 'itemsChange' });
        this.state = this.getStateFromModel();
        this.handleClick = index => this.props.playlistModel.activateItem(index);
    }

    getStateFromModel()
    {
        const { columns, playlistItems } = this.props.playlistModel;

        return {
            columns: columns.names,
            rows: playlistItems
        };
    }

    render()
    {
        return (
            <div className='panel main-panel table-content playlist-content'>
                <Table columns={this.state.columns} rows={this.state.rows} onClick={this.handleClick} />
            </div>
        );
    }
}

PlaylistContent.propTypes = {
    playlistModel: PropTypes.instanceOf(PlaylistModel).isRequired
};
