const path = require('path');
const webpack = require('webpack');
const HtmlPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

function configCommon(cfg, opts)
{
    // Common configuration

    cfg.output.filename = 'bundle.js';
    cfg.performance.hints = false;

    cfg.entry.push('normalize.css');
    cfg.entry.push('event-source-polyfill');

    cfg.module.rules.push({
        test: /\.js$/,
        include: opts.sourceDir,
        loader: 'babel-loader',
    });

    cfg.module.rules.push({
        test: /(\.svg|\.png)$/,
        loader: 'url-loader',
        options: {
            name: '[name].[ext]',
            limit: 1024
        }
    });
}

function configApp(cfg, opts)
{
    // App target configuration

    cfg.output.path = opts.outputDir;

    cfg.entry.push('./src/style.less');
    cfg.entry.push('./src/index.js');

    cfg.plugins.push(new HtmlPlugin({
        template: path.join(opts.sourceDir, 'index.html')
    }));

    if (opts.analyze)
    {
        cfg.plugins.push(new BundleAnalyzerPlugin({
           analyzerMode: 'static',
           reportFilename: path.join('stats', 'bundle-size.html'),
           openAnalyzer: false,
        }));
    }
}

function configTests(cfg, opts)
{
    // Tests target configuration

    cfg.output.path = path.join(opts.outputDir, 'tests');

    cfg.entry.push('qunit/qunit/qunit.css');
    cfg.entry.push('./src/tests/index.js');

    cfg.plugins.push(new HtmlPlugin({
        template: path.join(opts.sourceDir, 'tests', 'index.html')
    }));
}

function configSandbox(cfg, opts)
{
    // Sandbox target configuration

    cfg.output.path = path.join(opts.outputDir, 'sandbox');

    cfg.entry.push('./src/style.less');
    cfg.entry.push('./src/sandbox/index.js');

    cfg.plugins.push(new HtmlPlugin({
        template: path.join(opts.sourceDir, 'index.html')
    }));
}

function configDebug(cfg)
{
    // Debug configuration

    cfg.devtool = 'source-map';
    cfg.mode = 'none';

    cfg.plugins.push(new webpack.LoaderOptionsPlugin({
        debug: true
    }));

    cfg.module.rules.push({
        test: /\.(css|less)$/,
        use: ['style-loader', 'css-loader', 'less-loader']
    });
}

function configRelease(cfg)
{
    // Release configuration

    cfg.mode = 'production';
    cfg.node.process = false;

    cfg.plugins.push(new webpack.LoaderOptionsPlugin({
        minimize: true
    }));

    const styleExtractor = new ExtractTextPlugin({
        filename: 'bundle.css'
    });

    cfg.plugins.push(styleExtractor);

    cfg.module.rules.push({
        test: /\.(css|less)$/,
        use: styleExtractor.extract({
            use: ['css-loader', 'less-loader'],
            fallback: 'style-loader'
        })
    });
}

function makeBuildOpts(env)
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

function makeTarget(configTarget, opts)
{
    const cfg = {
        entry: [],
        output: {},
        plugins: [],
        module: { rules: [] },
        resolve: { alias: {} },
        node: {},
        performance: {},
    };

    configCommon(cfg, opts);
    configTarget(cfg, opts);

    (opts.buildType === 'release' ? configRelease : configDebug)(cfg, opts);

    return cfg;
}

module.exports = function(env)
{
    const opts = makeBuildOpts(env || {});
    const allTargets = [makeTarget(configApp, opts)];

    if (opts.enableTests)
    {
        allTargets.push(makeTarget(configTests, opts));
        allTargets.push(makeTarget(configSandbox, opts));
    }

    return allTargets;
};
