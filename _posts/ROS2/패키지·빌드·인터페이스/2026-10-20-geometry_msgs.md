---
title: "geometry_msgs"
date: 2026-10-20 12:00:00 +0900
categories: [ROS2, 패키지·빌드·인터페이스]
tags: []
---
# 정의
**위치·자세·속도**처럼 기하 정보를 담는 표준 메시지 패키지. [[std_msgs]] · [[sensor_msgs]]와 함께 표준 양식 모음(common_interfaces)에 들어 있다.

# 주요 타입
| 타입 | 담는 것 | 칸 |
|---|---|---|
| `Point` | 좌표 | `x`, `y`, `z` |
| `Vector3` | 3차원 벡터 | `x`, `y`, `z` |
| `Pose` | 자세 (위치 + 방향) | `position`(Point), `orientation`(Quaternion) |
| `Twist` | 속도 | `linear`(Vector3), `angular`(Vector3) |

## Twist
- `linear.x` = 전진 속도, `angular.z` = 회전 속도 (rad/s)
- 거북이·모바일 로봇의 `/cmd_vel` 토픽이 이 타입이다

```bash
# 10Hz 로 계속 보내야 동작이 이어진다
ros2 topic pub -r 10 /turtle1/cmd_vel geometry_msgs/msg/Twist "{linear: {x: 2.0}, angular: {z: 1.0}}"

# 한 번만: 직진 → 90도(약 1.57 rad) 회전
ros2 topic pub --once /turtle1/cmd_vel geometry_msgs/msg/Twist "{linear: {x: 2.0}}"
ros2 topic pub --once /turtle1/cmd_vel geometry_msgs/msg/Twist "{angular: {z: 1.57}}"
```
```
publishing #1: geometry_msgs.msg.Twist(
  linear=geometry_msgs.msg.Vector3(x=2.0, y=0.0, z=0.0),
  angular=geometry_msgs.msg.Vector3(x=0.0, y=0.0, z=1.0))
```
- 메시지 내용은 YAML 형식, 타입 이름을 반드시 함께 적는다

# 내 인터페이스에 넣기 (중첩 타입)
```
# .msg / .srv 안
geometry_msgs/Point goal_point
```
```cmake
find_package(geometry_msgs REQUIRED)
rosidl_generate_interfaces(${PROJECT_NAME} ... DEPENDENCIES geometry_msgs)
```
```xml
<depend>geometry_msgs</depend>
```
`goal_point` 아래의 `x`·`y`·`z`가 `Point`가 품은 칸이다.
