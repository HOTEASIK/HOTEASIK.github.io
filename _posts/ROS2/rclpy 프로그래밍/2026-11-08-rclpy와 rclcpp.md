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

## 수업 메모

패키지 만들 때 
의 차이

| c++,                                                        | python                                                                        |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 실시간 제어                                                      | 로직                                                                            |
| 하드 스펙과 저지연(Low-latency)이 중요한 부분                             | 빠른 알고리즘 구현이 중요한 부분에는 충분히 실용적(인공지능(AI), 머신러닝, 상위 레벨 로직, GUI, 데이터 로깅)           |
| 멀티스레딩(Multi-threading)과 콜백 그룹(Callback group)을 정교하게 제어하기 좋음 | 딥러닝 라이브러리(PyTorch, TensorFlow)나 데이터 분석 도구(NumPy, Pandas)를 ROS 노드와 연동하기가 매우 쉬움 |


### 디버그 하는 법

#### 팁 
변수 한꺼번에 선택 : ctrl + d
vscode 
#### 디버그 모드
##### 점진적 개발
#### 디버그 콘솔


### 다른 솔류션 사용 
교차 검증하자

#### zero turst


### 토픽,서비스 패키지 만들기 


#### rclpy

##### 초기화 
rclpy.init() 노드 생성 자체가 실패
##### 노드 정의
class X(Node) + super().__init__('이름') 통로·로그 등을 쓸 수 없음
##### 통로 열기
create_publisher 등 create_* 다섯 통신·주기 동작이 없음

##### 살려 두기
rclpy.spin(node) 즉시 종료([[콜백]]이 한 번도 안 울림)

###### while을 안쓰는 이유
while 은 내가 직접 함수를 부르기 때문에 계속 자원을 쓴다.
	계속 상태를 확인한다. >> 자원 낭비
그래서 콜백을 이용해서 하나가 끝나면 다른 함수가 오게 한다.

## 관련 개념
[[노드 4요소]] · [[DDS]] · [[ament]] · [[talker와 listener]] · [[인터프리터와 컴파일러]]
