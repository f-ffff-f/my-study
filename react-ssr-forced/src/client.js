// src/client.js
import React from 'react'
import ReactDOM from 'react-dom/client' // React 18+
import App from './App'

// React 18+ hydrateRoot 사용
ReactDOM.hydrateRoot(
  document.getElementById('root'), // 첫 번째 인자: 하이드레이션 대상 DOM 노드
  React.createElement(
    // 두 번째 인자: React 요소
    React.StrictMode, // 타입: React.StrictMode 컴포넌트
    null, // props: 없음
    React.createElement(App, null) // children: App 컴포넌트 요소 (props 없음)
  )
)

// React 17 이하 버전에서는 ReactDOM.hydrate 사용
// import ReactDOM from 'react-dom';
// ReactDOM.hydrate(<App />, document.getElementById('root'));
