/**
 * Redux Store의 상태 타입 정의
 */
export interface RootState {
  count: number
  name: string
}

/**
 * Redux 액션 타입 정의
 */
export type ActionType =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_NAME'; payload: string }
  | { type: '@@CUSTOM_REDUX/INIT' }

/**
 * Redux 디스패치 함수 타입 정의
 */
export type AppDispatch = (action: ActionType) => void

/**
 * Redux 스토어 타입 정의
 */
export interface Store<TState> {
  getState: () => TState
  dispatch: AppDispatch
  subscribe: (listener: () => void) => () => void
}
