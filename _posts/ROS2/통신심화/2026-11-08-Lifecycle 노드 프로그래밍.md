---
title: Lifecycle 노드 프로그래밍
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 통신심화]
tags: [통신심화, Lifecycle, 실습]
---
# Lifecycle 노드 프로그래밍

## 정의·핵심
- **정의**: rclpy에서 `Node` 대신 **`LifecycleNode`를 상속**하고 전이 콜백 넷을 채워 관리되는 노드를 만드는 법 — `my_py_pkg/lc_talker.py` (실습 4차시).
- **가져오기**: `from rclpy.lifecycle import LifecycleNode, State, TransitionCallbackReturn`.
- **on_configure — 만들되 멈춰 둔다**: `create_lifecycle_publisher`(그 자신도 꺼짐·켜짐 상태를 가진 퍼블리셔) + `create_timer` 직후 `timer.cancel()` → `TransitionCallbackReturn.SUCCESS`.
- **on_activate / on_deactivate**: `timer.reset()` / `timer.cancel()` — 자원은 그대로. 끝에서 **`return super().on_activate(state)`** — 부모가 퍼블리셔도 함께 켠다.
  - 부모를 안 부르고 곧장 SUCCESS를 돌려주면: 상태는 `active [3]`, 로그 `on_activate: 동작 시작`도 찍히는데 `/chatter`엔 한 줄도 안 온다 — **경고 없이 조용하다**.
- **on_cleanup**: `destroy_timer` · `destroy_lifecycle_publisher` → SUCCESS.
- **종료 골격**: `except (KeyboardInterrupt, ExternalShutdownException)` + `rclpy.try_shutdown()` → `^C`만 남고 종료 코드 0. 옛 꼴(try 없이 shutdown)은 트레이스백, `[ros2run]: Interrupt`, 종료 코드 254.
- **등록·빌드**: entry_points에 `'lc_talker = my_py_pkg.lc_talker:main'` 한 줄 추가(있던 줄 지우지 않기) → `ros2 pkg executables my_py_pkg`에 한 줄 늘었는지.
- **같은 이름 주의**: 데모 `lifecycle_talker`도 노드 이름이 `lc_talker` — 데모를 끄고 띄운다. 둘 다 켜면 `lifecycle nodes`는 한 줄만, `node list`만 같은 이름 경고, `set` 한 번에 둘 다 옮겨질 수 있다.
- **화면**: 터미널 A에 `on_configure: 준비 완료` → `on_activate: 동작 시작` → `on_deactivate: 일시 정지` → `on_cleanup: 자원 해제`. active 동안만 `ros2 topic echo /chatter`에 `data: hello (active only)`.

## 원리·구조
| 콜백 | 하는 일 | 돌려주는 것 |
|---|---|---|
| on_configure | 퍼블리셔·타이머 생성, 타이머 cancel | SUCCESS |
| on_activate | timer.reset() | super().on_activate(state) |
| on_deactivate | timer.cancel() | super().on_deactivate(state) |
| on_cleanup | destroy_timer, destroy_lifecycle_publisher | SUCCESS |

## 코드 예시
```python
# lc_talker.py — 관리되는 노드(파이썬)
import rclpy
from rclpy.executors import ExternalShutdownException
from rclpy.lifecycle import LifecycleNode, State, TransitionCallbackReturn
from std_msgs.msg import String


class LifecycleTalker(LifecycleNode):
    def __init__(self):
        super().__init__('lc_talker')
        self._pub = None
        self._timer = None

    def on_configure(self, state: State) -> TransitionCallbackReturn:
        self._pub = self.create_lifecycle_publisher(String, 'chatter', 10)
        self._timer = self.create_timer(1.0, self._tick)
        self._timer.cancel()                      # Inactive 동안은 멈춰 둠
        self.get_logger().info('on_configure: 준비 완료')
        return TransitionCallbackReturn.SUCCESS

    def on_activate(self, state: State) -> TransitionCallbackReturn:
        self._timer.reset()                       # 이때부터 동작 시작
        self.get_logger().info('on_activate: 동작 시작')
        return super().on_activate(state)

    def on_deactivate(self, state: State) -> TransitionCallbackReturn:
        self._timer.cancel()                      # 동작 멈춤(자원은 유지)
        self.get_logger().info('on_deactivate: 일시 정지')
        return super().on_deactivate(state)

    def on_cleanup(self, state: State) -> TransitionCallbackReturn:
        self.destroy_timer(self._timer)
        self.destroy_lifecycle_publisher(self._pub)
        self.get_logger().info('on_cleanup: 자원 해제')
        return TransitionCallbackReturn.SUCCESS

    def _tick(self):
        self._pub.publish(String(data='hello (active only)'))


def main():
    rclpy.init()
    node = LifecycleTalker()
    try:
        rclpy.spin(node)
    except (KeyboardInterrupt, ExternalShutdownException):
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == '__main__':
    main()
```

## 관련 개념
[[Lifecycle 노드]] · [[Lifecycle 관리]] · [[타이머]] · [[rclpy 종료 처리]] · [[entry_points]]
