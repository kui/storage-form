const path = require("path");
const DEBUG = process.env.NODE_ENV !== "production";
const webpack = require("webpack");
const BabiliPlugin = require("babili-webpack-plugin");

const plugins = [
  new webpack.optimize.DedupePlugin(),
  new webpack.optimize.OccurrenceOrderPlugin(),
];

if (!DEBUG) {
  plugins.push(new BabiliPlugin());
}

module.exports = {
  debug: DEBUG,
  devtool: DEBUG ? "inline-source-map" : "source-map",
  entry: "./src/storage-elements-registerer.js",
  output: {
    path: path.resolve(__dirname, "./dist/storage-form/"),
    filename: DEBUG ? "storage-elements-debug.js" : "storage-elements.js"
  },
  module: {
    loaders: [
      { test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader" }
    ]
  },
  plugins,
};
