// vue.config.js
module.exports = {
  chainWebpack: (config) => {
    const svgRule = config.module.rule('svg');
    svgRule.uses.clear();
    svgRule
      .test(/\.svg$/)
      .use('vue-svg-loader')
      .loader('vue-svg-loader');
  }
}