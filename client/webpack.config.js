const webpack = require("webpack");

module.exports = {
  resolve: {
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "os": require.resolve("os-browserify/browser")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"]
    })
  ]
};
