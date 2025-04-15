// src/App.js (React.createElement 버전)
import React from 'react'

function App() {
  return React.createElement(
    'div', // 타입: 'div'
    null, // props: 없음 (속성 없음)
    React.createElement(
      // 첫 번째 자식 요소: h1
      'h1', // 타입: 'h1'
      null, // props: 없음
      '안녕하세요! SSR 테스트입니다.' // children: 텍스트 내용
    ),
    React.createElement(
      // 두 번째 자식 요소: button
      'button', // 타입: 'button'
      { onClick: () => alert('클라이언트 측 JavaScript 동작!') }, // props: onClick 이벤트 핸들러
      '클릭해보세요' // children: 버튼 텍스트
    )
  )
}

export default App
