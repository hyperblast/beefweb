var path = require('path');
var webpack = require('webpack');
var HtmlPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

function configCommon(cfg, opts)
{
    // Common configuration

    cfg.output.filename = 'bundle.js';

    cfg.entry.push('event-source-polyfill');
    cfg.entry.push('normalize.css');

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

    cfg.entry.push('./src/style.css');
    cfg.entry.push('./src/index.js');

    cfg.plugins.push(new HtmlPlugin({
        template: path.join(opts.sourceDir, 'index.html')
    }));
}

function configTests(cfg, opts)
{
    // Tests target configuration

    cfg.output.path = path.join(opts.outputDir, 'tests');

    cfg.entry.push('qunitjs/qunit/qunit.css');
    cfg.entry.push('./src/tests/index.js');

    cfg.plugins.push(new HtmlPlugin({
        template: path.join(opts.sourceDir, 'tests', 'index.html')
    }));
}

function configDebug(cfg)
{
    // Debug configuration

    cfg.devtool = 'source-map';

    cfg.plugins.push(new webpack.LoaderOptionsPlugin({
        debug: true
    }));

    cfg.module.rules.push({
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
    });
}

function configRelease(cfg)
{
    // Release configuration

    cfg.node.process = false;

    cfg.plugins.push(new webpack.LoaderOptionsPlugin({
        minimize: true
    }));

    cfg.plugins.push(new webpack.optimize.UglifyJsPlugin());

    cfg.plugins.push(new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"'
    }));

    var cssExtractor = new ExtractTextPlugin({
        filename: 'bundle.css'
    });

    cfg.plugins.push(cssExtractor);

    cfg.module.rules.push({
        test: /\.css$/,
        use: cssExtractor.extract({
            fallback: 'style-loader',
            use: 'css-loader'
        })
    });
}

function makeBuildOpts(env)
{
    var buildType = env.release ? 'release' : 'debug';
    var enableTests = !!env.tests;

    var sourceDir = path.join(__dirname, 'src');
    var outputDir = path.join(__dirname, 'build', buildType);

    return {
        buildType: buildType,
        enableTests: enableTests,
        sourceDir: sourceDir,
        outputDir: outputDir
    }
}

function makeTarget(configTarget, opts)
{
    var cfg = {
        entry: [],
        output: {},
        plugins: [],
        module: { rules: [] },
        node: {}
    };

    configCommon(cfg, opts);
    configTarget(cfg, opts);

    (opts.buildType === 'release' ? configRelease : configDebug)(cfg, opts);

    return cfg;
}

module.exports = function(env)
{
    var opts = makeBuildOpts(env || {});
    var allTargets = [makeTarget(configApp, opts)];

    if (opts.enableTests)
        allTargets.push(makeTarget(configTests, opts));

    return allTargets;
};
