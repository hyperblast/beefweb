#!/usr/bin/env node

import { getBuildConfig, getPluginBuildDir, getWebBuildDir } from '../../build_config.mjs'
import { callBySystem, selectBySystem } from './utils';

function getInstallPaths(buildConfig)
{
    const webRoot = 'beefweb.root';

    return callBySystem({
        windows()
        {
            const targetDir = path.join(
                process.env.APPDATA,
                'foobar2000-v2',
                'user-components-x64',
                'foo_beefweb');

            const pluginFile = 'foo_beefweb.dll';

            return [
                [
                    path.join(getPluginBuildDir('foobar2000'), pluginFile),
                    path.join(targetDir, pluginFile),
                ],
                [
                    getWebBuildDir(buildConfig),
                    path.join(targetDir, webRoot),
                ]
            ];
        },

        mac()
        {
            const fooPluginFile = 'foo_beefweb.component';
            const ddbPluginFile = 'beefweb.dylib';

            const fooTargetDir = path.join(
                process.env.HOME,
                'Library',
                'foobar2000-v2',
                'user-components',
                'foo_beefweb');

            const ddbTargetDir = path.join(
                process.env.HOME,
                'Library',
                'Application Support',
                'Deadbeef',
                'Plugins');

            return [
                [
                    path.join(getPluginBuildDir('foobar2000'), fooPluginFile),
                    path.join(fooTargetDir, fooPluginFile),
                ],
                [
                    path.join(getPluginBuildDir('deadbeef'), ddbPluginFile),
                    path.join(ddbTargetDir, pluginFile),
                ],
                [
                    getWebBuildDir(buildConfig),
                    path.join(ddbTargetDir, webRoot),
                ]
            ]
        },

        posix()
        {
            const pluginFile = 'beefweb.so';

            const targetDir = path.join(
                process.env.HOME,
                '.local',
                'lib',
                'deadbeef');

            return [
                [
                    path.join(getPluginBuildDir('deadbeef'), pluginFile),
                    path.join(targetDir, pluginFile),
                ],
                [
                    getWebBuildDir(buildConfig),
                    path.join(targetDir, webRoot),
                ]
            ]
        }
    });
}

async function main()
{
    if (process.argv.length < 3)
    {
        console.error('usage:\n  install_app.js <build_type>  install locally built plugin (via symlinks)');
        return 0;
    }

    const buildType = process.argv[2];

    try
    {
        return 0;
    }
    catch (e)
    {
        console.error(e.message);
        return 1;
    }
}

main().then(exitCode => process.exit(exitCode));
