"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Youtuber = void 0;
var EventType;
(function (EventType) {
    EventType["NEW_VIDEO"] = "NEW_VIDEO";
    EventType["LIVE_STREAMING"] = "LIVE_STREAMING";
})(EventType || (EventType = {}));
class Youtuber {
    constructor() {
        this.observers = [];
    }
    addObserver(observer) {
        console.log(`[Youtuber] addObserver: 구독자 ${observer.name}. ${Object.keys(observer.notificationConfig).join(', ')} 알림 설정`);
        this.observers.push(observer);
    }
    notify(type, data) {
        this.observers.forEach(observer => {
            const handlerOrHandlers = observer.notificationConfig[type];
            if (Array.isArray(handlerOrHandlers)) {
                handlerOrHandlers.forEach(handler => handler(data));
            }
            else if (typeof handlerOrHandlers === 'function') {
                ;
                handlerOrHandlers(data);
            }
        });
    }
}
exports.Youtuber = Youtuber;
const alice = {
    name: 'Alice',
    notificationConfig: {
        NEW_VIDEO: [
            (data) => {
                console.log(`[Alice][NEW_VIDEO] Mail: 새 영상 '${data.title}' 업로드됨`);
            },
            (data) => {
                console.log(`[Alice][NEW_VIDEO] Message: 새 영상 '${data.title}' 업로드됨`);
            },
        ],
    },
};
const bob = {
    name: 'Bob',
    notificationConfig: {
        NEW_VIDEO: [
            (data) => {
                console.log(`[Bob][NEW_VIDEO] Mail: 새 영상 '${data.title}' 업로드됨`);
            },
            (data) => {
                console.log(`[Bob][NEW_VIDEO] Message: 새 영상 '${data.title}' 업로드됨`);
            },
        ],
        LIVE_STREAMING: (data) => {
            console.log(`[Bob][LIVE_STREAMING] Push notification: 실시간 스트리밍 ${data.startTime} 시작`);
        },
    },
};
const charlie = {
    name: 'Charlie',
    notificationConfig: {
        NEW_VIDEO: [
            (data) => {
                console.log(`[Charlie][NEW_VIDEO] Mail: 새 영상 '${data.title}' 업로드됨`);
            },
            (data) => {
                console.log(`[Charlie][NEW_VIDEO] Message: 새 영상 '${data.title}' 업로드됨`);
            },
            (data) => {
                console.log(`[Charlie][NEW_VIDEO] Mail: 새 영상 '${data.title}' 업로드됨`);
            },
            (data) => {
                console.log(`[Charlie][NEW_VIDEO] Message: 새 영상 '${data.title}' 업로드됨`);
            },
        ],
        LIVE_STREAMING: (data) => {
            console.log(`[Charlie][LIVE_STREAMING] Push notification: 실시간 스트리밍 ${data.startTime} 시작`);
        },
    },
};
const youtuber = new Youtuber();
youtuber.addObserver(alice);
youtuber.addObserver(bob);
youtuber.addObserver(charlie);
youtuber.notify(EventType.NEW_VIDEO, {
    title: 'hello world',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    uploader: 'John Doe',
});
youtuber.notify(EventType.LIVE_STREAMING, {
    startTime: new Date(),
    platform: 'YouTube',
});
