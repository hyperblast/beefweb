const path = require('path');
const webpack = require('webpack');

function configCommon(config)
{
    config.entry.push('./src/index.js');

    config.module.rules.push({
        test: /\.js$/,
        include: path.join(__dirname, 'src'),
        loader: 'babel-loader',
    });

    config.output.path = path.join(__dirname, 'dist', 'umd');
    config.output.libraryTarget = 'umd';
    config.output.library = {
        amd: 'beefweb-client',
        commonjs: 'beefweb-client',
        root: 'BeefwebClient',
    };
}

function configDebug(config)
{
    config.mode = 'none';
    config.output.filename = 'beefweb-client.js'
}

function configRelease(config)
{
    config.mode = 'production';
    config.output.filename = 'beefweb-client.min.js'
}

function makeTarget(configTarget)
{
    const config = {
        entry: [],
        output: {},
        plugins: [],
        module: { rules: [] },
        resolve: { alias: {} },
        node: {},
        externals: {},
    };

    configCommon(config);
    configTarget(config);

    return config;
}

module.exports = function()
{
    return [
        makeTarget(configDebug),
        makeTarget(configRelease),
    ];
};
