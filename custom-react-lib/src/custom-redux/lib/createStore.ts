// src/custom-redux/createStore.js
import { ActionType, Store } from '@/custom-redux/lib/types'

function createStore<TState>(
  reducer: (state: TState, action: ActionType) => TState,
  initialState?: TState
): Store<TState> {
  // 1. 스토어의 상태를 저장할 변수입니다.
  // initialState가 주어지면 그 값을 사용하고, 아니면 undefined로 시작합니다.
  let currentState = initialState

  // 2. 상태 변경을 구독할 리스너(함수)들을 저장할 배열입니다.
  const listeners: Array<() => void> = []

  // 3. 현재 상태를 반환하는 메소드입니다.
  function getState(): TState {
    return currentState as TState
  }

  // 4. 액션을 받아 리듀서를 실행하고 상태를 업데이트하는 메소드입니다.
  function dispatch(action: ActionType): ActionType {
    // 리듀서 함수를 호출하여 새로운 상태를 계산합니다.
    // 현재 상태(currentState)와 액션(action)을 인자로 전달합니다.
    currentState = reducer(currentState as TState, action)

    // 상태가 변경되었으므로, 등록된 모든 리스너 함수들을 실행합니다.
    // slice()를 사용해 배열 복사본을 순회하는 것이 안전합니다.
    // (리스너 함수 안에서 구독 취소(unsubscribe)가 일어날 경우를 대비)
    const currentListeners = listeners.slice()
    currentListeners.forEach(listener => listener())

    // 디스패치된 액션을 반환하는 것은 Redux의 관례입니다.
    return action
  }

  // 5. 상태 변경을 감지할 리스너 함수를 등록하는 메소드입니다.
  function subscribe(listener: () => void): () => void {
    // 리스너 배열에 전달받은 함수를 추가합니다.
    listeners.push(listener)

    // 구독 취소(unsubscribe) 함수를 반환합니다.
    // 이 함수를 호출하면 해당 리스너가 배열에서 제거됩니다.
    return function unsubscribe() {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        // 리스너 배열에서 해당 리스너를 제거합니다.
        listeners.splice(index, 1)
      }
    }
  }

  // 6. 스토어가 생성될 때, 초기 상태를 설정하기 위해 임의의 액션으로 dispatch를 한번 호출합니다.
  // 이는 reducer가 초기 상태 값을 반환하도록 하기 위함입니다. (initialState가 undefined일 경우)
  // Redux 내부적으로 사용하는 것과 유사한 액션 타입을 사용합니다.
  dispatch({ type: '@@CUSTOM_REDUX/INIT' } as ActionType)

  // 7. 스토어 객체를 반환합니다. 이 객체는 외부에 공개될 메소드들을 포함합니다.
  return {
    getState,
    dispatch,
    subscribe,
  }
}

// 다른 파일에서 이 함수를 사용할 수 있도록 export 합니다.
export default createStore
