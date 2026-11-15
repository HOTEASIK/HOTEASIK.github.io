---
title: namespace
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, ROS2 기본개념]
tags: [ROS2기본개념, 이름, 기초]
---
# namespace

## 정의·핵심
- **정의**: 노드와 그 노드의 (상대 이름) 토픽·서비스 앞에 **접두사 폴더**를 붙여 묶는 것. `--ros-args -r __ns:=/robot1` — `ns` 앞뒤로 밑줄 **두 개** (기초 5차시).
- **왜**: 같은 프로그램을 로봇 여러 대에 띄우면 토픽 이름이 다 같아 섞인다. namespace를 주면 `/robot1/cmd_vel`, `/robot2/cmd_vel`로 갈라진다. 물류창고 AMR 50대 → `/amr_01` … `/amr_50`.
- **상대 이름만 바뀐다**: 코드에서 `'chatter'`처럼 `/` 없이 쓴 이름에만 접두사가 붙는다. `'/chatter'`처럼 절대 이름은 그대로 → 여러 대 운용을 생각하면 코드에서는 상대 이름을 쓴다.
- **remap과 비교**: remap = 토픽 하나 고치는 핀셋, namespace = 노드 전체를 한 번에 옮기는 빗자루.
- **DOMAIN_ID와 비교**: namespace는 **같은 세계 안에서 폴더를 나눈다**(서로 보이고 일부러 이을 수 있다), `ROS_DOMAIN_ID`는 **세계 자체를 나눈다**(아예 안 보인다).
- **연습 다섯 계단**: 그냥 talker → `__ns:=/robot1` talker → 같은 ns의 listener → 다른 ns listener(못 받음) → remap으로 다시 잇기.

## 원리·구조
| 코드 속 이름 | ns 없음 | `__ns:=/robot1` |
|---|---|---|
| 노드 `talker` | `/talker` | `/robot1/talker` |
| `chatter` (상대) | `/chatter` | `/robot1/chatter` |
| `/chatter` (절대) | `/chatter` | `/chatter` |
| `~/status` (전용) | `/talker/status` | `/robot1/talker/status` |

## 코드 예시
```python
# ROS2 이름 해석 규칙: 절대(/), 전용(~), 상대
def resolve(name, ns="/", node="talker"):
    ns = ns.rstrip("/")
    if name.startswith("/"): return name
    if name.startswith("~"): return f"{ns}/{node}{name[1:]}"
    return f"{ns}/{name}"
for n in ["chatter", "/chatter", "~/status"]:
    print(f"{n:10} → {resolve(n):18} {resolve(n, '/robot1')}")
# chatter    → /chatter           /robot1/chatter
# /chatter   → /chatter           /chatter
# ~/status   → /talker/status     /robot1/talker/status
```
```bash
ros2 run demo_nodes_cpp talker   --ros-args -r __ns:=/robot1
ros2 run demo_nodes_py listener  --ros-args -r __ns:=/robot1     # 받음
ros2 run demo_nodes_py listener  --ros-args -r __ns:=/robot2     # 못 받음
ros2 topic list                                                  # /robot1/chatter
```

## 관련 개념
[[remap]] · [[ROS_DOMAIN_ID]] · [[ROS2 이름 규칙]] · [[launch 네임스페이스·리맵·파라미터]] · [[노드]]
