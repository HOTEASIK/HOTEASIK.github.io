---
title: QoS Reliability
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 통신심화]
tags: [통신심화, QoS, 실습]
---
# QoS Reliability

## 정의·핵심
- **정의**: 신뢰성(reliability) — 빠짐없이 전달할 것인가, 좀 놓치더라도 빠르게 전달할 것인가 (실습 2차시).
- **RELIABLE**: 한 개도 놓치지 않도록 보장 — 받는 쪽이 확인을 보내고, 못 받으면 보내는 쪽이 다시 보낸다(재전송). **TCP를 닮았다**. 절차가 많아 느려질 수 있다. 명령·지도에.
- **BEST_EFFORT**: 「최선을 다하되 보장은 안 함」 — 던지고 끝이라 가볍다. 네트워크가 흔들리면 일부가 빠진다. **UDP를 닮았다**. 센서값·영상처럼 어차피 다음 값이 곧 오는 데이터에.
- **고르는 기준 — 데이터 「한 개의 무게」**: 라이다 한 프레임이 빠지면 0.05초 뒤 다음 프레임이 온다. 「정지!」가 빠지면 다음 명령까지 로봇이 계속 달린다.
- **전송 계층과는 다른 층위**: 토픽 단위로 따로 고른다 — 같은 로봇 안에서 라이다는 BEST_EFFORT, 명령은 RELIABLE로 동시에 굴러간다.
- **강약**: RELIABLE이 강한 약속. 발행 BEST_EFFORT + 구독 RELIABLE만 끊긴다(넷 중 하나) → [[QoS 호환 규칙]].
- **가장 흔한 함정**: 센서 드라이버는 BEST_EFFORT로 발행하는데 내 구독 노드는 아무 설정 없이 기본값(RELIABLE) → 수신 0. 경고 끝 낱말 `Last incompatible policy: RELIABILITY`.
- **WiFi 주의**: 무선 위에서 RELIABLE 무거운 토픽을 끌어가면 재전송이 쌓여 통신이 막힌다.

## 원리·구조
| 발행자(제공) | 구독자(요청) | 연결 | 이유 |
|---|---|---|---|
| RELIABLE | RELIABLE | ○ | 그대로 충족 |
| RELIABLE | BEST_EFFORT | ○ | 강한 보장이 약한 요청을 충족 |
| BEST_EFFORT | BEST_EFFORT | ○ | 그대로 충족 |
| BEST_EFFORT | RELIABLE | ✖ | 약한 제공이 강한 요청을 못 채움 |

## 코드 예시
```python
# 신뢰성 흉내: 손실 20% 링크에서 BEST_EFFORT는 빠지고, RELIABLE은 재전송으로 다 도착(대신 전송 횟수↑)
import random
random.seed(1)
def send(n, reliable, loss=0.2):
    got, tries = 0, 0
    for _ in range(n):
        while True:
            tries += 1
            if random.random() > loss: got += 1; break
            if not reliable: break
    return got, tries
print("BEST_EFFORT:", send(100, False))   # BEST_EFFORT: (84, 100)
print("RELIABLE:", send(100, True))       # RELIABLE: (100, 127)
```

## 관련 개념
[[QoS]] · [[QoS 호환 규칙]] · [[QoS 프리셋]] · [[QoS 불일치 진단]] · [[TCP와 UDP]]
