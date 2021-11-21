const path = require('path')
const HtmlPlugin = require('html-webpack-plugin')

const resolve = p => path.resolve(__dirname, p)

module.exports = {
  mode: process.env.NODE_ENV,
  entry: './src/main.js',
  output: {
    path: resolve('dist'),
    filename: 'bundle.[hash].js'
  },
  plugins: [
    new HtmlPlugin({
      template: resolve('./index.html')
    })
  ],
  module: {
    rules: [
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      }
    ]
  },
  devServer: {
    port: 9527,
    open: true
  }
}