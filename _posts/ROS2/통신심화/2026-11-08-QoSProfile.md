---
title: QoSProfile
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 통신심화]
tags: [통신심화, QoS, 실습]
---
# QoSProfile

## 정의·핵심
- **정의**: QoS 네 항목(신뢰성·지속성·이력·깊이)을 **한 객체에 적는** rclpy 클래스 — `create_publisher`·`create_subscription`의 마지막 인자 숫자 `10` 자리에 통째로 넣는다 (실습 2차시).
- **가져오기**: `from rclpy.qos import QoSProfile, ReliabilityPolicy, DurabilityPolicy, HistoryPolicy`.
- **지도용 예**: `QoSProfile(reliability=RELIABLE, durability=TRANSIENT_LOCAL, history=KEEP_LAST, depth=10)` → `self.create_publisher(String, 'map_info', qos)`.
- **숫자 10만 줄 때와 차이**: 숫자는 depth만 정하고 나머지는 기본값(보통 RELIABLE·VOLATILE). QoSProfile은 적은 네 항목 그대로.
- **자주 하는 실수 둘**: ① `KEEP_LAST`에 depth를 빠뜨림 ② 한쪽만 QoSProfile, 다른 쪽은 숫자 10 — 양쪽 약속을 함께 떠올린다.
- **실습 노드(my_py_pkg)**: `qos_talker.py`(BEST_EFFORT 고정, 토픽 qos_chat, 0.5초마다 `보냄: hello N`) + `qos_listener.py`(맨 위 `RELIABILITY = ReliabilityPolicy.RELIABLE` 한 줄만 토글) → 수신 0과 경고 → BEST_EFFORT로 바꾸고 **다시 빌드·실행**하면 「받음」이 흐른다(QoS는 만들 때 굳는다).
- **세 약속을 한 노드에(qos_presets.py)**: 센서형 BEST_EFFORT depth 5(`demo_scan`), 명령형 RELIABLE depth 10(`demo_cmd`), 지도형 RELIABLE+TRANSIENT_LOCAL depth 1(`demo_map`, 한 번만 발행).
- **명령줄 판**: `ros2 topic pub … --qos-reliability reliable --qos-durability transient_local`, `ros2 topic echo … --qos-reliability best_effort`.

## 원리·구조
```
create_publisher(String, 'chatter', 10)            ← depth만, 나머지 기본값
create_publisher(String, 'map_info', QoSProfile(   ← 네 칸 직접
    reliability=ReliabilityPolicy.RELIABLE,
    durability=DurabilityPolicy.TRANSIENT_LOCAL,
    history=HistoryPolicy.KEEP_LAST, depth=10))
```

## 코드 예시
```python
# qos_presets.py 핵심 — 세 퍼블리셔가 서로 다른 약속
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, DurabilityPolicy, HistoryPolicy
from std_msgs.msg import String

class QosPresets(Node):
    def __init__(self):
        super().__init__('qos_presets')
        sensor_qos = QoSProfile(reliability=ReliabilityPolicy.BEST_EFFORT,
                                history=HistoryPolicy.KEEP_LAST, depth=5)
        cmd_qos = QoSProfile(reliability=ReliabilityPolicy.RELIABLE,
                             history=HistoryPolicy.KEEP_LAST, depth=10)
        map_qos = QoSProfile(reliability=ReliabilityPolicy.RELIABLE,
                             durability=DurabilityPolicy.TRANSIENT_LOCAL,
                             history=HistoryPolicy.KEEP_LAST, depth=1)
        self.sensor_pub = self.create_publisher(String, 'demo_scan', sensor_qos)
        self.cmd_pub = self.create_publisher(String, 'demo_cmd', cmd_qos)
        self.map_pub = self.create_publisher(String, 'demo_map', map_qos)
        self.map_pub.publish(String(data='map v1'))
        self.get_logger().info('지도 1회 발행(latched)')
        self.i = 0
        self.create_timer(0.5, self.tick)

    def tick(self):
        self.sensor_pub.publish(String(data=f'scan {self.i}'))
        self.cmd_pub.publish(String(data=f'cmd {self.i}'))
        self.i += 1
```
```bash
ros2 topic info /demo_map --verbose    # Reliability: RELIABLE / Durability: TRANSIENT_LOCAL
```

## 관련 개념
[[QoS]] · [[QoS 프리셋]] · [[QoS 불일치 진단]] · [[퍼블리셔]] · [[서브스크라이버]]
