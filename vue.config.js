const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  configureWebpack: () => {
    // devtool: 'source-map'
    let config = {};

    if (process.env.NODE_ENV == 'development') {
      config.devtool = 'source-map';
    }
    config.optimization = {
        minimizer: [new TerserPlugin()]
    };

    return config;
  }
}
