// src/Controls.js
import React, { useState } from 'react'
// 우리가 만든 useDispatch 훅과 액션 생성자들을 가져옵니다.
import { useDispatch } from '@/custom-redux/lib/hooks'
import {
  decrementAction,
  incrementAction,
  setNameAction,
} from '@/custom-redux/lib/reducers'

// src/CounterDisplay.js
// 우리가 만든 useSelector 훅을 가져옵니다.
import { useSelector } from '@/custom-redux/lib/hooks'
import { RootState } from '@/custom-redux/lib/types'

const CounterDisplay = () => {
  // useSelector를 사용하여 전체 상태(state) 객체에서 'count' 속성만 선택합니다.
  const count = useSelector((state: RootState) => state.count)

  // 이 컴포넌트가 렌더링될 때마다 식별 가능한 로그를 출력합니다.
  console.log('### CounterDisplay 컴포넌트 렌더링됨 ###')

  return (
    <div style={{ border: '1px solid blue', padding: '10px', margin: '10px' }}>
      <h2>카운터 표시</h2>
      <p style={{ fontSize: '1.5em' }}>Count: {count}</p>
    </div>
  )
}

// React.memo로 감싸서 props가 변경되지 않았을 때 불필요한 리렌더링을 방지합니다.
// useSelector가 반환하는 값이 동일하면 React는 이 컴포넌트의 리렌더링을 건너뛸 수 있습니다.
React.memo(CounterDisplay)

// src/NameDisplay.js

const NameDisplay = () => {
  // useSelector를 사용하여 전체 상태(state) 객체에서 'name' 속성만 선택합니다.
  const name = useSelector((state: RootState) => state.name)

  // 이 컴포넌트가 렌더링될 때마다 식별 가능한 로그를 출력합니다.
  console.log('--- NameDisplay 컴포넌트 렌더링됨 ---')

  return (
    <div style={{ border: '1px solid green', padding: '10px', margin: '10px' }}>
      <h2>이름 표시</h2>
      <p style={{ fontSize: '1.5em' }}>Name: {name}</p>
    </div>
  )
}

React.memo(NameDisplay)

function Controls() {
  const dispatch = useDispatch()
  // 이름 입력을 위한 로컬 상태
  const [newName, setNewName] = useState('')

  const handleIncrement = () => {
    console.log('[Controls] INCREMENT 액션 디스패치')
    dispatch(incrementAction())
  }

  const handleDecrement = () => {
    console.log('[Controls] DECREMENT 액션 디스패치')
    dispatch(decrementAction())
  }

  // 이름 변경 액션을 디스패치하는 핸들러
  const handleSetName = () => {
    if (newName.trim()) {
      // 입력값이 비어있지 않은지 확인
      console.log(`[Controls] SET_NAME 액션 디스패치 (payload: ${newName})`)
      dispatch(setNameAction(newName))
      setNewName('') // 입력 필드 초기화
    }
  }

  return (
    <div
      style={{ border: '1px solid orange', padding: '10px', margin: '10px' }}
    >
      <h2>컨트롤</h2>
      <div>
        {/* 카운트 변경 버튼 */}
        <button onClick={handleIncrement} style={{ marginRight: '5px' }}>
          카운트 증가
        </button>
        <button onClick={handleDecrement}>카운트 감소</button>
      </div>
      <div style={{ marginTop: '10px' }}>
        {/* 이름 변경 입력 필드와 버튼 */}
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="새 이름 입력"
          style={{ marginRight: '5px' }}
        />
        <button onClick={handleSetName}>이름 설정</button>
      </div>
    </div>
  )
}

function ReduxTest() {
  return (
    <div>
      <Controls />
      <CounterDisplay />
      <NameDisplay />
    </div>
  )
}

export default ReduxTest
