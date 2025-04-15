// 스토어 인스턴스를 애플리케이션 전역으로 공유하기 위한 Context 객체를 생성합니다.

import React from 'react'
import { RootState, Store } from './lib/types'

// 초기값은 null로 설정합니다. Provider가 없을 경우를 대비합니다.
const ReactReduxContext = React.createContext<Store<RootState> | null>(null)

export default ReactReduxContext
