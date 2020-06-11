const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  // mode: "development",
  entry: "./main.js",
  output: {
    path: path.resolve(__dirname, "./dist"),
    // publicPath: '/assets/'
  },
  // devtool: "cheap-module-eval-source-map",
  module: {
    // rules: [
    //   {
    //     test: /\.(png|jpe?g|gif)$/,
    //     use: [
    //       {
    //         loader: "url-loader",
    //         options: {
    //           name: "[name]_[hash].[ext]",
    //           outputPath: "/assets/img/",
    //           publicPath: "../",
    //           limit: 15500
    //         },
    //       },
    //     ],
    //   },
    // ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      favicon: path.resolve("./public/favicon.ico"),
    }),
    new webpack.HotModuleReplacementPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/',
          to: 'assets/'
        },
      ],
    })
  ],
  devServer: {
    open: true,
    port: "8080",
    hot: true,
    hotOnly: true,
  },
  optimization: {
    // usedExports: true
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      "@": path.resolve("src")
    }
  }
};