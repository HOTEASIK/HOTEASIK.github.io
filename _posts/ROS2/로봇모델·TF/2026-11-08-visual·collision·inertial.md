---
title: visual·collision·inertial
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 로봇모델·TF]
tags: [로봇모델·TF, URDF, 실습]
---
# visual·collision·inertial

## 정의·핵심
- **정의**: 같은 URDF 링크를 **용도에 따라 세 가지로 표현**하는 하위 태그 (실습 4차시).
- **visual**: 화면에 보이는 모양 — RViz·시뮬레이터 렌더링. 정교하게(메시 파일 가능).
- **collision**: 충돌 검사용 형태 — 물리 충돌·간섭 검사. 계산을 가볍게 **단순한 박스·실린더**로.
- **inertial**: 질량·관성 — 물리 시뮬레이션(동역학). `<mass>`, `<inertia ixx … izz>`.
- **이 차시는 visual만으로 충분**: RViz에 그리기만 하므로. 다음 차시의 시뮬레이터(Gazebo)에서는 collision·inertial이 함께 필요해진다 — 없으면 물체가 통과하거나 물리 계산이 안 된다.
- **geometry 종류**: `box size="x y z"`, `cylinder radius length`, `sphere radius`, `mesh filename`.

## 원리·구조
```xml
<link name="arm_link">
  <visual>    <geometry><mesh filename="package://my_robot/meshes/arm.stl"/></geometry> </visual>
  <collision> <geometry><cylinder radius="0.03" length="0.4"/></geometry>      </collision>
  <inertial>  <mass value="0.5"/>
              <inertia ixx="0.0068" ixy="0" ixz="0" iyy="0.0068" iyz="0" izz="0.0002"/> </inertial>
</link>
```

## 코드 예시
```python
# 원기둥(z축) 관성 모멘트: ixx=iyy=m(3r²+h²)/12, izz=m r²/2 — inertial 칸을 채울 때
def cylinder_inertia(m, r, h):
    ixx = m * (3 * r**2 + h**2) / 12
    return round(ixx, 4), round(ixx, 4), round(m * r**2 / 2, 5)
def box_inertia(m, x, y, z):
    return tuple(round(m * (a**2 + b**2) / 12, 5) for a, b in ((y, z), (x, z), (x, y)))
print(cylinder_inertia(0.5, 0.03, 0.4))   # (0.0068, 0.0068, 0.00022)
print(box_inertia(2.0, 0.3, 0.3, 0.1))    # (0.01667, 0.01667, 0.03)
```

## 관련 개념
[[URDF]] · [[Gazebo]] · [[로봇 시뮬레이션]] · [[xacro]]
