enum EventType {
  NEW_VIDEO = 'NEW_VIDEO',
  LIVE_STREAMING = 'LIVE_STREAMING',
}

type Listener = (data: any) => void

type ListenerMap = {
  [key in EventType]: Listener[] | Listener | undefined
}

interface Person {
  name: string
  notificationConfig: ListenerMap
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

class Youtuber {
  private observers: Person[] = []

  addObserver(observer: Person) {
    console.log(
      `[Youtuber] addObserver: 구독자 ${observer.name}. ${Object.keys(
        observer.notificationConfig
      ).join(', ')} 알림 설정`
    )
    this.observers.push(observer)
  }

  notify(type: EventType.NEW_VIDEO, data: NewVideoPayload): void
  notify(type: EventType.LIVE_STREAMING, data: LiveStreamingPayload): void

  notify(type: EventType, data: any): void {
    this.observers.forEach(observer => {
      const listener = observer.notificationConfig[type]
      if (Array.isArray(listener)) {
        listener.forEach(_listener => (_listener as (d: any) => void)(data))
      } else if (typeof listener === 'function') {
        ;(listener as (d: any) => void)(data)
      }
    })
  }
}

const alice: Person = {
  name: 'Alice',
  notificationConfig: {
    [EventType.NEW_VIDEO]: [
      (data: any) => {
        console.log(`[Alice][NEW_VIDEO] Mail: 새 영상 '${data.title}' 업로드됨`)
      },
      (data: any) => {
        console.log(
          `[Alice][NEW_VIDEO] Message: 새 영상 '${data.title}' 업로드됨`
        )
      },
    ],
    [EventType.LIVE_STREAMING]: (data: any) => {
      console.log(
        `[Alice][LIVE_STREAMING] Push notification: 실시간 스트리밍 ${data.startTime} 시작`
      )
    },
  },
}

const bob: Person = {
  name: 'Bob',
  notificationConfig: {
    [EventType.NEW_VIDEO]: [
      (data: NewVideoPayload) => {
        console.log(`[Bob][NEW_VIDEO] Mail: 새 영상 '${data.title}' 업로드됨`)
      },
      (data: NewVideoPayload) => {
        console.log(
          `[Bob][NEW_VIDEO] Message: 새 영상 '${data.title}' 업로드됨`
        )
      },
    ],
    [EventType.LIVE_STREAMING]: (data: LiveStreamingPayload) => {
      console.log(
        `[Bob][LIVE_STREAMING] Push notification: 실시간 스트리밍 ${data.startTime} 시작`
      )
    },
  },
}

const charlie: Person = {
  name: 'Charlie',
  notificationConfig: {
    [EventType.NEW_VIDEO]: [
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
    [EventType.LIVE_STREAMING]: (data: LiveStreamingPayload) => {
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

youtuber.notify(EventType.NEW_VIDEO, {
  title: 'hello world',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  uploader: 'John Doe',
})
youtuber.notify(EventType.LIVE_STREAMING, {
  startTime: new Date(),
  platform: 'YouTube',
})
