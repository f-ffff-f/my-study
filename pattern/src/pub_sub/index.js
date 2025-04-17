"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bob = exports.alice = exports.SimpleEventBus = void 0;
class SimpleEventBus {
    constructor() {
        // 주제(topic)별로 구독자(listener 함수) 목록을 관리
        this.topics = {};
    }
    // 특정 주제를 구독하는 메서드 (우체국에 구독 신청)
    subscribe(topic, listener) {
        // 해당 주제가 없으면 새로 만들기
        if (!this.topics[topic]) {
            this.topics[topic] = [];
        }
        // 해당 주제의 리스너 목록에 추가
        this.topics[topic].push(listener);
        console.log(`[구독] "${topic}" 주제에 새로운 구독자가 등록되었습니다.`);
    }
    // 특정 주제로 메시지를 발행하는 메서드 (우체국에 편지 보내기)
    publish(topic, data) {
        // 해당 주제에 구독자가 없으면 아무것도 안 함
        if (!this.topics[topic] || this.topics[topic].length === 0) {
            console.log(`[발행] "${topic}" 주제로 발행했지만, 구독자가 없습니다.`);
            return;
        }
        // 해당 주제의 모든 구독자에게 메시지 전달 (편지 배달)
        console.log(`[발행] "${topic}" 주제로 데이터 발행:`, data);
        this.topics[topic].forEach(listener => {
            try {
                listener(data); // 등록된 리스너 함수 실행
            }
            catch (error) {
                console.error(`[오류] "${topic}" 주제 리스너 실행 중 오류:`, error);
            }
        });
    }
    // (선택적) 구독 취소 메서드
    unsubscribe(topic, listenerToRemove) {
        if (!this.topics[topic]) {
            return; // 해당 주제 없음
        }
        // 리스너 목록에서 제거
        this.topics[topic] = this.topics[topic].filter(listener => listener !== listenerToRemove);
        console.log(`[구독 취소] "${topic}" 주제에서 구독자가 제거되었습니다.`);
    }
}
exports.SimpleEventBus = SimpleEventBus;
// --- 예제 실행 ---
// 1. 중앙 이벤트 버스(우체국) 인스턴스 생성
const messageBus = new SimpleEventBus();
// 2. 구독자(편지 받는 사람) 정의
const alice = {
    name: 'Alice',
    onNewsAlert: (data) => {
        console.log(`  -> ${alice.name}뉴스 알림 받음: ${data.headline}`);
    },
};
exports.alice = alice;
const bob = {
    name: 'Bob',
    onUrgentNotice: (data) => {
        console.log(`  -> ${bob.name}긴급 공지 받음: ${data.message}`);
    },
    onNewsAlert: (data) => {
        console.log(`  -> ${bob.name}뉴스 알림 받음: ${data.headline}`);
    },
};
exports.bob = bob;
// 3. 구독자들을 이벤트 버스에 등록 (우체국에 구독 신청)
messageBus.subscribe('news-alert', alice.onNewsAlert); // Alice는 'news-alert' 구독
messageBus.subscribe('urgent-notice', bob.onUrgentNotice); // Bob은 'urgent-notice' 구독
messageBus.subscribe('news-alert', bob.onNewsAlert); // Bob도 'news-alert' 구독
console.log('---------------------------');
// 4. 발행자(편지 보내는 사람)가 메시지 발행 (우체국에 편지 보내기)
// 발행자는 Alice나 Bob을 전혀 모릅니다. 그냥 주제와 데이터만 버스에 던집니다.
messageBus.publish('news-alert', { headline: '속보: 중요한 이벤트 발생!' });
// 결과: 'news-alert'를 구독한 Alice와 Bob 모두 메시지를 받음
console.log('---------------------------');
messageBus.publish('urgent-notice', { message: '긴급 서버 점검 안내' });
// 결과: 'urgent-notice'를 구독한 Bob만 메시지를 받음
console.log('---------------------------');
messageBus.publish('weather-update', { forecast: '내일은 맑음' });
