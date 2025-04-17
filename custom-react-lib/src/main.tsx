import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import Provider from './custom-redux/Provider'
import store from './custom-redux/lib/store' // 스토어 인스턴스 가져오기

// 1. DOM에서 root 요소를 찾습니다
// 2. React의 createRoot API를 사용하여 React 루트를 생성합니다
// 3. React 컴포넌트를 루트에 렌더링합니다
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
