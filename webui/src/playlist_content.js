import React from 'react'
import PropTypes from 'prop-types'
import PlaylistModel from './playlist_model'
import Table from './table'

export default class PlaylistContent extends React.PureComponent
{
    constructor(props)
    {
        super(props);

        this.state = this.getStateFromModel();
        this.handleUpdate = () => this.setState(this.getStateFromModel());
        this.handleClick = index => this.props.playlistModel.activateItem(index);
    }

    getStateFromModel()
    {
        var model = this.props.playlistModel;

        return {
            columns: model.columns.names,
            rows: model.playlistItems
        };
    }

    componentDidMount()
    {
        this.props.playlistModel.on('itemsChange', this.handleUpdate);
    }

    componentWillUnmount()
    {
        this.props.playlistModel.off('itemsChange', this.handleUpdate);
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
