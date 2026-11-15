---
title: Component launch
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 통신심화]
tags: [통신심화, Component, 실습]
---
# Component launch

## 정의·핵심
- **정의**: 컨테이너와 그 안에 실을 컴포넌트를 **launch 대본 한 장**에 적어 한 번에 띄우는 방법 — 손으로 친 `component load`가 대본의 한 줄이 된다 (실습 3차시).
- **두 액션**: `ComposableNodeContainer`(launch_ros.actions — 그릇) + `ComposableNode`(launch_ros.descriptions — 목록의 한 칸).
- **칸 읽기**: 컨테이너 `name`·`package`·`executable`(어떤 컨테이너 실행 파일) · `composable_node_descriptions`(실을 목록) · ComposableNode의 `package`·`plugin`·`name`.
- **스위치는 `extra_arguments=[{'use_intra_process_comms': True}]`** — 손으로는 `-e use_intra_process_comms:=true`. 확인용 로그 등급은 컨테이너 `arguments=['--ros-args', '--log-level', 'rcl:=debug']`.
- **setup.py**: `data_files`에 `('share/' + package_name + '/launch', glob('launch/*.launch.py'))` + 맨 위 `from glob import glob`. `os.path.join` 꼴을 옮기면서 `import os`를 빠뜨리면 `NameError: name 'os' is not defined`.
- **고치면 다시 빌드**: `ros2 launch`는 src가 아니라 **설치 폴더의 사본**을 읽는다 — True로 고치고 곧바로 띄우면 옛 False가 돈다(`diff src/… install/…`로 보인다). 번거로우면 `--symlink-install`.
- **겹침 덫**: 손으로 띄운 컨테이너를 켜 둔 채 launch하면 talker가 둘 — listener 번호가 12, 1, 13, 2 … 엇갈리고, `node list`에 `WARNING: Be aware that there are nodes in the graph that share an exact name`.
- **executable 한 줄이 성능 정책**: 단일 스레드로 익히고 모자라면 `component_container_mt`.
- 대본 한 장이 곧 설계도 — 어떤 노드가 어떤 컨테이너에 묶였고 빠른 길이 열렸는지 한눈에.

## 원리·구조
| 손으로 | 대본으로 |
|---|---|
| `ros2 run rclcpp_components component_container` | `ComposableNodeContainer(package='rclcpp_components', executable='component_container')` |
| `component load /ComponentManager composition composition::Talker` | `ComposableNode(package='composition', plugin='composition::Talker', name='talker')` |
| `-e use_intra_process_comms:=true` | `extra_arguments=[{'use_intra_process_comms': True}]` |

## 코드 예시
```python
# my_py_pkg/launch/composition.launch.py
from launch import LaunchDescription
from launch_ros.actions import ComposableNodeContainer
from launch_ros.descriptions import ComposableNode


def generate_launch_description():
    return LaunchDescription([
        ComposableNodeContainer(
            name='my_container', namespace='', package='rclcpp_components',
            executable='component_container',
            arguments=['--ros-args', '--log-level', 'rcl:=debug'],
            composable_node_descriptions=[
                ComposableNode(
                    package='composition', plugin='composition::Talker', name='talker',
                    extra_arguments=[{'use_intra_process_comms': True}],
                ),
                ComposableNode(
                    package='composition', plugin='composition::Listener', name='listener',
                    extra_arguments=[{'use_intra_process_comms': True}],
                ),
            ])
    ])
```
```bash
cd ~/ros2_ws && colcon build --packages-select my_py_pkg && source install/setup.bash
ros2 launch my_py_pkg composition.launch.py
# Loaded node '/talker' in container '/my_container'
ros2 component list
```

## 관련 개념
[[Component]] · [[Intra-Process Communication]] · [[launch 파일]] · [[setup.py]] · [[symlink-install]]
