import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import webpack from 'webpack'
import HtmlPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import { getBinaryDir } from '../config.mjs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildTypes = {
    Debug: true,
    Release: true,
    MinSizeRel: true,
    RelWithDebInfo: true
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
    const binaryDir = getBinaryDir(buildType);
    const outputDirName = process.platform === 'win32' ? buildType : 'output';
    return path.join(binaryDir, 'js', 'webui', outputDirName);
}

function makeBuildParams(env)
{
    let { buildType, outputDir, analyze, tests } = env;

    if (!buildType)
    {
        buildType = 'Debug';
    }
    else if (!buildTypes[buildType])
    {
        console.log(`Unknown build type '${buildType}' was specfied, defaulting to 'Debug'`);
        buildType = 'Debug';
    }
    
    if (!outputDir)
        outputDir = getDefaultOutputDir(buildType);

    const sourceDir = path.join(__dirname, 'src');

    return {
        buildType,
        enableTests: tests,
        analyze,
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

    (params.buildType === 'Debug' ? configDebug : configRelease)(config, params);

    return config;
}

export default function(env)
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
