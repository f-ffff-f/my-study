// src/store.js
import createStore from './createStore'
import rootReducer from './reducers'
// 나중에 애플리케이션이 커지면 여러 리듀서를 합친 '루트 리듀서'를 가져오게 됩니다.
// 예: import rootReducer from './reducers';

console.log('[Store Module] 스토어 인스턴스 생성 중...')

// createStore 함수와 리듀서를 사용하여 애플리케이션의 단일 스토어를 생성합니다.
// 지금은 rootReducer 하나만 사용합니다.
const store = createStore(rootReducer)
// 추후 루트 리듀서를 사용한다면: const store = createStore(rootReducer);

console.log('[Store Module] 스토어 인스턴스 생성 완료.')

// 생성된 스토어 인스턴스를 모듈의 기본 내보내기(default export)로 지정합니다.
// 이렇게 하면 다른 파일에서 import store from './store' 와 같이 가져올 수 있습니다.
export default store
