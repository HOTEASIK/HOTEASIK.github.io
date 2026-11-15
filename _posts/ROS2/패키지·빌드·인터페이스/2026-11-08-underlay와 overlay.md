---
title: underlay와 overlay
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 패키지·빌드·인터페이스]
tags: [패키지·빌드·인터페이스, 환경, 입문]
---
# underlay와 overlay

## 정의·핵심
- **underlay(밑바닥)**: 시스템에 깔린 ROS2 본체 — `source /opt/ros/jazzy/setup.bash` (입문 1차시).
- **overlay(덧층)**: 그 위에 얹는 내 워크스페이스 — `source ~/ros2_ws/install/setup.bash`.
- **순서는 늘 underlay 먼저, overlay 나중**: 본체가 1층, 내 작업장이 2층.
- **overlay가 우선한다**: 본체와 같은 이름의 패키지를 내 워크스페이스에 빌드해 두면 본체를 건드리지 않고 내 버전이 먼저 쓰인다. 층은 여러 겹도 된다 — 본체 → 회사 공용 워크스페이스 → 내 개인 워크스페이스, 위로 갈수록 우선.
- **확인**: `ros2 pkg prefix 패키지` — `/home/…/ros2_ws/install/…`이면 내가 빌드한 판, `/opt/ros/jazzy`면 apt 판 (실습 5차시 TurtleBot3 소스 빌드 사례). 새 터미널에서 overlay source를 빼먹으면 다시 apt 판이 쓰인다.
- **공식 권장**: 빌드한 터미널 말고 **새 터미널에서** overlay를 source — 한 터미널에서 섞으면 2층 구조가 꼬일 수 있다.
- **.bashrc에는 underlay만**: 본체는 어디서나 같지만, overlay를 박아 두면 엉뚱한 작업장이 켜져 있는 사고가 난다 → overlay는 보통 손으로 친다.

## 원리·구조
```
  3층  ~/my_ws/install        ← 가장 우선
  2층  ~/team_ws/install
  1층  /opt/ros/jazzy         ← underlay
 같은 이름 패키지를 찾을 때 위층부터 본다 (AMENT_PREFIX_PATH 앞쪽이 위층)
```

## 코드 예시
```python
# AMENT_PREFIX_PATH 앞쪽부터 찾는 overlay 우선 규칙 흉내
layers = {
    "/home/student/ros2_ws/install": {"my_py_pkg", "turtlebot3_gazebo"},
    "/opt/ros/jazzy": {"turtlesim", "turtlebot3_gazebo", "rclpy"},
}
def source(path_list, new): return [new] + path_list      # source할 때마다 앞에 붙는다
prefix = source([], "/opt/ros/jazzy")
prefix = source(prefix, "/home/student/ros2_ws/install")
def pkg_prefix(pkg):
    for p in prefix:
        if pkg in layers[p]: return p
    return f"Package '{pkg}' not found"
print(pkg_prefix("turtlebot3_gazebo"))   # /home/student/ros2_ws/install
print(pkg_prefix("turtlesim"))           # /opt/ros/jazzy
```
```bash
source /opt/ros/jazzy/setup.bash          # underlay
source ~/ros2_ws/install/setup.bash       # overlay
printenv AMENT_PREFIX_PATH
ros2 pkg prefix turtlebot3_gazebo
```

## 관련 개념
[[ROS2 환경 소싱]] · [[워크스페이스]] · [[source와 .bashrc]] · [[환경변수와 PATH]] · [[apt 설치와 소스 빌드]]
