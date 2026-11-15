---
title: rclpy와 rclcpp
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, rclpy 프로그래밍]
tags: [rclpy프로그래밍, 클라이언트라이브러리, 입문]
---
# rclpy와 rclcpp

## 정의·핵심
- **정의**: 노드를 코드로 만들 때 쓰는 **클라이언트 라이브러리**. `rclpy`는 파이썬용, `rclcpp`는 C++용. 둘 다 공통 C 라이브러리 `rcl` 위에 얹혀 있고, 그 아래가 rmw → DDS (입문 1·3차시).
- **형제 라이브러리**: 노드·퍼블리셔·서브스크라이버·타이머·콜백·spin 구조가 거의 그대로 옮겨 간다 — 파이썬으로 개념을 굳히면 C++은 문법만 갈아입는 수준.
- **왜 파이썬으로 시작하나**: ① 컴파일이 없어 고치고 바로 돌린다 ② 구조가 rclcpp로 옮겨 간다 ③ 실무에서도 섞어 쓴다 — 인지·판단은 파이썬, 빠른 제어는 C++.
- **언어가 달라도 통신된다**: C++ talker ↔ Python listener — 같은 인터페이스(rosidl이 두 언어 코드를 생성)를 쓰기 때문.
- **고르는 기준**: 성능·실시간·하드웨어 드라이버 → rclcpp, 프로토타입·AI·영상 처리 연동 → rclpy. 같은 패키지 안에 섞을 수는 없다(빌드 타입이 다름) — 패키지를 나눈다.

## 원리·구조
```
 [내 노드 .py]        [내 노드 .cpp]
     rclpy                rclcpp
        └──── rcl (C) ────┘
               rmw
        DDS (Fast DDS / Cyclone)
```
| 항목 | rclpy | rclcpp |
|---|---|---|
| 노드 | `class X(Node)` | `class X : public rclcpp::Node` |
| 퍼블리셔 | `create_publisher(String, 'chatter', 10)` | `create_publisher<std_msgs::msg::String>("chatter", 10)` |
| spin | `rclpy.spin(node)` | `rclcpp::spin(node)` |
| 빌드 | ament_python (setup.py) | ament_cmake (CMakeLists.txt) |

## 코드 예시
```python
# rclpy 최소 노드 (rclcpp에서도 같은 4요소)
import rclpy
from rclpy.node import Node

def main():
    rclpy.init()                     # ① 초기화
    node = Node('hello_node')        # ② 노드
    node.get_logger().info('hello')  # ③ (통로 대신 로그 한 줄)
    rclpy.spin_once(node, timeout_sec=0.1)   # ④ 한 바퀴만
    node.destroy_node()
    rclpy.try_shutdown()
```
```cpp
// rclcpp 같은 모양
#include "rclcpp/rclcpp.hpp"
int main(int argc, char** argv) {
  rclcpp::init(argc, argv);
  auto node = std::make_shared<rclcpp::Node>("hello_node");
  RCLCPP_INFO(node->get_logger(), "hello");
  rclcpp::shutdown();
}
```

## 관련 개념
[[노드 4요소]] · [[DDS]] · [[ament]] · [[talker와 listener]] · [[인터프리터와 컴파일러]]
