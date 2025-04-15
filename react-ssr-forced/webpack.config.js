// webpack.config.js
const path = require('path')

module.exports = {
  mode: 'development', // 개발 모드
  entry: './src/client.js', // 클라이언트 진입점 파일
  output: {
    path: path.resolve(__dirname, 'public'), // 번들 결과물 저장 경로
    filename: 'bundle.js', // 번들 파일 이름
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // .js와 .jsx 파일 모두 처리
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // babel-loader 사용
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'], // .js, .jsx 확장자 처리
    enforceExtension: false,
  },
}
