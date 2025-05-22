// src/event_emitter_dom_like/index.ts

/**
 * 이벤트 핸들러 함수의 타입을 정의합니다.
 * 모든 핸들러 함수는 선택적으로 데이터를 받을 수 있습니다.
 */
type EventHandler = (data?: any) => void

/**
 * 이벤트 이름을 문자열로 정의합니다.
 * 실제 DOM 이벤트 이름처럼 'click', 'input', 'submit' 등으로 사용할 수 있습니다.
 * 예: 'button:click' | 'input:change' | 'form:submit'
 */
type EventName = string

/**
 * EventEmitter (이벤트 이미터 클래스)
 *
 * 특정 UI 상호작용이나 애플리케이션 내의 상태 변경 같은 '이벤트'가 발생했을 때
 * 등록된 '핸들러'들에게 알림을 보내는 역할을 합니다.
 * DOM의 EventTarget과 유사하게 'addEventListener', 'removeEventListener', 'emit' 메서드를 제공합니다.
 */
class EventEmitter {
  /**
   * 이벤트 이름(키)과 해당 이벤트에 등록된 핸들러 함수들의 배열(값)을 저장하는 객체입니다.
   * 예: { 'button:click': [handler1, handler2], 'input:change': [handler3] }
   */
  private eventListeners: Record<EventName, EventHandler[]> = {}

  constructor() {
    console.log('[EventEmitter] EventEmitter 인스턴스가 생성되었습니다.')
  }

  /**
   * 특정 이벤트에 대한 핸들러 함수를 등록합니다.
   * DOM의 `element.addEventListener(type, listener)`와 유사합니다.
   *
   * @param eventName 등록할 이벤트의 이름 (예: 'button:click')
   * @param eventHandler 이벤트 발생 시 실행될 핸들러 함수
   */
  public addEventListener(
    eventName: EventName,
    eventHandler: EventHandler
  ): void {
    // 해당 이벤트 이름으로 등록된 핸들러 목록이 없으면 새로 배열을 생성합니다.
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = []
    }
    // 핸들러 목록에 새로운 핸들러를 추가합니다.
    this.eventListeners[eventName].push(eventHandler)
    console.log(
      `[EventEmitter] 핸들러 등록: "${eventName}" 이벤트에 새로운 핸들러가 추가되었습니다.`
    )
  }

  /**
   * 특정 이벤트에 등록된 핸들러 함수를 제거합니다.
   * DOM의 `element.removeEventListener(type, listener)`와 유사합니다.
   *
   * @param eventName 제거할 핸들러가 등록된 이벤트의 이름
   * @param eventHandlerToRemove 제거할 핸들러 함수 (등록 시 사용했던 바로 그 함수여야 합니다)
   */
  public removeEventListener(
    eventName: EventName,
    eventHandlerToRemove: EventHandler
  ): void {
    const handlers = this.eventListeners[eventName]
    // 해당 이벤트에 핸들러가 등록되어 있지 않거나, 핸들러 목록이 비어있으면 아무 작업도 하지 않습니다.
    if (!handlers || handlers.length === 0) {
      console.log(
        `[EventEmitter] 핸들러 제거 시도: "${eventName}" 이벤트에 핸들러가 없거나, 지정된 핸들러를 찾을 수 없습니다.`
      )
      return
    }

    const initialLength = handlers.length
    // 핸들러 목록에서 특정 핸들러를 제거합니다.
    // filter 메서드를 사용하여 제거할 핸들러를 제외한 새로운 배열로 교체합니다.
    this.eventListeners[eventName] = handlers.filter(
      handler => handler !== eventHandlerToRemove
    )

    if (handlers.length === initialLength) {
      console.log(
        `[EventEmitter] 핸들러 제거 실패: "${eventName}" 이벤트에서 지정된 핸들러를 찾지 못했습니다.`
      )
    } else {
      console.log(
        `[EventEmitter] 핸들러 제거 완료: "${eventName}" 이벤트에서 핸들러가 성공적으로 제거되었습니다.`
      )
    }
  }

  /**
   * 특정 이벤트를 발생시킵니다. (DOM의 `element.dispatchEvent(event)`와 유사한 역할)
   * 해당 이벤트에 등록된 모든 핸들러 함수들이 실행됩니다.
   *
   * @param eventName 발생시킬 이벤트의 이름
   * @param data 핸들러에게 전달할 데이터 (선택 사항, DOM의 Event 객체와 유사한 정보 전달 가능)
   */
  public emit(eventName: EventName, data?: any): void {
    const handlers = this.eventListeners[eventName]

    // 해당 이벤트에 등록된 핸들러가 없으면 아무 작업도 하지 않습니다.
    if (!handlers || handlers.length === 0) {
      console.log(
        `[EventEmitter] 이벤트 발생: "${eventName}" 이벤트에는 등록된 핸들러가 없습니다.`
      )
      return
    }

    console.log(
      `[EventEmitter] 이벤트 발생: "${eventName}" 이벤트가 다음 데이터와 함께 발생했습니다:`,
      data
    )
    // 핸들러 실행 중 배열이 변경될 수 있으므로, 원본 배열을 복사하여 순회합니다.
    // (예: 핸들러 내에서 자신을 removeEventListener 하는 경우)
    ;[...handlers].forEach(handler => {
      try {
        handler(data) // 핸들러 함수 실행
      } catch (error) {
        console.error(
          `[EventEmitter] 오류: "${eventName}" 이벤트 핸들러 실행 중 오류 발생:`,
          error
        )
      }
    })
    console.log(
      `[EventEmitter] 이벤트 처리 완료: "${eventName}" 이벤트의 모든 등록된 핸들러가 실행되었습니다.`
    )
  }
}

// --- 브라우저 DOM 이벤트 스타일 사용 예시 ---

// 1. UI 관련 이벤트를 처리할 EventEmitter 인스턴스 생성
const uiEvents = new EventEmitter()

// 2. 이벤트 핸들러(리스너) 정의
const handleLoginButtonClick = (eventData?: {
  clickTime: number
  userId?: string
}) => {
  console.log(
    `  LGN_BTN_CLICK: '로그인' 버튼 클릭됨. 시간: ${new Date(
      eventData?.clickTime || 0
    ).toLocaleTimeString()}, 사용자 ID: ${eventData?.userId || '게스트'}`
  )
  // 실제 애플리케이션에서는 로그인 API 호출, 사용자 인터페이스 변경 등의 로직 수행
}

const handleUsernameInput = (eventData?: {
  value: string
  targetId: string
}) => {
  console.log(
    `  USR_INPUT_CHANGE: 입력 필드 '${eventData?.targetId}'의 값 변경됨: "${eventData?.value}"`
  )
  // 입력 값 유효성 검사, 실시간 미리보기 업데이트 등의 로직 수행
}

const handleDataLoadSuccess = (eventData?: {
  items: string[]
  count: number
}) => {
  console.log(
    `  DATA_LOAD_SUCCESS: 데이터 로딩 성공! ${
      eventData?.count
    }개의 아이템 로드됨: [${eventData?.items.join(', ')}]`
  )
  // UI에 데이터 표시
}

const trackUserAction = (actionName: string) => (data?: any) => {
  console.log(
    `  TRACKING: 사용자 액션 '${actionName}' 발생. 관련 데이터:`,
    data
  )
}

// 3. UI 요소(가상)의 이벤트에 핸들러 등록
uiEvents.addEventListener('button:login:click', handleLoginButtonClick)
uiEvents.addEventListener('input:username:change', handleUsernameInput)
uiEvents.addEventListener('api:data:loadSuccess', handleDataLoadSuccess)

// 하나의 이벤트에 여러 핸들러 등록 가능
const loginActionTracker = trackUserAction('LoginButtonClick')
uiEvents.addEventListener('button:login:click', loginActionTracker)

console.log('\n--- 가상 UI 상호작용 시작 ---')

// 4. 가상 UI 이벤트 발생 (예: 사용자가 버튼을 클릭하거나 값을 입력)
uiEvents.emit('button:login:click', {
  clickTime: Date.now(),
  userId: 'dev_user',
})
// 결과: handleLoginButtonClick와 loginActionTracker 핸들러가 모두 실행됨

console.log('---')

uiEvents.emit('input:username:change', {
  value: 'JohnDoe',
  targetId: 'username-field',
})
// 결과: handleUsernameInput 핸들러 실행됨

console.log('---')

uiEvents.emit('api:data:loadSuccess', {
  items: ['Apple', 'Banana', 'Cherry'],
  count: 3,
})
// 결과: handleDataLoadSuccess 핸들러 실행됨

console.log(
  '\n--- button:login:click 이벤트에서 loginActionTracker 핸들러 제거 ---'
)
uiEvents.removeEventListener('button:login:click', loginActionTracker)

console.log('\n--- 다시 로그인 버튼 클릭 이벤트 발생 ---')
uiEvents.emit('button:login:click', { clickTime: Date.now() })
// 결과: 이제 handleLoginButtonClick 핸들러만 실행됨 (loginActionTracker는 제거되었으므로)

console.log('---')
// 핸들러가 등록되지 않은 이벤트 발생
uiEvents.emit('button:logout:click', { reason: 'user_initiated' })
// 결과: "'button:logout:click' 이벤트에는 등록된 핸들러가 없습니다." 메시지 출력

export { EventEmitter, EventHandler, EventName }
