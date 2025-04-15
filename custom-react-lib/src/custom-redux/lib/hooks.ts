// src/custom-react-redux/hooks.js
import { useContext, useSyncExternalStore } from 'react'
import ReactReduxContext from '@/custom-redux/Context'
import { RootState, AppDispatch } from '@/custom-redux/lib/types'

/**
 * useDispatch 훅: 스토어의 dispatch 함수를 반환합니다.
 */
export function useDispatch(): AppDispatch {
  // useContext 훅을 사용하여 Provider로부터 store 객체를 가져옵니다.
  const store = useContext(ReactReduxContext)
  if (!store) {
    // Provider 외부에서 사용될 경우 에러를 발생시킵니다.
    throw new Error('useDispatch must be used within a <Provider>')
  }
  // 스토어 객체의 dispatch 함수를 반환합니다.
  return store.dispatch
}

/**
 * useSelector 훅 (React 18+ 권장 방식: useSyncExternalStore 사용):
 * 스토어 상태의 일부를 선택하고, 해당 부분이 변경될 때 컴포넌트 리렌더링을 유발합니다.
 *
 * @param selector 상태를 선택하는 함수 (state => state.someValue)
 * @returns 선택된 상태 값
 */
export function useSelector<T>(selector: (state: RootState) => T): T {
  const store = useContext(ReactReduxContext)
  if (!store) {
    throw new Error('useSelector must be used within a <Provider>')
  }

  // useSyncExternalStore: 외부 스토어(Redux 등)를 React와 동기화하는 공식적인 방법
  // subscribe: 스토어 변경 시 호출될 콜백을 등록하는 함수 전달
  // getSnapshot: 현재 스토어 상태에서 원하는 값을 반환하는 함수 전달
  const selectedState = useSyncExternalStore(
    store.subscribe, // 스토어 구독 함수
    () => selector(store.getState()) // 최신 상태에서 값 선택
    // getServerSnapshot (옵션): 서버 렌더링 시 초기 상태 제공 함수
  )

  return selectedState
}
