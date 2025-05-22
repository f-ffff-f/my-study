// 1. 이벤트 버스 (우체국 역할)
type ListenerFunction = (data?: any) => void

type ListenerType = 'onNewsAlert' | 'onUrgentNotice'

type ListenerMap = {
  [key in ListenerType]?: ListenerFunction
}

interface Person extends ListenerMap {
  name: string
}

class EventBus {
  // 주제(topic)별로 구독자(listener 함수) 목록을 관리
  private topics: { [topic: string]: ListenerFunction[] } = {}

  // 특정 주제를 구독하는 메서드 (우체국에 구독 신청)
  subscribe(topic: string, listener?: ListenerFunction): void {
    if (!listener) {
      throw new Error('Listener function is required')
    }
    // 해당 주제가 없으면 새로 만들기
    if (!this.topics[topic]) {
      this.topics[topic] = []
    }
    // 해당 주제의 리스너 목록에 추가
    this.topics[topic].push(listener)
    console.log(`[구독] "${topic}" 주제에 새로운 구독자가 등록되었습니다.`)
  }

  // 특정 주제로 메시지를 발행하는 메서드 (우체국이 구독자에게 편지 보내기)
  publish(topic: string, data?: any): void {
    // 해당 주제에 구독자가 없으면 아무것도 안 함
    if (!this.topics[topic] || this.topics[topic].length === 0) {
      console.log(`[발행] "${topic}" 주제로 발행했지만, 구독자가 없습니다.`)
      return
    }

    // 해당 주제의 모든 구독자에게 메시지 전달 (편지 배달)
    console.log(`[발행] "${topic}" 주제로 데이터 발행:`, data)
    this.topics[topic].forEach(listener => {
      try {
        listener(data) // 등록된 리스너 함수 실행
      } catch (error) {
        console.error(`[오류] "${topic}" 주제 리스너 실행 중 오류:`, error)
      }
    })
  }

  // 구독 취소 메서드
  unsubscribe(topic: string, listenerToRemove: ListenerFunction): void {
    if (!this.topics[topic]) {
      return // 해당 주제 없음
    }
    // 리스너 목록에서 제거
    this.topics[topic] = this.topics[topic].filter(
      listener => listener !== listenerToRemove
    )
    console.log(`[구독 취소] "${topic}" 주제에서 구독자가 제거되었습니다.`)
  }
}

// --- 예제 실행 ---

// 1. 중앙 이벤트 버스(우체국) 인스턴스 생성
const eventBus = new EventBus()

// 2. 구독자(편지 받는 사람) 정의
const alice: Person = {
  name: 'Alice',
  onNewsAlert: (data: any) => {
    console.log(
      `  -> ${alice.name}뉴스 알림 받음: 뉴스를 확인합니다. ${data.headline}`
    )
  },
}

const bob: Person = {
  name: 'Bob',
  onUrgentNotice: (data: any) => {
    console.log(
      `  -> ${bob.name}긴급 공지 받음: 공지를 확인합니다. ${data.message}`
    )
  },
  onNewsAlert: (data: any) => {
    console.log(
      `  -> ${bob.name}뉴스 알림 받음: 뉴스를 확인합니다. ${data.headline}`
    )
  },
}

// 3. 구독자들을 이벤트 버스에 등록 (우체국에 구독 신청)
eventBus.subscribe('news-alert', alice.onNewsAlert) // Alice는 'news-alert' 구독
eventBus.subscribe('urgent-notice', bob.onUrgentNotice) // Bob은 'urgent-notice' 구독
eventBus.subscribe('news-alert', bob.onNewsAlert) // Bob도 'news-alert' 구독

console.log('---------------------------')

// 4. 발행자(편지 보내는 사람)가 메시지 발행 (우체국에 편지 보내기)
// 발행자는 Alice나 Bob을 전혀 모릅니다. 그냥 주제와 데이터만 버스에 던집니다.
eventBus.publish('news-alert', { headline: '속보: 중요한 이벤트 발생!' })
// 결과: 'news-alert'를 구독한 Alice와 Bob 모두 메시지를 받음

console.log('---------------------------')

eventBus.publish('urgent-notice', { message: '긴급 서버 점검 안내' })
// 결과: 'urgent-notice'를 구독한 Bob만 메시지를 받음

console.log('---------------------------')

eventBus.publish('weather-update', { forecast: '내일은 맑음' })
// 결과: 'weather-update'를 구독한 사람이 없으므로 아무 일도 일어나지 않음

// Bob이 뉴스 알림 구독 취소
// messageBus.unsubscribe('news-alert', bob.onNewsAlert);
// messageBus.publish('news-alert', { headline: "속보 2: 또 다른 이벤트!" });
// 결과: 이제 Alice만 뉴스 알림을 받음
