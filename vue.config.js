// vue.config.js

/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  productionSourceMap: false,
  devServer: {
    host: 'localhost',
    port: 8443,
    https: true,
    hot: false,
    liveReload: true
  }
}
