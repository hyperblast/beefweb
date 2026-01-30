#!/usr/bin/env node

import mkdirp from 'mkdirp';
import fs from 'fs/promises';
import path from 'path';
import { buildTypes, getBuildConfig, getBuildType } from '../../build_config.mjs'
import { callBySystem, tryStat, rimraf } from './utils.js';

function getSymlinks(buildConfig)
{
    const webRoot = 'beefweb.root';

    return callBySystem({
        windows()
        {
            const installDir = path.join(
                process.env.APPDATA,
                'foobar2000-v2',
                'user-components-x64',
                'foo_beefweb');

            const pluginFile = 'foo_beefweb.dll';

            return [
                {
                    from: path.join(installDir, pluginFile),
                    to: path.join(buildConfig.pluginBuildDir.foobar2000, pluginFile),
                },
                {
                    from: path.join(installDir, webRoot),
                    to: buildConfig.webBuildDir,
                }
            ];
        },

        mac()
        {
            const fooPluginFile = 'foo_beefweb.component';
            const ddbPluginFile = 'beefweb.dylib';

            const fooInstallDir = path.join(
                process.env.HOME,
                'Library',
                'foobar2000-v2',
                'user-components',
                'foo_beefweb');

            const ddbInstallDir = path.join(
                process.env.HOME,
                'Library',
                'Application Support',
                'Deadbeef',
                'Plugins');

            return [
                {
                    from: path.join(fooInstallDir, fooPluginFile),
                    to: path.join(buildConfig.pluginBuildDir.foobar2000, fooPluginFile),
                },
                {
                    from: path.join(buildConfig.pluginBuildDir.foobar2000, fooPluginFile, 'Contents', 'Resources', webRoot),
                    to: buildConfig.webBuildDir,
                },
                {
                    from: path.join(ddbInstallDir, ddbPluginFile),
                    to: path.join(buildConfig.pluginBuildDir.deadbeef, ddbPluginFile),
                },
                {
                    from: path.join(buildConfig.pluginBuildDir.deadbeef, webRoot),
                    to: buildConfig.webBuildDir,
                }
            ];
        },

        posix()
        {
            const pluginFile = 'beefweb.so';

            const installDir = path.join(
                process.env.HOME,
                '.local',
                'lib',
                'deadbeef');

            return [
                {
                    from: path.join(installDir, pluginFile),
                    to: path.join(buildConfig.pluginBuildDir.deadbeef, pluginFile),
                },
                {
                    from: path.join(installDir, webRoot),
                    to: buildConfig.webBuildDir,
                }
            ];
        }
    });
}

async function run(buildTypeRaw)
{
    const buildType = getBuildType(buildTypeRaw);
    if (!buildType)
        throw new Error(`Invalid build type: ${buildTypeRaw}`);

    const buildConfig = getBuildConfig(buildType);

    for (let link of getSymlinks(buildConfig))
    {
        const { from, to } = link;

        if (await tryStat(from))
        {
            console.error(`removing ${from}`);
            await rimraf(from);
        }

        console.error(`adding link ${from} -> ${to}`);
        await mkdirp(path.dirname(from));
        await fs.symlink(to, from);
    }
}

async function main()
{
    if (process.argv.length !== 3)
    {
        console.error('Usage:');
        console.error('  install_app.js <build_type>  install locally built plugin (via symlinks)');
        console.error();
        console.error('Build types:');
        console.error('  ' + Object.values(buildTypes).join(' '));
        console.error();
        console.error('Warning:');
        console.error('  Existing installed plugin will be removed without backup');
        return process.argv.length > 3 ? 1 : 0;
    }

    try
    {
        await run(process.argv[2]);
        return 0;
    }
    catch (e)
    {
        console.error(e);
        return 1;
    }
}

main().then(exitCode => process.exit(exitCode));
