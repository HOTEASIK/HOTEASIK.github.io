---
title: "Lifecycle"
date: 2026-10-22 12:00:00 +0900
categories: [ROS2, 입문]
tags: []
---
# 정의
정해진 **상태**와 그 사이를 잇는 **전이**를 표준 규격으로 따르는 노드(관리되는 노드, Managed Node).
전원 스위치 하나가 아니라 단계별 절차다 — 관제탑이 「시동 허가 → 활주로 진입 허가 → 이륙 허가」를 단계마다 확인 후 내주는 것과 같다. 외부에서 명령을 보내 상태를 옮기고, 노드는 전이마다 정해진 콜백을 실행한다.

# 특징 
작업의 정확도를 높일 수 있음
- **자원을 만드는 때(configure)와 동작을 켜는 때(activate)를 나눈다**
  - configure: 퍼블리셔·타이머·장치 열기·캘리브레이션 읽기 같은 무거운 초기화를 미리 끝낸다
  - activate: 이 순간에야 데이터를 흘려보낸다 → 여러 노드를 **딱 같은 순간에** 가동할 수 있다

## 상태
| 상태 | 의미 | 노드는 |
|---|---|---|
| Unconfigured | 막 생성된 직후 | 메모리만 점유, 아무 일도 안 함 |
| Inactive | 설정 끝, 멈춰 있음 | 파라미터·연결 준비됨, 데이터 처리 안 함 |
| Active | 정상 가동 | 발행·구독, 콜백 실행 |
| Finalized | 종료 직전 | 정리 후 소멸 대기 |

## 전이
| 전이 | 방향 | 콜백 | 하는 일 |
|---|---|---|---|
| configure | Unconfigured → Inactive | `on_configure` | 파라미터 읽기, 퍼블리셔·타이머 생성 |
| activate | Inactive → Active | `on_activate` | 발행·구독 활성화 |
| deactivate | Active → Inactive | `on_deactivate` | 동작 멈춤 (자원 유지) |
| cleanup | Inactive → Unconfigured | `on_cleanup` | 자원 해제 |

올라간 길(configure → activate)을 다른 이름의 전이(deactivate → cleanup)로 되짚어 내려온다.

# 명령어
```bash
ros2 run lifecycle lifecycle_talker        # 띄워도 아무것도 안 찍힘 (Unconfigured)
ros2 lifecycle nodes
ros2 lifecycle get /lc_talker              # unconfigured [1]
ros2 lifecycle list /lc_talker             # 지금 갈 수 있는 전이
ros2 lifecycle set /lc_talker configure    # → inactive [2]
ros2 lifecycle set /lc_talker activate     # → active [3], 이때부터 발행
```
- Inactive에서 발행하면 `publisher is not activated` 경고가 뜨고 메시지는 나가지 않는다
- 「activate가 안 먹힌다」의 대부분은 아직 Unconfigured인 경우 → `get`으로 먼저 확인

# 코드
```python
from rclpy.lifecycle import LifecycleNode, State, TransitionCallbackReturn

class LifecycleTalker(LifecycleNode):
    def on_configure(self, state: State) -> TransitionCallbackReturn:
        self._pub = self.create_lifecycle_publisher(String, 'chatter', 10)
        self._timer = self.create_timer(1.0, self._tick)
        self._timer.cancel()                       # Inactive 동안은 멈춰 둠
        return TransitionCallbackReturn.SUCCESS

    def on_activate(self, state: State) -> TransitionCallbackReturn:
        self._timer.reset()                        # 동작 시작
        return super().on_activate(state)          # 부모가 퍼블리셔를 켠다 — 빼먹으면 발행 안 됨

    def on_deactivate(self, state: State) -> TransitionCallbackReturn:
        self._timer.cancel()
        return super().on_deactivate(state)

    def on_cleanup(self, state: State) -> TransitionCallbackReturn:
        self.destroy_timer(self._timer)
        self.destroy_lifecycle_publisher(self._pub)
        return TransitionCallbackReturn.SUCCESS
```
