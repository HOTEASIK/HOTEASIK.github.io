---
title: Jupyter에서 ROS2
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, CLI·진단도구]
tags: [CLI·진단도구, Jupyter, 입문]
---
# Jupyter에서 ROS2

## 정의·핵심
- **정의**: 노트북 셀에서 rclpy 노드를 만들어 토픽을 받아 보고 바로 그래프로 그리는 방법 — 파일·빌드 없이 실험·분석 (입문 8차시).
- **설치**: Ubuntu 24.04의 시스템 python3에는 pip로 못 깐다(externally-managed) → `sudo apt install python3-notebook`(또는 jupyter 관련 apt 패키지). ROS가 깔린 그 python3여야 `import rclpy`가 된다.
- **source는 띄우기 전에**: 터미널에서 `source /opt/ros/jazzy/setup.bash`(+ 워크스페이스) 후 `jupyter notebook`. 셀에서 `!source …`는 `sh: source: not found` — 셀의 `!`는 매번 새 sh라 효과도 남지 않는다.
- **spin이 아니라 spin_once**: `rclpy.spin(node)`은 셀을 영원히 붙잡는다(커널 중단 필요). `rclpy.spin_once(node, timeout_sec=0.1)`를 원하는 만큼 반복.
- **셀 셋으로 나눈다**: ① 초기화(init·노드·구독 — 한 번만) ② 작업(spin_once 반복·그리기 — 여러 번) ③ 정리(destroy_node·shutdown).
  - ①을 두 번 돌리면 `Context.init() must only be called once`.
  - ③을 두 번 돌리면 `Context must be initialized before it can be shutdown` — `try_shutdown()`이 안전.
- **예**: /chatter를 받아 리스트에 쌓고 matplotlib로 그린다.

## 원리·구조
| 셀 | 내용 | 몇 번 |
|---|---|---|
| ① 초기화 | `rclpy.init()`, 노드, `create_subscription` | 한 번 |
| ② 작업 | `for _ in range(50): spin_once(timeout_sec=0.1)` → 그리기 | 원하는 만큼 |
| ③ 정리 | `node.destroy_node()`, `rclpy.try_shutdown()` | 한 번 |

## 코드 예시
```python
# ① 초기화 셀
import rclpy
from std_msgs.msg import String
rclpy.init()
node = rclpy.create_node("jupyter_listener")
got = []
node.create_subscription(String, "/chatter", lambda m: got.append(m.data), 10)

# ② 작업 셀 — 5초 동안 받기 (spin 금지)
for _ in range(50):
    rclpy.spin_once(node, timeout_sec=0.1)
print(len(got), got[-3:])

import matplotlib.pyplot as plt
plt.plot([int(s.split()[-1]) for s in got]); plt.title("/chatter count"); plt.show()

# ③ 정리 셀
node.destroy_node()
rclpy.try_shutdown()
```
```bash
sudo apt install python3-notebook
source /opt/ros/jazzy/setup.bash
jupyter notebook
ros2 run demo_nodes_cpp talker      # 다른 터미널에서 /chatter 발행
```

## 관련 개념
[[spin]] · [[rclpy 종료 처리]] · [[rosbag2_py]] · [[ROS2와 venv]] · [[토픽]]
