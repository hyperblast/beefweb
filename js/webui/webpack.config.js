const path = require('path');
const webpack = require('webpack');
const HtmlPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

function configCommon(config, params)
{
    // Common configuration

    config.output.filename = 'bundle.js';
    config.performance.hints = false;

    config.entry.push('normalize.css');
    config.entry.push('event-source-polyfill');

    config.module.rules.push({
        test: /\.js$/,
        include: params.sourceDir,
        loader: 'babel-loader',
    });

    config.module.rules.push({
        test: /(\.svg|\.png)$/,
        loader: 'url-loader',
        options: {
            name: '[name].[ext]',
            limit: 1024
        }
    });
}

function configApp(config, params)
{
    // App target configuration

    config.output.path = params.outputDir;

    config.entry.push('./src/style.less');
    config.entry.push('./src/index.js');

    config.plugins.push(new HtmlPlugin({
        template: path.join(params.sourceDir, 'index.html')
    }));

    if (params.analyze)
    {
        config.plugins.push(new BundleAnalyzerPlugin({
           analyzerMode: 'static',
           reportFilename: path.join('stats', 'bundle-size.html'),
           openAnalyzer: false,
        }));
    }
}

function configTests(config, params)
{
    // Tests target configuration

    config.output.path = path.join(params.outputDir, 'tests');

    config.entry.push('qunit/qunit/qunit.css');
    config.entry.push('./src/tests/index.js');

    config.plugins.push(new HtmlPlugin({
        template: path.join(params.sourceDir, 'tests', 'index.html')
    }));
}

function configSandbox(config, params)
{
    // Sandbox target configuration

    config.output.path = path.join(params.outputDir, 'sandbox');

    config.entry.push('./src/style.less');
    config.entry.push('./src/sandbox/index.js');

    config.plugins.push(new HtmlPlugin({
        template: path.join(params.sourceDir, 'index.html')
    }));
}

function configDebug(config)
{
    // Debug configuration

    config.devtool = 'source-map';
    config.mode = 'none';

    config.plugins.push(new webpack.LoaderOptionsPlugin({
        debug: true
    }));

    config.module.rules.push({
        test: /\.(css|less)$/,
        use: ['style-loader', 'css-loader', 'less-loader']
    });
}

function configRelease(config)
{
    // Release configuration

    config.mode = 'production';
    config.node.process = false;

    config.plugins.push(new webpack.LoaderOptionsPlugin({
        minimize: true
    }));

    const styleExtractor = new ExtractTextPlugin({
        filename: 'bundle.css'
    });

    config.plugins.push(styleExtractor);

    config.module.rules.push({
        test: /\.(css|less)$/,
        use: styleExtractor.extract({
            use: ['css-loader', 'less-loader'],
            fallback: 'style-loader'
        })
    });
}

function makeBuildParams(env)
{
    const buildType = env.release ? 'release' : 'debug';
    const enableTests = !!env.tests;
    const analyze = !!env.analyze;

    const sourceDir = path.join(__dirname, 'src');
    const outputDir = path.join(__dirname, 'build', buildType);
    const rootDir = path.dirname(__dirname);

    return {
        buildType,
        enableTests,
        analyze,
        rootDir,
        sourceDir,
        outputDir,
    };
}

function makeTarget(configTarget, params)
{
    const config = {
        entry: [],
        output: {},
        plugins: [],
        module: { rules: [] },
        resolve: { alias: {} },
        node: {},
        performance: {},
    };

    configCommon(config, params);
    configTarget(config, params);

    (params.buildType === 'release' ? configRelease : configDebug)(config, params);

    return config;
}

module.exports = function(env)
{
    const params = makeBuildParams(env || {});
    const allTargets = [makeTarget(configApp, params)];

    if (params.enableTests)
    {
        allTargets.push(makeTarget(configTests, params));
        allTargets.push(makeTarget(configSandbox, params));
    }

    return allTargets;
};
