---
title: QoS Durability
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 통신심화]
tags: [통신심화, QoS, 실습]
---
# QoS Durability

## 정의·핵심
- **정의**: 지속성(durability) — 내가 보내기 전에 켜져 있지 않던 구독자에게도 **과거의 마지막 값**을 줄 것인가 (실습 2차시).
- **TRANSIENT_LOCAL**: 발행자가 마지막 값을 들고 있다가 늦게 들어온 구독자에게도 건넨다 — 흔히 **latched(걸어 둔)** 동작. 지도·초기 설정값처럼 한 번 발행하고 한동안 안 바뀌는 데이터에.
- **VOLATILE**: 「지금부터 오는 것만」 — 구독 전에 지나간 값은 못 받는다. 센서처럼 늘 새 값이 오는 데이터에.
- **「한 번 발행, 늦은 구독」 패턴엔 TRANSIENT_LOCAL이 거의 필수**: 지도를 한 번 발행하고 끝났는데 구독자가 1분 뒤 켜지면 VOLATILE이면 영원히 못 받는다.
- **강약**: TRANSIENT_LOCAL이 강한 쪽. 발행 VOLATILE + 구독 TRANSIENT_LOCAL은 끊긴다(`Last incompatible policy: DURABILITY`). 반대는 연결된다.
- **호환인가, 타이밍인가**: 양쪽 다 VOLATILE이면 호환이라 **경고가 없는데** 늦게 켠 구독자는 앞선 값을 못 받는다 — 문제는 타이밍. 「지도가 RViz에 안 떠요」의 전형. 늦은 구독자만 못 받으면 호환표보다 발행 타이밍과 지속성을 먼저 의심.
- **되풀이 발행은 latched가 아니다**: `ros2 topic pub`은 1초마다 다시 보내서 늦게 켠 echo도 받는다 — 한 번만 발행하는 노드로 확인해야 한다.
- 실습(qos_presets): `demo_map`을 TRANSIENT_LOCAL로 한 번 발행 → 한참 뒤 `ros2 topic echo /demo_map`도 `data: map v1` 수신. VOLATILE로 바꾸면 아무것도 못 받는다(로그 문장은 여전히 "latched"라고 찍힌다 — 약속은 verbose로 확인).

## 원리·구조
| 발행자 | 구독자 | 연결 | 늦게 켠 구독자 |
|---|---|---|---|
| TRANSIENT_LOCAL | TRANSIENT_LOCAL | ○ | 마지막 값 받음 |
| TRANSIENT_LOCAL | VOLATILE | ○ | 지금부터만 |
| VOLATILE | VOLATILE | ○ | 못 받음 — 경고 없음 |
| VOLATILE | TRANSIENT_LOCAL | ✖ | DURABILITY 경고 |

## 코드 예시
```python
# 지속성 흉내: 발행자가 마지막 값을 들고 있느냐
class Pub:
    def __init__(self, durability): self.dur, self.last, self.subs = durability, None, []
    def publish(self, v):
        self.last = v
        for s in self.subs: s.append(v)
    def join(self, inbox):
        self.subs.append(inbox)
        if self.dur == "TRANSIENT_LOCAL" and self.last is not None: inbox.append(self.last)
for dur in ("VOLATILE", "TRANSIENT_LOCAL"):
    p = Pub(dur); p.publish("map v1")      # 지도 한 번 발행하고 끝
    late = []; p.join(late)                # 1분 뒤 켠 구독자
    print(dur, late)
# VOLATILE []
# TRANSIENT_LOCAL ['map v1']
```
```bash
ros2 topic echo /demo_map                                 # 늦게 켜도 마지막 값 1회
ros2 topic echo /demo_cmd --qos-durability transient_local   # VOLATILE 발행에 요구 → DURABILITY 경고
```

## 관련 개념
[[QoS]] · [[QoS 호환 규칙]] · [[QoS 불일치 진단]] · [[점유 격자 지도]] · [[QoS 프리셋]]
