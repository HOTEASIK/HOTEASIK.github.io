---
title: Lifecycle 노드
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 통신심화]
tags: [통신심화, Lifecycle, 실습]
---
# Lifecycle 노드

## 정의·핵심
- **정의**: 관리되는 노드(managed node) — 정해진 **상태**와 그 사이를 잇는 **전이**를 표준 규격으로 따르는 노드. 전원 스위치 하나가 아니라 단계별 절차(관제탑의 「시동 허가 → 활주로 진입 → 이륙 허가」) (실습 4차시).
- **네 주요 상태**
  - Unconfigured [1]: 막 생성 — 메모리만 점유, 아무 일도 안 함.
  - Inactive [2]: 설정 끝, 멈춰 있음 — 파라미터·연결 준비, 데이터 처리 안 함.
  - Active [3]: 정상 가동 — 발행·구독, 콜백 실행.
  - Finalized: 종료 직전 — 정리 후 소멸 대기.
- **네 전이와 콜백**: configure(Unconfigured→Inactive, `on_configure`) · activate(Inactive→Active, `on_activate`) · deactivate(Active→Inactive, `on_deactivate`) · cleanup(Inactive→Unconfigured, `on_cleanup`). 한 방향으로만 — 올라간 길을 다른 이름의 전이로 되짚어 내려온다.
- **핵심 설계 — 만드는 때와 켜는 때를 나눈다**: configure에서 퍼블리셔·타이머·장치 열기·캘리브레이션 읽기 같은 무거운 초기화를 끝내고, activate 순간에야 데이터를 흘린다 → 여러 노드를 「딱 같은 순간에」 가동.
- **반환값이 다음 상태를 정한다**: SUCCESS → Configuring 거쳐 Inactive / FAILURE → 이전 상태로 / ERROR → ErrorProcessing 거쳐 Unconfigured 또는 Finalized. `shutdown` 전이는 어느 상태에서든 Finalized로. 초기화에 실패한 노드가 동작 상태로 잘못 올라가는 일을 구조로 막는다.
- **Inactive의 모습(데모)**: 퍼블리셔는 있고 1초마다 발행을 시도하지만 꺼져 있어 안 나간다 — `Lifecycle publisher is currently inactive. Messages are not published.` + `[WARN] [LifecyclePublisher]: Trying to publish message on the topic '/lifecycle_chatter', but the publisher is not activated`.
- **일반 노드와 비교**: 동작 시작(실행 즉시 vs activate 뒤) · 외부 제어(프로세스 켜고 끄기 vs 상태별 전이) · 초기화 실패(코드로 직접 vs 반환값으로 차단) · 순차 기동(어려움 vs 자연스러움).
- **언제 쓰나**: 센서 드라이버·모터 제어·입력이 준비돼야 의미 있는 인식·계획 노드. 단순 로깅·일회성 유틸은 일반 노드.

## 원리·구조
```
          configure            activate
Unconfigured ───────▶ Inactive ───────▶ Active
     ▲   ◀───────────    │   ◀─────────    │
     │      cleanup      │    deactivate   │
     └──── shutdown (어느 상태에서든) ──▶ Finalized
```

## 코드 예시
```python
# 상태 기계 흉내 — ros2 lifecycle set/get과 같은 응답
TRANS = {("unconfigured", "configure"): "inactive", ("inactive", "activate"): "active",
         ("active", "deactivate"): "inactive", ("inactive", "cleanup"): "unconfigured"}
NUM = {"unconfigured": 1, "inactive": 2, "active": 3}
state = "unconfigured"
def set_(t):
    global state
    if (state, t) not in TRANS:
        ok = [b for (a, b) in TRANS if a == state] + ["shutdown"]
        return f"Unknown transition requested, available ones are: {ok}"
    state = TRANS[(state, t)]; return "Transitioning successful"
print(set_("activate"))                  # Unknown transition requested, available ones are: ['configure', 'shutdown']
for t in ("configure", "activate", "deactivate", "cleanup"):
    set_(t); print(f"{state} [{NUM[state]}]", end="  ")
print()                                  # inactive [2]  active [3]  inactive [2]  unconfigured [1]
```

## 관련 개념
[[Lifecycle 노드 프로그래밍]] · [[Lifecycle 관리]] · [[노드]] · [[Nav2]]
