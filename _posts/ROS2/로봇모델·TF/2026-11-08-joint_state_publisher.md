---
title: joint_state_publisher
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 로봇모델·TF]
tags: [로봇모델·TF, TF, 실습]
---
# joint_state_publisher

## 정의·핵심
- **정의**: 움직이는 조인트의 값을 `/joint_states`(sensor_msgs/JointState)로 내는 노드. **`joint_state_publisher_gui`** 는 조인트마다 **슬라이더 창**을 띄운다 — 실제 로봇에선 모터 드라이버가 같은 토픽을 낸다 (실습 4차시).
- **왜 필요한가**: revolute 조인트로 이어진 base_link–arm_link는 「지금 관절이 몇 도인지」 받기 전까지 [[robot_state_publisher]]가 변환을 낼 수 없다.
- **화면**: 위에 `Randomize`·`Center` 단추, 아래 `shoulder`와 값 칸 `0.00`, 슬라이더 하나 — 움직이는 조인트 수만큼(fixed는 없음). 그리퍼 추가 후 둘.
- **슬라이더 창은 `/robot_description`을 받아야 관절을 안다**: 창이 비어 있으면 robot_state_publisher가 죽었거나 안 떴다 → 터미널 A에 `Robot initialized`가 있는지.
- **실행**: `ros2 run joint_state_publisher_gui joint_state_publisher_gui` — 없으면 `Package 'joint_state_publisher_gui' not found`(urdf_tutorial 설치).
- **창이 안 뜨면**: `qt.qpa.xcb: could not connect to display` … `no Qt platform plugin could be initialized` → 다시 설치할 필요 없다, 화면이 있는 데스크톱 터미널에서. 슬라이더는 `QT_QPA_PLATFORM=offscreen`을 앞에 붙이면 창 없이 노드로는 돈다(shoulder 0.0 발행) — RViz는 안 된다.
- **확인**: `ros2 topic echo /joint_states`. 끝까지 끌면 값 칸 `1.570`, tf2_echo RPY degree `[0.000, 89.954, 0.000]`.
- 현장 시나리오 「모델은 떴는데 슬라이더를 움직여도 안 움직인다」: 슬라이더가 떠 있나 → `/joint_states`가 rsp에 오나 → RViz Fixed Frame이 base_link인가.

## 원리·구조
```
sensor_msgs/msg/JointState
  header
  name:     ['shoulder', 'gripper_joint']
  position: [1.57, 0.0]
  velocity: []
  effort:   []
```

## 코드 예시
```python
# /joint_states 한 장을 흉내 내고, URDF 한계를 넘는 값 찾기
limits = {"shoulder": (-1.57, 1.57), "gripper_joint": (0.0, 0.05)}
msg = {"name": ["shoulder", "gripper_joint"], "position": [1.57, 0.08]}
for n, p in zip(msg["name"], msg["position"]):
    lo, hi = limits[n]
    print(n, p, "OK" if lo <= p <= hi else f"한계 밖 ({lo}~{hi})")
# shoulder 1.57 OK
# gripper_joint 0.08 한계 밖 (0.0~0.05)
import math
print(round(math.degrees(1.57), 3))   # 89.954  ← tf2_echo의 RPY degree
```
```bash
ros2 run joint_state_publisher_gui joint_state_publisher_gui
QT_QPA_PLATFORM=offscreen ros2 run joint_state_publisher_gui joint_state_publisher_gui
ros2 topic echo /joint_states --once
```

## 관련 개념
[[robot_state_publisher]] · [[조인트 타입]] · [[URDF]] · [[RViz]] · [[rqt]]
