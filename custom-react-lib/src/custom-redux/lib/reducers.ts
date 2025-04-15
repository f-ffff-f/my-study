// src/custom-redux/reducers.js
import { ActionType } from '@/custom-redux/lib/types'

// 1. 초기 상태를 객체 형태로 변경합니다.
const initialState = {
  count: 0,
  name: '초기 이름', // 이름 상태 추가
}

// 2. 리듀서 이름을 좀 더 범용적인 이름(예: rootReducer)으로 변경합니다.
function rootReducer(state = initialState, action: ActionType) {
  console.log('리듀서 호출됨 / 상태:', state, '/ 액션:', action)

  switch (action.type) {
    case 'INCREMENT':
      // 3. 상태 객체의 불변성을 유지하면서 업데이트합니다.
      //    기존 상태를 복사(...state)하고, 변경할 부분(count)만 덮어씁니다.
      return {
        ...state, // name 등 다른 상태는 그대로 유지
        count: state.count + 1,
      }
    case 'DECREMENT':
      return {
        ...state,
        count: state.count - 1,
      }
    // 4. 이름을 변경하는 새로운 액션 타입을 추가합니다.
    case 'SET_NAME':
      return {
        ...state, // count 등 다른 상태는 그대로 유지
        name: action.payload, // payload로 전달된 새 이름으로 변경
      }
    default:
      return state
  }
}

// 5. 변경된 리듀서를 export 합니다.
export default rootReducer

// 6. 액션 생성자도 업데이트/추가합니다.
export const incrementAction = () => ({ type: 'INCREMENT' as const })
export const decrementAction = () => ({ type: 'DECREMENT' as const })
export const setNameAction = (name: string) => ({
  type: 'SET_NAME' as const,
  payload: name,
})
