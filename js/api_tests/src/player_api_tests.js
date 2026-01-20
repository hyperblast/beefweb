import { describe, test, assert } from 'vitest'
import { client, config, tracks, setupPlayer } from './test_env.js';

describe('player api', () => {
    setupPlayer();

    test('get state', async () => {
        const state = await client.getPlayerState();
        assert.ok(state);

        const { info, activeItem, playbackState, volume, playbackMode, playbackModes } = state;

        assert.ok(info);
        assert.ok(info.name);
        assert.ok(info.title);
        assert.ok(info.version);
        assert.ok(info.pluginVersion);

        assert.ok(activeItem);
        const { playlistId, playlistIndex, index, position, duration } = activeItem;
        assert.equal(typeof playlistId, 'string');
        assert.equal(typeof playlistIndex, 'number');
        assert.equal(typeof index, 'number');
        assert.equal(typeof position, 'number');
        assert.equal(typeof duration, 'number');

        assert.ok(playbackState);
        assert.equal(typeof playbackState, 'string');

        assert.ok(volume);
        const { type, min, max, value, isMuted } = volume;
        assert.equal(typeof type, 'string');
        assert.equal(typeof min, 'number');
        assert.equal(typeof max, 'number');
        assert.equal(typeof value, 'number');
        assert.equal(typeof isMuted, 'boolean');

        assert.equal(typeof playbackMode, 'number');
        assert.ok(Array.isArray(playbackModes));
    });

    test('query current track', async () => {
        await client.addPlaylistItems(0, [tracks.t3]);

        await client.play(0, 0);
        await client.waitForState('playing');
        await client.waitPlaybackMetadata();

        let backslash = '\\';

        if (config.playerId === 'deadbeef')
            backslash = '\\\\';

        const state = await client.getPlayerState([
            '%genre%',
            '%artist%',
            '%album%',
            '%tracknumber%',
            '%title%',
            '%length%',
            ` %artist% ${backslash} %album%, %title% `,
        ]);

        assert.deepEqual(state.activeItem.columns, [
            'Ambient',
            'Hyperblast',
            'Silence Rocks',
            '03',
            'Silence Rocks - Part 3',
            '1:10',
            ' Hyperblast \\ Silence Rocks, Silence Rocks - Part 3 '
        ]);
    });

    test('set volume absolute', async () => {
        let state = await client.getPlayerState();
        const newVolume = (state.volume.min + state.volume.max) / 2;
        await client.setVolume(newVolume);

        state = await client.getPlayerState();
        assert.equal(state.volume.value, newVolume);
    });

    test('set volume relative', async () => {
        const state1 = await client.getPlayerState();

        await client.setVolumeRelative(-1);
        const state2 = await client.getPlayerState();
        assert.ok(state2.volume.value < state1.volume.value);

        await client.setVolumeRelative(1);
        const state3 = await client.getPlayerState();
        assert.equal(state3.volume.value, state1.volume.value);
    });

    test('volume up/down', async () => {
        const state1 = await client.getPlayerState();

        await client.volumeDown();
        const state2 = await client.getPlayerState();
        assert.ok(state2.volume.value < state1.volume.value);

        await client.volumeUp();
        const state3 = await client.getPlayerState();
        assert.equal(state3.volume.value, state1.volume.value);
    });

    test('set muted', async () => {
        await client.setMuted(true);

        const state = await client.getPlayerState();
        assert.equal(state.volume.isMuted, true);
    });

    test('set playback mode', async () => {
        let state = await client.getPlayerState();
        const newMode = state.playbackModes.length - 1;
        await client.setPlaybackMode(newMode);

        state = await client.getPlayerState();
        assert.equal(state.playbackMode, newMode);
    });

    test('set bool option', async () => {
        let state = await client.getPlayerState();
        let option = state.options.find(o => o.type === 'bool');
        assert.ok(option.name);
        assert.equal(option.value, false);

        await client.setOption(option.id, true);

        state = await client.getPlayerState();
        option = state.options.find(o => o.id === option.id);
        assert.ok(option.value);
    });

    test('set enum option', async () => {
        let state = await client.getPlayerState();
        let option = state.options.find(o => o.type === 'enum');
        assert.ok(option.name);
        assert.ok(Array.isArray(option.enumNames));
        assert.equal(option.value, 0);

        await client.setOption(option.id, 1);

        state = await client.getPlayerState();
        option = state.options.find(o => o.id === option.id);
        assert.equal(option.value, 1);
    });

    test('play', async () => {
        await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);

        await client.play(0, 1);
        await client.waitForState(s => {
            return s.playbackState === 'playing' && s.activeItem.index === 1;
        });

        assert.ok(true);
    });

    test('stop', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);

        await client.play(0, 0);
        await client.waitForState('playing');

        await client.stop();
        await client.waitForState('stopped');

        assert.ok(true);
    });

    test('play random', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);
        await client.addPlaylistItems(0, [tracks.t2]);
        await client.addPlaylistItems(0, [tracks.t3]);

        await client.playRandom();
        await client.waitForState('playing');

        assert.ok(true);
    });

    test('play current', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);

        await client.play(0, 0);
        await client.waitForState('playing');

        await client.pause();
        await client.waitForState('paused');

        await client.playCurrent();
        await client.waitForState('playing');

        assert.ok(true);
    });

    test('pause', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);

        await client.play(0, 0);
        await client.waitForState('playing');

        await client.pause();
        await client.waitForState('paused');

        assert.ok(true);
    });

    test('toggle pause', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);

        await client.play(0, 0);
        await client.waitForState('playing');

        await client.togglePause();
        await client.waitForState('paused');

        await client.togglePause();
        await client.waitForState('playing');

        assert.ok(true);
    });

    test('play or pause', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);

        await client.playOrPause();
        await client.waitForState('playing');

        await client.playOrPause();
        await client.waitForState('paused');

        await client.playOrPause();
        await client.waitForState('playing');

        assert.ok(true);
    });

    test('next', async () => {
        await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);

        await client.play(0, 0);
        await client.waitForState(s => {
            return s.playbackState === 'playing' && s.activeItem.index === 0;
        });

        await client.next();
        await client.waitForState(s => {
            return s.playbackState === 'playing' && s.activeItem.index === 1;
        });

        assert.ok(true);
    });

    test('next by', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);
        await client.addPlaylistItems(0, [tracks.t1]);
        await client.addPlaylistItems(0, [tracks.t2]);

        await client.play(0, 0);
        await client.waitForState(s => {
            return s.playbackState === 'playing' && s.activeItem.index === 0;
        });

        await client.next({ by: '%title%' });
        await client.waitForState(s => {
            return s.playbackState === 'playing' && s.activeItem.index === 2;
        });

        assert.ok(true);
    });

    test('previous', async () => {
        await client.addPlaylistItems(0, [tracks.t1, tracks.t2, tracks.t3]);

        await client.play(0, 1);
        await client.waitForState(s => {
            return s.playbackState === 'playing' && s.activeItem.index === 1;
        });

        await client.previous();
        await client.waitForState(s => {
            return s.playbackState === 'playing' && s.activeItem.index === 0;
        });

        assert.ok(true);
    });

    test('previous by', async () => {
        await client.addPlaylistItems(0, [tracks.t1]);
        await client.addPlaylistItems(0, [tracks.t2]);
        await client.addPlaylistItems(0, [tracks.t2]);

        await client.play(0, 2);
        await client.waitForState(s => {
            return s.playbackState === 'playing' && s.activeItem.index === 2;
        });

        await client.previous({ by: '%title%' });
        await client.waitForState(s => {
            return s.playbackState === 'playing' && s.activeItem.index === 0;
        });

        assert.ok(true);
    });

    test('set playback position', async () => {
        await client.addPlaylistItems(0, [tracks.t3]);

        await client.play(0, 0);
        await client.waitForState(s => {
            return s.playbackState === 'playing' && s.activeItem.index === 0;
        });

        await client.pause();
        await client.waitForState('paused');

        await client.setPlaybackPosition(33.0);
        await client.waitForState(s => {
            return s.activeItem.position === 33.0;
        });

        assert.ok(true);
    });

    test('move playback position', async () => {
        await client.addPlaylistItems(0, [tracks.t3]);

        await client.play(0, 0);
        await client.waitForState(s => {
            return s.playbackState === 'playing' && s.activeItem.index === 0;
        });

        await client.pause();
        await client.waitForState('paused');

        await client.setPlaybackPosition(33.0);
        await client.waitForState(s => {
            return s.activeItem.position === 33.0;
        });

        await client.movePlaybackPosition(11.0);
        await client.waitForState(s => {
            return s.activeItem.position === 44.0;
        });

        assert.ok(true);
    });
});
