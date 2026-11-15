---
title: robot_state_publisher
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 로봇모델·TF]
tags: [로봇모델·TF, TF, 실습]
---
# robot_state_publisher

## 정의·핵심
- **정의**: URDF(생김새)와 `/joint_states`(관절 상태)를 받아 **모든 링크의 위치 관계를 계산해 TF로 발행**하는 노드 — URDF만으로는 정적인 그림 한 장 (실습 4차시).
- **Jazzy는 내용으로 받는다**: URDF를 파일 경로가 아니라 **글자 통째로** `robot_description` 파라미터로.
- **가장 단단한 길 — launch 대본(rsp.launch.py)**: 파일을 `os.path.expanduser('~/…')`로 열어(파이썬 `open`은 `~`를 스스로 풀지 않는다) 읽은 글자를 `parameters=[{'robot_description': …}]`로 넘긴다. 띄우면 `Robot initialized`.
- **URDF를 고쳐도 다시 빌드할 필요 없다**: 대본은 설치 폴더 사본이 아니라 `~/ros2_ws/simple_arm.urdf` 그 파일을 띄울 때마다 새로 읽는다 — 끄고 다시 띄우면 된다(z 0.3→0.5가 tf2_echo에 바로 반영).
- **명령줄 덫**: `-p robot_description:="$(cat simple_arm.urdf)"` → 값이 YAML로 읽혀 주석 `<!-- 링크: 몸통 -->`의 「콜론+공백」, `#`에 걸려 `Couldn't parse parameter override rule` → `[ros2run]: Aborted`. 여러 줄·한국어 탓이 아니다. 대본은 임시 YAML에 **따옴표로 감싸** 넘겨 안전.
- **옛 꼴**: `ros2 run robot_state_publisher robot_state_publisher 파일경로` → 돌긴 도는데 `[WARN] No robot_description parameter, but command-line argument available. … This backwards compatibility fallback will be removed in the future.`
- **토픽**: `/robot_description`(받은 URDF를 슬라이더·RViz에 다시 나눠 줌) · `/joint_states`(구독만 해도 목록에 보인다 — 내는 쪽은 슬라이더) · `/tf`(움직이는 조인트) · `/tf_static`(fixed 조인트).
- **보안 export가 남은 터미널**에선 `couldn't find all security files!`로 Aborted — 새 터미널에서.

## 원리·구조
```
simple_arm.urdf ─(대본이 읽음)→ robot_description ┐
joint_state_publisher_gui ─→ /joint_states ───────┤→ robot_state_publisher ─→ /tf, /tf_static
                                                   └─→ /robot_description (RViz·슬라이더가 받음)
```

## 코드 예시
```python
# my_py_pkg/launch/rsp.launch.py — URDF 파일을 읽어 robot_description 으로 넘긴다
import os
from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    urdf_path = os.path.expanduser('~/ros2_ws/simple_arm.urdf')
    with open(urdf_path) as f:
        robot_description = f.read()
    return LaunchDescription([
        Node(
            package='robot_state_publisher',
            executable='robot_state_publisher',
            parameters=[{'robot_description': robot_description}],
        ),
    ])
```
```bash
cd ~/ros2_ws && colcon build --packages-select my_py_pkg
source install/setup.bash && ros2 launch my_py_pkg rsp.launch.py
# [robot_state_publisher]: Robot initialized
ros2 topic list    # /joint_states /parameter_events /robot_description /rosout /tf /tf_static
```

## 관련 개념
[[URDF]] · [[joint_state_publisher]] · [[TF2]] · [[static TF와 dynamic TF]] · [[launch 파일]] · [[파라미터]] · [[SROS2]]
