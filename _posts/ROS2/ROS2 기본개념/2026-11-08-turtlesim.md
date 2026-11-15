---
title: turtlesim
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, ROS2 기본개념]
tags: [ROS2기본개념, 데모, 기초]
---
# turtlesim

## 정의·핵심
- **정의**: 2D 화면에 거북이를 띄우는 ROS2 학습용 시뮬레이터. 토픽·서비스·액션·파라미터를 **모두** 한 곳에서 만져 볼 수 있다 (기초 4·5차시).
- **실행**: `ros2 run turtlesim turtlesim_node` → 노드 이름은 `/turtlesim` (실행 파일 이름과 다르다). 거북이 이름은 `turtle1`.
- **토픽**
  - `/turtle1/cmd_vel` (geometry_msgs/msg/Twist): 구독 — 여기에 속도를 보내면 움직인다. 2D라 `linear.x`(앞뒤), `angular.z`(회전)만 쓴다.
  - `/turtle1/pose` (turtlesim/msg/Pose): 발행 — x, y, theta, 속도.
  - `/turtle1/color_sensor`: 발행 — 발밑 색.
- **서비스**: `/spawn`(거북이 추가), `/kill`, `/clear`(궤적 지우기), `/reset`(처음으로), `/turtle1/set_pen`(r,g,b,width,off), `/turtle1/teleport_absolute`, `teleport_relative`.
  - `set_pen`의 `off`는 YAML에서 `off`가 불(bool)로 읽히므로 값은 숫자 `0/1`로 준다.
- **액션**: `/turtle1/rotate_absolute` — theta(라디안)까지 회전, `--feedback`로 남은 각 확인.
- **파라미터**: `background_r/g/b` — 바꾼 뒤 `/clear` 해야 화면에 반영되는 경우가 있다.
- **pub 옵션**: `--once`는 한 번만(거북이가 1초쯤 움직이고 멈춤), `--rate 1`은 1Hz로 계속(원을 그리며 돈다).

## 원리·구조
```
[turtle_teleop_key] ──/turtle1/cmd_vel──→ [/turtlesim] ──/turtle1/pose──→ (echo)
                                             ├ 서비스: /spawn /clear /reset /turtle1/set_pen
                                             ├ 액션:   /turtle1/rotate_absolute
                                             └ 파라미터: background_r/g/b
```

## 코드 예시
```python
# turtlesim이 Twist를 받아 pose를 바꾸는 방식(1초 적분) 흉내
import math
x, y, th = 5.544, 5.544, 0.0
def step(lin_x, ang_z, dt=1.0):
    global x, y, th
    th += ang_z * dt
    x += lin_x * math.cos(th) * dt
    y += lin_x * math.sin(th) * dt
    return round(x, 3), round(y, 3), round(th, 3)
print(step(2.0, 0.0))    # (7.544, 5.544, 0.0)
print(step(0.0, 1.57))   # (7.544, 5.544, 1.57)
print(step(1.0, 0.0))    # (7.545, 6.544, 1.57)
```
```bash
ros2 run turtlesim turtlesim_node
ros2 topic pub --once /turtle1/cmd_vel geometry_msgs/msg/Twist "{linear: {x: 2.0}, angular: {z: 1.8}}"
ros2 topic pub --rate 1 /turtle1/cmd_vel geometry_msgs/msg/Twist "{linear: {x: 2.0}, angular: {z: 1.8}}"
ros2 service call /turtle1/set_pen turtlesim/srv/SetPen "{r: 255, g: 0, b: 0, width: 5, 'off': 0}"
ros2 service call /turtle1/teleport_absolute turtlesim/srv/TeleportAbsolute "{x: 2.0, y: 2.0, theta: 0.0}"
ros2 service call /spawn turtlesim/srv/Spawn "{x: 8.0, y: 8.0, theta: 0.0, name: 'turtle2'}"
ros2 action send_goal /turtle1/rotate_absolute turtlesim/action/RotateAbsolute "{theta: 1.57}" --feedback
ros2 param set /turtlesim background_b 255
```

## 관련 개념
[[teleop 키보드 조종]] · [[통신 방식 비교]] · [[remap]] · [[namespace]] · [[메시지 타입]]
