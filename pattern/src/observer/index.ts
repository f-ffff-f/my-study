type ListenerFunction = (data: any) => void

enum Topic {
  NEW_VIDEO = 'NEW_VIDEO',
  LIVE_STREAMING = 'LIVE_STREAMING',
}

type ListenerMap = {
  [key in Topic]: ListenerFunction[] | ListenerFunction | undefined
}

interface Observer {
  name: string
  notificationHandlers: ListenerMap
}

interface NewVideoPayload {
  title: string
  url: string
  uploader: string
}

interface LiveStreamingPayload {
  startTime: Date
  platform: string
}

/**
 * Subject(주체)
 */
class Youtuber {
  // 구독자별로 함수 목록을 관리
  private observers: Observer[] = []

  addObserver(observer: Observer) {
    console.log(
      `[Youtuber] addObserver: 구독자 ${observer.name}. ${Object.keys(
        observer.notificationHandlers
      ).join(', ')} 알림 설정`
    )
    this.observers.push(observer)
  }

  notify(topic: Topic.NEW_VIDEO, data: NewVideoPayload): void
  notify(topic: Topic.LIVE_STREAMING, data: LiveStreamingPayload): void

  notify(topic: Topic, data: any): void {
    this.observers.forEach(observer => {
      const listener = observer.notificationHandlers[topic]
      if (Array.isArray(listener)) {
        listener.forEach(_listener => (_listener as (d: any) => void)(data))
      } else if (typeof listener === 'function') {
        ;(listener as (d: any) => void)(data)
      }
    })
  }
}

/**
 * Observer(관찰자)
 */
const alice: Observer = {
  name: 'Alice',
  notificationHandlers: {
    [Topic.NEW_VIDEO]: [
      (data: any) => {
        console.log(`[Alice][NEW_VIDEO] Mail: 새 영상 '${data.title}' 업로드됨`)
      },
      (data: any) => {
        console.log(
          `[Alice][NEW_VIDEO] Message: 새 영상 '${data.title}' 업로드됨`
        )
      },
    ],
    [Topic.LIVE_STREAMING]: (data: any) => {
      console.log(
        `[Alice][LIVE_STREAMING] Push notification: 실시간 스트리밍 ${data.startTime} 시작`
      )
    },
  },
}

const bob: Observer = {
  name: 'Bob',
  notificationHandlers: {
    [Topic.NEW_VIDEO]: [
      (data: NewVideoPayload) => {
        console.log(`[Bob][NEW_VIDEO] Mail: 새 영상 '${data.title}' 업로드됨`)
      },
      (data: NewVideoPayload) => {
        console.log(
          `[Bob][NEW_VIDEO] Message: 새 영상 '${data.title}' 업로드됨`
        )
      },
    ],
    [Topic.LIVE_STREAMING]: (data: LiveStreamingPayload) => {
      console.log(
        `[Bob][LIVE_STREAMING] Push notification: 실시간 스트리밍 ${data.startTime} 시작`
      )
    },
  },
}

const charlie: Observer = {
  name: 'Charlie',
  notificationHandlers: {
    [Topic.NEW_VIDEO]: [
      (data: NewVideoPayload) => {
        console.log(
          `[Charlie][NEW_VIDEO] Mail: 새 영상 '${data.title}' 업로드됨`
        )
      },
      (data: NewVideoPayload) => {
        console.log(
          `[Charlie][NEW_VIDEO] Message: 새 영상 '${data.title}' 업로드됨`
        )
      },
      (data: NewVideoPayload) => {
        console.log(
          `[Charlie][NEW_VIDEO] Mail: 새 영상 '${data.title}' 업로드됨`
        )
      },
      (data: NewVideoPayload) => {
        console.log(
          `[Charlie][NEW_VIDEO] Message: 새 영상 '${data.title}' 업로드됨`
        )
      },
    ],
    [Topic.LIVE_STREAMING]: (data: LiveStreamingPayload) => {
      console.log(
        `[Charlie][LIVE_STREAMING] Push notification: 실시간 스트리밍 ${data.startTime} 시작`
      )
    },
  },
}

const youtuber = new Youtuber()

youtuber.addObserver(alice)
youtuber.addObserver(bob)
youtuber.addObserver(charlie)

youtuber.notify(Topic.NEW_VIDEO, {
  title: 'hello world',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  uploader: 'John Doe',
})
youtuber.notify(Topic.LIVE_STREAMING, {
  startTime: new Date(),
  platform: 'YouTube',
})
