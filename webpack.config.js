const DEBUG = process.env.NODE_ENV !== "production";
const webpack = require("webpack");
const BabiliPlugin = require("babili-webpack-plugin");

module.exports = {
  debug: DEBUG,
  devtool: DEBUG ? "inline-source-map" : "source-map",
  entry: "./src/storage-elements-registerer.js",
  output: {
    path: "./dist",
    filename: DEBUG ? "storage-elements-debug.js" : "storage-elements.js"
  },
  module: {
    loaders: [
      { test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader" }
    ]
  },
  plugins: DEBUG ?
    // debug
  [new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
  ] : // production
  [new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new BabiliPlugin(),
  ],
};
