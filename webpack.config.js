const path = require('path');
const webpack = require('webpack');
const HtmlPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, './src'),
  entry: ['./js/index.js', './css/styles.css'],
  output: {
    filename: 'timber-harvest.js',
    path: path.resolve(__dirname, 'public')
  },
  plugins: [
    new HtmlPlugin({template: 'index.html',inject : true}),
    new ExtractTextPlugin('styles.css'),
    new webpack.ProvidePlugin({$: 'jquery', jQuery: 'jquery'})
  ],
  devServer: {
    contentBase: './public',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({fallback: "style-loader", use: [{loader: "css-loader"}]}),
      },
      {
        test: /\.(png|gif|jpg|jpeg|cur)$/,
        use: 'file-loader?name=./images/[name].[ext]'
      },
      {
        test: /\.(ico)$/,
        use: 'file-loader?name=[name].[ext]'
      },
      {
        test: /CNAME$/,
        use: 'file-loader?name=[name]'
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'url-loader?limit=10000&mimetype=application/font-woff&name=./fonts/[name].[ext]'
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'file-loader?name=./fonts/[name].[ext]'
      },
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: ['babel-loader', 'eslint-loader']

      },
      {
        test: /\.html$/,
        use: 'html-loader'
      },
    ]
  }
};
