---
title: talker와 listener
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, ROS2 기본개념]
tags: [ROS2기본개념, 데모, 기초]
---
# talker와 listener

## 정의·핵심
- **정의**: ROS2 설치 후 가장 먼저 띄우는 예제 노드 한 쌍. `talker`는 1초마다 `"Hello World: N"`을 `/chatter` 토픽에 발행하고, `listener`는 같은 토픽을 구독해 `I heard: [...]`를 찍는다 (기초 3차시 클라이맥스).
- **핵심 깨달음**: 직전 시간 소켓으로 손수 짠 IP·포트·직렬화·끊김 처리가 **0줄**. 명령 딱 두 줄로 통신이 선다. 둘은 서로의 IP도 언어도 모르는데 ROS가 중개했다.
  - talker는 `demo_nodes_cpp`(**C++**), listener는 `demo_nodes_py`(**Python**) — 언어가 달라도 같은 토픽 이름이면 ROS/DDS가 공통 형식으로 직렬화·전달한다.
  - 띄운 직후 3초쯤 침묵하다 메시지가 흐른다(발견에 걸리는 시간).
- **구경꾼도 엿본다**: 세 번째 터미널의 `ros2 topic echo /chatter`는 발행자도 구독자도 아닌 제3자인데 같은 통로를 받아본다 — 소켓이었다면 끼어들지도 못했을 일.
- **talker와 listener는 거울처럼 네 가지 일을 한다**
  - talker: 노드 생성·이름 짓기 → `chatter`로 문자열 발행자 선언 → 1초 타이머 → 타이머마다 발행.
  - listener: 노드 생성 → 같은 토픽 구독 → 도착 시 불릴 콜백 등록 → 콜백에서 출력.
  - 발행자·구독자·타이머·콜백 — 이 네 단어가 노드의 골격 (입문 3차시에서 직접 짠다).
- **⚡ 도전**: talker를 끄면 listener는? / 언어를 반대로(C++ listener + Python talker) / `ros2 topic hz /chatter` / `-r chatter:=greeting`으로 이름을 바꾸면 기존 listener가 못 듣는다(「이름이 곧 약속」) / `ros2 topic info /chatter`.

## 원리·구조
```
[talker (C++)] ──/chatter (std_msgs/msg/String)──→ [listener (Python)]
                         └──────────────→ [ros2 topic echo] (구경꾼)
```

## 코드 예시
```bash
ros2 run demo_nodes_cpp talker      # [INFO] [...] [talker]: Publishing: 'Hello World: 12'
ros2 run demo_nodes_py listener     # [INFO] [...] [listener]: I heard: [Hello World: 12]
ros2 node list                      # /talker  /listener
ros2 topic list                     # /chatter  /parameter_events  /rosout
ros2 topic echo /chatter            # data: 'Hello World: 12'
ros2 topic info /chatter            # Type: std_msgs/msg/String, Publisher count: 1, Subscription count: 1
ros2 run demo_nodes_cpp talker --ros-args -r chatter:=greeting
```
```python
# talker의 뼈대 (입문 3차시에 직접 짜는 형태)
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class Talker(Node):
    def __init__(self):
        super().__init__('talker')
        self.pub = self.create_publisher(String, 'chatter', 10)
        self.i = 0
        self.timer = self.create_timer(1.0, self.tick)

    def tick(self):
        msg = String(); msg.data = f'Hello World: {self.i}'
        self.pub.publish(msg)
        self.get_logger().info(f'Publishing: {msg.data!r}')
        self.i += 1

def main():
    rclpy.init()
    rclpy.spin(Talker())
    rclpy.shutdown()
```

## 관련 개념
[[노드]] · [[토픽]] · [[퍼블리셔]] · [[서브스크라이버]] · [[ros2 topic]] · [[소켓의 한계와 ROS]]
