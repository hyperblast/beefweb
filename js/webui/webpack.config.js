import path from 'path'
import { fileURLToPath } from 'url'
import HtmlPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import { getBuildConfig } from '../config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildTypes = {
    debug: 'Debug',
    release: 'Release',
    minsizerel: 'MinSizeRel',
    relwithdebinfo: 'RelWithDebInfo'
};

function configCommon(config, params)
{
    // Common configuration

    config.output.filename = 'bundle.js';
    config.performance.hints = false;

    config.entry.push('normalize.css');

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

    if (params.buildType === 'release')
    {
        const limit = 400 * 1024;
        config.performance.hints = 'error';
        config.performance.maxEntrypointSize = limit;
        config.performance.maxAssetSize = limit;
    }

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

    config.mode = 'development';
    config.devtool = 'source-map';

    config.module.rules.push({
        test: /\.(css|less)$/,
        use: ['style-loader', 'css-loader', 'less-loader']
    });
}

function configRelease(config)
{
    // Release configuration

    config.mode = 'production';

    config.optimization.minimize = true;

    config.optimization.minimizer.push(new TerserPlugin({
        extractComments: false
    }));

    config.optimization.minimizer.push(new CssMinimizerPlugin());

    config.plugins.push(new MiniCssExtractPlugin({
        filename: 'bundle.css'
    }));

    config.module.rules.push({
        test: /\.(css|less)$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']
    });
}

function getDefaultOutputDir(buildType)
{
    const { buildDir, isMultiConfig } = getBuildConfig(buildType);
    return path.join(buildDir, 'js', 'webui', isMultiConfig ? buildDir : 'output');
}

function getBuildType(env)
{
    const matchedTypes = [];

    for (let key in env)
    {
        // --env {type}

        const buildType = buildTypes[key.toLowerCase()];
        if (buildType)
            matchedTypes.push(buildType);
    }

    if (env.buildType)
    {
        // --env buildType={type}

        const buildType = buildTypes[env.buildType.toLowerCase()];
        if (buildType)
            matchedTypes.push(buildType)
        else
            throw Error(`Unknown build type '${env.buildType}'`);
    }

    if (matchedTypes.length === 0)
        return buildTypes.debug;

    if (matchedTypes.length === 1)
        return matchedTypes[0];

    throw Error('Multiple build types specified: ' + matchedTypes.join(', '));
}

function makeBuildParams(env)
{
    let { outputDir, analyze, tests } = env;
    const buildType = getBuildType(env);

    if (!outputDir)
        outputDir = getDefaultOutputDir(buildType);

    const sourceDir = path.join(__dirname, 'src');

    return {
        buildType,
        enableTests: tests || false,
        analyze: analyze || false,
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
        performance: {},
        optimization: {
            minimize: false,
            minimizer: []
        }
    };

    configCommon(config, params);
    configTarget(config, params);

    (params.buildType === buildTypes.debug ? configDebug : configRelease)(config, params);

    return config;
}

export default function(env)
{
    const params = makeBuildParams(env || {});
    console.log('using build config', params);
    const allTargets = [makeTarget(configApp, params)];

    if (params.enableTests)
    {
        allTargets.push(makeTarget(configTests, params));
        allTargets.push(makeTarget(configSandbox, params));
    }

    return allTargets;
};
