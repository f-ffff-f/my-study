// src/custom-react-redux/Provider.js
import { ReactNode } from 'react'
import { RootState, Store } from '@/custom-redux/lib/types'
import ReactReduxContext from '@/custom-redux/Context'

// Provider 컴포넌트는 store를 prop으로 받습니다.
// 이 컴포넌트는 자식 컴포넌트(children)들에게 Context를 통해 store 값을 전달합니다.
const Provider = ({
  store,
  children,
}: {
  store: Store<RootState>
  children: ReactNode
}) => {
  return (
    // ReactReduxContext.Provider를 사용하여 value prop으로 store를 전달합니다.
    <ReactReduxContext.Provider value={store}>
      {children} {/* Provider로 감싸진 하위 컴포넌트들이 렌더링되는 위치 */}
    </ReactReduxContext.Provider>
  )
}

export default Provider
