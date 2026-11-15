---
title: use_sim_time
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 시뮬레이션·내비게이션]
tags: [시뮬레이션·내비게이션, 시간, 실습]
---
# use_sim_time

## 정의·핵심
- **정의**: 노드가 벽시계(wall clock) 대신 **시뮬레이터가 `/clock` 토픽으로 흘려 주는 가상 시간**을 쓰게 하는 파라미터 — 모든 노드에 있다 (실습 5차시).
- **왜**: 여러 노드는 「지금 몇 시인지」를 맞춰야 데이터(라이다 스캔과 TF)를 짝지을 수 있다. 실로봇은 실제 시계, 시뮬레이터는 자기만의 가상 시간 — 하나만 실제 시간을 쓰면 서로 다른 시계를 본다 → 타임스탬프 불일치로 TF가 어긋나고, 느린 컴퓨터에서는 차이가 갈수록 벌어진다(real_time_factor < 1).
- **철칙 — 한 시스템 안에서는 시계를 하나로**: 시뮬레이션에서 관련 노드 **모두** `use_sim_time:=true`(`ros2 launch slam_toolbox online_async_launch.py use_sim_time:=true`). 실로봇으로 옮길 땐 거꾸로 **모두 false** — 실로봇엔 /clock을 흘려 주는 쪽이 없다.
- **까다로운 까닭 — 콘솔이 조용하다**: 실습 환경에서 SLAM만 false로 30초 → 시계에 대한 경고는 한 줄도 없었다. 증상은 「지도가 안 그려진다」「로봇이 안 움직인다」처럼 시간과 상관없어 보인다.
- **의심 신호**: `Message Filter dropping message: frame 'base_scan' … earlier than all the data in the transform cache`가 켤 때 한두 번이면 괜찮고, 계속 쏟아지면 시간이나 TF가 어긋난 것 → 모든 노드의 use_sim_time이 같은지, `tf2_echo odom base_link`가 나오는지.
- **/clock**: turtlebot3 launch의 다리 로그 첫 줄이 바로 clock 다리(`gz.msgs.Clock -> rosgraph_msgs/msg/Clock`). shapes 월드를 멈춘 채 두면 `sec: 0`.
- **bag 재생**: `ros2 bag play --clock`과 함께 쓰면 녹화 시각으로 노드를 돌릴 수 있다.

## 원리·구조
```
Gazebo ──/clock (sim time)──▶ 노드 A (use_sim_time=true)  ─┐  같은 시계 → 스캔·TF 짝이 맞는다
                          └──▶ 노드 B (use_sim_time=true)  ─┘
                               노드 C (use_sim_time=false) → 벽시계 → 타임스탬프 어긋남
```

## 코드 예시
```python
# 시계가 둘이면: 시뮬레이션이 실시간의 0.5배로 흐를 때 벽시계 노드와의 차이가 벌어진다
rtf = 0.5
for wall in (10, 60, 300):
    sim = wall * rtf
    print(f"wall {wall}s  sim {sim:.0f}s  차이 {wall - sim:.0f}s")
# wall 10s  sim 5s  차이 5s
# wall 60s  sim 30s  차이 30s
# wall 300s  sim 150s  차이 150s
nodes = {"slam_toolbox": True, "nav2": True, "rviz2": False}
print("불일치:", [n for n, v in nodes.items() if v != nodes["slam_toolbox"]])   # 불일치: ['rviz2']
```
```bash
ros2 launch slam_toolbox online_async_launch.py use_sim_time:=true
ros2 param get /slam_toolbox use_sim_time
ros2 topic echo --once /clock
```

## 관련 개념
[[Gazebo]] · [[ros_gz 브리지]] · [[SLAM]] · [[TF2]] · [[파라미터]] · [[ros2 bag]]
