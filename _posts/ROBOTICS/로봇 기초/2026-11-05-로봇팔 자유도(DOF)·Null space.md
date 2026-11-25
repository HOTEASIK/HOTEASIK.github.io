---
title: 로봇팔 자유도(DOF)·Null space
date: 2026-11-05 12:00:00 +0900
categories: [ROBOTICS, 로봇 기초]
tags: [로봇, 기구학, DOF, 피지컬AI, 보충]
---
# 로봇팔 자유도(DOF)·Null space

## 정의·핵심
- **자유도 (DOF, Degree of Freedom, 인공지능로봇응용 2주차)**: 물체(로봇)가 **독립적으로 움직일 수 있는 방향 또는 운동의 개수** (퀴즈 Q2 정답)
  - 공간의 강체: 위치 3 + 자세(회전) 3 = **6 DOF** / 사람 팔은 어깨 3 + 팔꿈치 1 + 손목 3 = 약 **7 DOF**
  - 협동로봇 UR 시리즈는 회전 관절 6개 = 6 DOF
- **관절의 종류 (강의)**
  - **회전 관절 (Revolute)**: 축을 중심으로 회전 — 관절 값 = 각도 θ
  - **직선 관절 (Prismatic)**: 한 방향으로 미끄러짐 — 관절 값 = 거리 d
- **관절공간 vs 작업공간**
  - **관절공간 (Joint space)**: 각 관절의 값 (q₁, …, qₙ)
  - **작업공간 (Task space)**: 손끝(엔드이펙터)의 **위치와 자세** (x, y, z, roll, pitch, yaw)
- **기구학 (Kinematics)**
  - **정기구학 (FK)**: **관절공간 → 작업공간** — 관절 값으로 손끝 위치 계산, 해가 하나로 정해짐 (퀴즈 Q1: "손끝 목표로 관절 값 계산"은 FK가 아니라 IK → **X**)
  - **역기구학 (IK)**: **작업공간 → 관절공간** — 목표 위치로 관절 값 계산
  - **IK가 어려운 이유**: 비선형(삼각함수) 방정식, **해가 여러 개**(팔꿈치 위/아래)이거나 **없을 수도**(도달 불가), 특이점(singularity) → 보통 자코비안 기반 **반복 수치 해법**
- **여유자유도와 널스페이스 (Null space)**
  - 작업에 필요한 자유도(6)보다 관절이 많으면(7 DOF) **여유자유도(Redundancy)**
  - **Null space 동작**: **손끝 위치·자세는 그대로 유지하면서** 팔꿈치 등 관절만 움직이는 동작 (강의 영상: 7 DOF Robotic Arm Null space motions) → 장애물 회피, 관절 한계 회피에 활용
  - 수학적으로: 자코비안 J의 **영공간** `J·q̇ = 0` 인 관절 속도
- **정책 모델의 출력 (강의 2절)**
  - **방법 1 — 관절공간 명령**: 정책이 관절 값을 직접 출력 → 로봇 구조마다 정책이 달라야 함
  - **방법 2 — 작업공간 명령**: 정책이 손끝 목표를 출력 → **로봇별 IK로 각자의 관절 명령으로 변환** → **하나의 정책을 서로 다른 로봇에** 적용 가능 (퀴즈 Q3 정답) → [[VLA(Vision-Language-Action)]]

## 수식·원리
```
2링크 평면 팔 FK:  x = l1 cos q1 + l2 cos(q1+q2),   y = l1 sin q1 + l2 sin(q1+q2)
속도 관계:        ẋ = J(q) q̇,      J = ∂x/∂q   (m × n)
IK (수치):        q ← q + J⁺ (x_target − FK(q))           J⁺ = 의사역행렬
Null space:       q̇ = J⁺ ẋ + (I − J⁺J) z     →  (I − J⁺J) z 는 손끝을 움직이지 않음
여유자유도 = n − m   (관절 수 − 작업 차원)
```

## 코드 예시
```python
import numpy as np

L = np.array([1.0, 1.0, 1.0])                              # 3링크 평면 팔 (3 DOF, 작업은 x·y 2차원 → 여유자유도 1)

def fk(q):                                                 # 정기구학: 관절 → 손끝
    a = np.cumsum(q)
    return np.array([np.sum(L * np.cos(a)), np.sum(L * np.sin(a))])

def jacobian(q, eps=1e-6):
    return np.stack([(fk(q + eps * np.eye(3)[i]) - fk(q)) / eps for i in range(3)], axis=1)   # (2, 3)

def ik(target, q0, iters=200):                             # 역기구학: 의사역행렬 반복
    q = q0.copy()
    for _ in range(iters):
        q += np.linalg.pinv(jacobian(q)) @ (target - fk(q))
    return q

target = np.array([1.5, 1.2])
q_a = ik(target, np.array([0.1, 0.5, 0.5]))
q_b = ik(target, np.array([1.5, -1.0, -0.5]))              # 다른 초기값 → 다른 해
print(np.allclose(fk(q_a), target, atol=1e-6), np.allclose(fk(q_b), target, atol=1e-6), not np.allclose(q_a, q_b, atol=1e-2))   # True True True  IK 해가 여러 개
tip = fk(ik(np.array([4.0, 0.0]), np.zeros(3) + 0.1))
print(float(np.linalg.norm(tip)) <= 3.0, round(float(np.linalg.norm(np.array([4.0, 0.0]) - tip)), 2) > 0.9)   # True True  팔 길이 합 3 → (4, 0)은 도달 불가 (해 없음)

q = q_a.copy()                                             # Null space 동작: 손끝 고정, 관절만 이동
start_tip = fk(q)
for _ in range(100):
    J = jacobian(q)
    N = np.eye(3) - np.linalg.pinv(J) @ J                  # 영공간 투영
    q += N @ np.array([0.0, 0.05, 0.0])                   # 두 번째 관절을 움직이고 싶음
    q += np.linalg.pinv(jacobian(q)) @ (start_tip - fk(q))   # 수치 오차 보정
print(np.allclose(fk(q), start_tip, atol=1e-4), round(float(np.abs(q - q_a).max()), 2) > 0.1)   # True True  손끝 그대로, 관절 자세는 바뀜
```

## 관련 개념
[[VLA(Vision-Language-Action)]] · [[피지컬 AI 개요]] · [[Policy Network]]
