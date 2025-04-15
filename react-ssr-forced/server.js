// server.js
import express from 'express'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import App from './src/App' // 컴포넌트 임포트

const app = express()
const PORT = 3000

// Webpack으로 빌드된 정적 파일(bundle.js) 서빙 설정
app.use(express.static('public'))

app.get('/', (req, res) => {
  // 1. React 컴포넌트를 HTML 문자열로 렌더링
  const appHtml = ReactDOMServer.renderToString(React.createElement(App))

  // 2. 전체 HTML 템플릿 생성
  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div id="root">${appHtml}</div> <script src="/bundle.js"></script> </body>
    </html>
  `

  // 3. HTML 응답 전송
  res.send(html)
})

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`)
})
