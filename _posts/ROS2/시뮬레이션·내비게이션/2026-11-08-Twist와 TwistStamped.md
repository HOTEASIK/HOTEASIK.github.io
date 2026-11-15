---
title: Twist와 TwistStamped
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 시뮬레이션·내비게이션]
tags: [시뮬레이션·내비게이션, 메시지, 실습]
---
# Twist와 TwistStamped

## 정의·핵심
- **정의**: 속도 명령 메시지. `geometry_msgs/msg/Twist` = `linear`(x,y,z) + `angular`(x,y,z). **`TwistStamped`** = 앞에 `header`(stamp 시각 · frame_id)가 붙은 꼴 (실습 5차시).
- **이동 로봇**: 보통 `linear.x`(전진 m/s)와 `angular.z`(좌회전 rad/s)만 쓴다.
- **같은 이름, 다른 타입 — /cmd_vel**: 손으로 놓은 다리 Twist / turtlebot3 월드 **TwistStamped** / Nav2 데모 Twist. 월드마다 다를 수 있다 — `ros2 topic info /cmd_vel -v`의 Type으로 확인.
- **TwistStamped 한 통**: `header.stamp {sec, nanosec}`, `frame_id: ''`(조종기는 비워 보낸다), `twist.linear.x: 0.02` — 조종기 화면 값과 같다.
- **가장 고약한 조용한 실패**: TwistStamped 월드에 `ros2 topic pub … geometry_msgs/msg/Twist`로 15초 보내자 보내는 쪽은 계속 찍고 다리는 아무 말 없고 /odom은 그대로. 진단 도구만 말해 준다.
  - `topic info -v` 첫 줄 `Type: ['geometry_msgs/msg/Twist', 'geometry_msgs/msg/TwistStamped']` — 한 토픽에 타입이 둘.
  - `ros2 topic echo /cmd_vel` → `Cannot echo topic '/cmd_vel', as it contains more than one type: …`
- **해결**: 보내는 쪽 타입을 받는 쪽에 맞춘다.

## 원리·구조
```
geometry_msgs/msg/Twist             geometry_msgs/msg/TwistStamped
  linear:  {x, y, z}                  header: {stamp: {sec, nanosec}, frame_id}
  angular: {x, y, z}                  twist:
                                        linear:  {x, y, z}
                                        angular: {x, y, z}
```

## 코드 예시
```python
# 토픽 하나에 타입이 섞였는지 검사 (topic info -v가 보여 주는 것)
endpoints = [("teleop_keyboard", "PUBLISHER", "geometry_msgs/msg/TwistStamped"),
             ("my_pub", "PUBLISHER", "geometry_msgs/msg/Twist"),
             ("ros_gz_bridge", "SUBSCRIPTION", "geometry_msgs/msg/TwistStamped")]
types = sorted({t for *_, t in endpoints})
print("Type:", types)   # Type: ['geometry_msgs/msg/Twist', 'geometry_msgs/msg/TwistStamped']
sub_t = next(t for n, k, t in endpoints if k == "SUBSCRIPTION")
print([n for n, k, t in endpoints if k == "PUBLISHER" and t != sub_t])   # ['my_pub']  ← 받는 쪽과 다른 발행자
# Twist → TwistStamped 감싸기
twist = {"linear": {"x": 0.02, "y": 0.0, "z": 0.0}, "angular": {"x": 0.0, "y": 0.0, "z": 0.0}}
stamped = {"header": {"stamp": {"sec": 0, "nanosec": 0}, "frame_id": ""}, "twist": twist}
print(stamped["twist"]["linear"]["x"])   # 0.02
```
```bash
ros2 topic info /cmd_vel -v | grep -E "Type|Node name|Endpoint"
ros2 topic pub --once /cmd_vel geometry_msgs/msg/TwistStamped "{twist: {linear: {x: 0.1}}}"
```

## 관련 개념
[[ros_gz 브리지]] · [[TurtleBot3]] · [[메시지 header]] · [[ros2 topic]] · [[turtlesim]]
