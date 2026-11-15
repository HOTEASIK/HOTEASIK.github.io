---
title: rosidl_generate_interfaces
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 패키지·빌드·인터페이스]
tags: [패키지·빌드·인터페이스, 인터페이스, 입문]
---
# rosidl_generate_interfaces

## 정의·핵심
- **정의**: CMakeLists.txt에서 「이 목록의 양식들을 코드로 찍어라」라고 rosidl(ROS Interface Definition Language) 코드 생성기에 시키는 명령. **목록에 적힌 파일만** 타입이 된다 (입문 2차시).
- **마법의 여섯 줄**: 양식을 적어 두기만 해서는 아무 일도 없다 — 두 파일에 작업 지시를 넣는다. 「여섯」은 묶음으로 센 수(화면 줄 수는 더 많다).

| 파일 | 줄 | 한마디 |
|---|---|---|
| CMakeLists.txt | `find_package(rosidl_default_generators REQUIRED)` | 생성기 재료 꺼내기 |
| CMakeLists.txt | `rosidl_generate_interfaces(${PROJECT_NAME} ...)` | 이 양식들을 찍어라 |
| CMakeLists.txt | `ament_export_dependencies(rosidl_default_runtime)` | 쓰는 쪽에 런타임 딸려 보내기 |
| package.xml | `<buildtool_depend>rosidl_default_generators</buildtool_depend>` | 빌드 때 생성기 |
| package.xml | `<exec_depend>rosidl_default_runtime</exec_depend>` | 실행 때 런타임 |
| package.xml | `<member_of_group>rosidl_interface_packages</member_of_group>` | 인터페이스 그룹 명찰 |

- **자리**: `find_package(ament_cmake REQUIRED)`와 `ament_package()` 사이. 템플릿의 `if(BUILD_TESTING)` 등은 지우지 않는다.
- **순서 함정**: find_package가 생성 줄보다 **위**에 — 재료를 꺼내기 전에 볶으라 하면 `Unknown CMake command "rosidl_generate_interfaces"`.
- **명찰 누락**: `Packages installing interfaces must include '<member_of_group>rosidl_interface_packages</member_of_group>'` — 에러 문장이 처방까지 들고 온다.
- **새 양식 추가 = 한 묶음**: 파일 생성 → 목록 등록 → 재빌드 → 재source. 목록 누락이면 빌드는 성공하는데 타입만 없다.
- **표준 타입을 칸으로 쓰면**: `find_package(geometry_msgs REQUIRED)` + 목록에 `DEPENDENCIES geometry_msgs` + package.xml `<depend>geometry_msgs</depend>`. DEPENDENCIES를 빼면 빌드 실패, `<depend>`만 빼면 **성공**(내 PC에 깔려 있어 우연히) — 조용히 통과하는 쪽이 더 위험.

## 원리·구조
```cmake
cmake_minimum_required(VERSION 3.8)
project(my_interfaces)
find_package(ament_cmake REQUIRED)
find_package(rosidl_default_generators REQUIRED)
rosidl_generate_interfaces(${PROJECT_NAME}
  "msg/TurtleGoal.msg"
  "srv/AddThreeInts.srv"
  "srv/SetTurtleName.srv"
  "action/CountUp.action"        # 5차시에 한 줄 추가
)
ament_export_dependencies(rosidl_default_runtime)
ament_package()
```

## 코드 예시
```python
# CMakeLists 점검기: 순서·목록 누락 찾기
import re, os
cmake = """find_package(ament_cmake REQUIRED)
rosidl_generate_interfaces(${PROJECT_NAME}
  "msg/TurtleGoal.msg"
  "srv/AddThreeInts.srv"
)
find_package(rosidl_default_generators REQUIRED)
ament_package()"""
files_on_disk = ["msg/TurtleGoal.msg", "srv/AddThreeInts.srv", "srv/Ping.srv"]
i_find = cmake.find("find_package(rosidl_default_generators")
i_gen = cmake.find("rosidl_generate_interfaces(")
if i_find == -1 or i_find > i_gen:
    print('Unknown CMake command "rosidl_generate_interfaces" — find_package를 위로')
listed = re.findall(r'"([^"]+\.(?:msg|srv|action))"', cmake)
print("목록 누락:", [f for f in files_on_disk if f not in listed])   # 목록 누락: ['srv/Ping.srv']
```

## 관련 개념
[[인터페이스 패키지]] · [[package.xml]] · [[msg 파일]] · [[colcon 오류 해독]] · [[ament]]
