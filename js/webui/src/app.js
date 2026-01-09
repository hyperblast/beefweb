import React from 'react'
import { PanelHeader } from './elements.js'
import { ControlBarNarrowCompact, ControlBarNarrowFull, ControlBarWide } from './control_bar.js'
import PlaylistSwitcher from './playlist_switcher.js'
import PlaylistMenu from './playlist_menu.js'
import PlaylistContent from './playlist_content.js'
import FileBrowser from './file_browser.js'
import FileBrowserHeader from './file_browser_header.js'
import StatusBar from './status_bar.js'
import { View } from './navigation_model.js';
import SettingsHeader from './settings_header.js';
import SettingsContent from './settings_content.js';
import { PlaybackInfoBar } from './playback_info_bar.js';
import AlbumArtViewer from "./album_art_viewer.js";
import { useCurrentView, useSettingValue } from './hooks.js';
import { MediaSize } from './settings_model.js';

const viewContent = {
    [View.playlist]: {
        header: <div className="panel panel-header">
            <PlaylistSwitcher/>
            <PlaylistMenu/>
        </div>,
        main: <PlaylistContent/>,
    },
    [View.fileBrowser]: {
        header: <FileBrowserHeader />,
        main: <FileBrowser />
    },
    [View.albumArt]: {
        header: null,
        main: <AlbumArtViewer/>
    },
    [View.settings]: {
        header: <SettingsHeader />,
        main: <SettingsContent/>
    },
    [View.notFound]:  {
        header: <PanelHeader title='Invalid url' />,
        main: <div className='panel panel-main'>Invalid url</div>
    },
}
export function App()
{
    const view = useCurrentView();
    const showPlaybackInfo = useSettingValue('showPlaybackInfo');
    const showStatusBar = useSettingValue('showStatusBar');
    const mediaSize = useSettingValue('mediaSize');

    const { header, main } = viewContent[view];

    const playbackInfoBar = mediaSize === MediaSize.small && showPlaybackInfo ? <PlaybackInfoBar/> : null;
    const statusBar = showStatusBar ? <StatusBar/> : null;

    const upperControlBar =
        mediaSize !== MediaSize.small
            ? <ControlBarWide/>
            : null;

    const lowerControlBar =
        mediaSize === MediaSize.small
            ? view === View.playlist || view === View.albumArt
                ? <ControlBarNarrowFull/>
                : <ControlBarNarrowCompact/>
            : null;

    return (
        <div className='app'>
            {playbackInfoBar}
            {upperControlBar}
            {header}
            {main}
            {lowerControlBar}
            {statusBar}
        </div>
    );
}
