require("webpack")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const path = require("path")

const BUILD_DIR = path.resolve(__dirname, "build")
const APP_DIR = path.resolve(__dirname, "app")

const config = {
    mode: "development",
    devtool: "source-map",
    entry: APP_DIR + "/index.jsx",
    output: {
        path: BUILD_DIR,
        filename: "aws-console.js"
    },
    target: "electron-renderer",
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                include: APP_DIR,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader"
                ]
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: "file-loader"
                }
            },
            {
                test: /\.(woff|woff2)$/,
                use: {
                    loader: "url-loader?prefix=font/&limit=5000"
                }
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: "url-loader?limit=10000&mimetype=application/octet-stream"
                }
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: "url-loader?limit=10000&mimetype=image/svg+xml"
                }
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        })
    ]
}

module.exports = config
