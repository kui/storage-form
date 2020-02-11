const path = require("path");
const DEBUG = process.env.NODE_ENV !== "production";

const plugins = [];

module.exports = {
  mode: DEBUG ? "development" : "production",
  devtool: DEBUG ? "inline-source-map" : "source-map",
  entry: "./src/storage-elements-registerer.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: DEBUG ? "storage-elements-debug.js" : "storage-elements.js"
  },
  module: {
    rules: [
      { test: /\.m?js$/,
        exclude: /node_modules/,
        loader: "babel-loader" }
    ]
  },
  plugins,
};
