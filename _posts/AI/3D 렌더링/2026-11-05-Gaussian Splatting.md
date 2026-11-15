---
title: Gaussian Splatting
date: 2026-11-05 12:00:00 +0900
categories: [AI, 3D 렌더링]
tags: [3D, GaussianSplatting, 실시간렌더링, AI응용]
---
# Gaussian Splatting

## 정의·핵심
- **정의 (응용 9차시)**: 3D Gaussian Splatting (Kerbl et al., 2023). **NeRF의 느린 속도를 극복**하기 위해 등장 — 장면을 **수많은 3D 가우시안 타원체들의 집합**으로 표현
  - 연속 볼륨 대신 **흐릿한 점(타원체)들을 겹쳐** 장면 구성 → **점 구름(Point Cloud)의 확장된 형태** → [[SfM·Point Cloud]]
- **핵심 파라미터 (강의)**: 각 가우시안 = **위치 μ** · **공분산 Σ** (크기·방향) · **색상** (구면 조화 함수로 시점에 따라) · **불투명도 α**
- **다변량 가우시안 (강의 14절)**
  - **μ 평균 벡터**: 분포의 중심 (3D 공간의 x, y, z)
  - **Σ 공분산 행렬**: 데이터의 **회전·크기(Scale)·방향** → 타원체의 모양 (Spherical / Diagonal / **Rotated(Full Σ)** — Gaussian Splatting은 **회전된 타원** 사용)
  - 실제로는 Σ = R S Sᵀ Rᵀ (회전 R + 축별 크기 S)로 두어 **항상 양의 정부호** 유지
  - **등가 타원체 (Iso-surface)**: 같은 확률 밀도를 가진 점들의 표면 = Gaussian Splatting의 "알갱이"
  - ML 활용: **VAE**(잠재 공간), **Kalman Filter**(상태 추정), **GMM**(클러스터링), **이상치 탐지** → [[VAE]]
- **작동 원리 3단계 (강의)**
  1. **초기화**: **SfM / SLAM 점구름**에서 시작
  2. **최적화**: 위치·공분산·색상·불투명도 파라미터를 렌더링 Loss로 업데이트 (**adaptive density**: 필요한 곳은 가우시안을 쪼개고/복제, 불필요하면 제거)
  3. **렌더링**: 화면 공간에서 가우시안을 **깊이 순으로 정렬**하고 **알파 블렌딩**으로 중첩
- **래스터라이즈 기반 (강의)**: Ray Marching 없이 3D 타원체를 **2D 화면에 투영해 그리는(Splatting)** 방식 → **GPU 친화적**, **1080p에서 30fps 이상 실시간** → VR/AR 등 상호작용 앱에 적합
- **NeRF vs Gaussian Splatting (강의 13절)**

| 항목 | NeRF | Gaussian Splatting |
|---|---|---|
| 표현 | **연속 볼륨** (Continuous Field, MLP) | **점 구름** (Discrete 3D Gaussians) |
| 렌더링 | Ray Marching (광선마다 수백 번 MLP) | Rasterization (투영 + 블렌딩) |
| 화질 | 매우 높음 (사실적) | 높은 품질 |
| 속도 | 학습·렌더링 **느림**, 실시간 어려움 | **매우 빠름 (실시간)**, 빠른 학습 |
| 단점 | 연산량·메모리 | 가우시안 수 증가 시 **메모리·연산 ↑** |

## 수식·원리
```
G(x) = exp( −½ (x − μ)ᵀ Σ⁻¹ (x − μ) ),     Σ = R S Sᵀ Rᵀ
2D 투영:  Σ' = J W Σ Wᵀ Jᵀ   (W: 뷰 변환, J: 투영의 야코비안)
픽셀 색 (앞→뒤 정렬):  C = Σ_i c_i α_i Π_{j<i} (1 − α_j),   α_i = o_i · G'_i(픽셀)
```

## 코드 예시
```python
import numpy as np

def rot2d(th): return np.array([[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]])

# 2D 화면에 투영된 가우시안 3개: (중심, 크기, 회전, 색, 불투명도, 깊이)
gaussians = [
    (np.array([12.0, 12.0]), np.array([6.0, 2.0]), np.pi / 4, np.array([1.0, 0, 0]), 0.9, 2.0),   # 빨강, 회전된 타원
    (np.array([20.0, 16.0]), np.array([4.0, 4.0]), 0.0, np.array([0, 1.0, 0]), 0.8, 3.0),        # 초록, 원
    (np.array([16.0, 14.0]), np.array([8.0, 3.0]), 0.0, np.array([0, 0, 1.0]), 0.6, 5.0),        # 파랑, 가장 뒤
]
H = W = 32
ys, xs = np.mgrid[0:H, 0:W]; P = np.stack([xs, ys], -1).astype(float)
img, T = np.zeros((H, W, 3)), np.ones((H, W))                 # T: 남은 투과도
for mu, scale, th, color, opac, depth in sorted(gaussians, key=lambda g: g[5]):   # 깊이 순 정렬 (앞→뒤)
    R, S = rot2d(th), np.diag(scale)
    cov = R @ S @ S.T @ R.T                                   # Σ = R S Sᵀ Rᵀ
    d = P - mu
    g = np.exp(-0.5 * np.einsum("hwi,ij,hwj->hw", d, np.linalg.inv(cov), d))
    alpha = opac * g
    img += (T * alpha)[..., None] * color                     # 알파 블렌딩
    T *= 1 - alpha

print(np.linalg.eigvalsh(rot2d(np.pi / 4) @ np.diag([36.0, 4.0]) @ rot2d(np.pi / 4).T).round(1).tolist())   # [4.0, 36.0]  공분산 고유값 = 크기², 회전과 무관
print(img[12, 12].round(2).tolist(), int(img[12, 12].argmax()))   # 빨강 중심: 앞의 빨강이 지배
print(round(float(T[12, 12]), 3) < 0.2, round(float(T[0, 31]), 3))   # True 1.0  중심은 거의 가려지고, 구석은 빈 공간
```

## 관련 개념
[[NeRF]] · [[SfM·Point Cloud]] · [[Volume Rendering]] · [[VAE]] · [[3D 렌더링 개요]]
