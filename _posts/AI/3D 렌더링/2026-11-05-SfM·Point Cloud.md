---
title: SfM·Point Cloud
date: 2026-11-05 12:00:00 +0900
categories: [AI, 3D 렌더링]
tags: [3D, SfM, PointCloud, AI응용]
---
# SfM·Point Cloud

## 정의·핵심
- **SfM (Structure from Motion)**: 여러 장의 사진만으로 **카메라 포즈(Motion)** 와 **장면의 3D 구조(Structure, 점 구름)** 를 동시에 추정하는 기법
  - 응용 9차시: Gaussian Splatting의 **STEP 1 초기화 = SfM / SLAM 점구름(Point Cloud)에서 시작** → [[Gaussian Splatting]]
  - NeRF 입력의 **카메라 포즈**도 보통 SfM 도구(**COLMAP**)로 구함 → 강의: "Camera Pose 정확도가 렌더링 품질을 결정짓는 가장 중요한 요소" → [[NeRF]], [[가상 카메라]]
- **SfM 파이프라인 (일반)**
  1. **특징점 검출·기술**: 각 이미지에서 SIFT/ORB 등 → [[특징점·디스크립터 매칭]]
  2. **매칭**: 이미지 쌍 사이의 같은 점 찾기 (+ RANSAC으로 이상치 제거)
  3. **상대 포즈 추정**: 대응점으로 Essential/Fundamental 행렬 → 두 카메라의 R, t
  4. **삼각측량 (Triangulation)**: 두 시점의 광선이 만나는 곳 = 3D 점
  5. **Bundle Adjustment**: 모든 카메라 포즈와 3D 점을 함께 조정해 **재투영 오차** 최소화
  - **SLAM**: SfM을 **실시간·순차적으로** (로봇·자율주행에서 지도 작성과 위치 추정을 동시에)
- **Point Cloud (점 구름)**: (x, y, z) 좌표(+ 색, 법선)를 가진 **점들의 집합** — 메시처럼 면 연결 정보가 없음 (가장 단순한 3D 표현) → [[Polygon·Mesh]]
  - 출처: SfM, **LiDAR**, 깊이 카메라(RGB-D)
  - 처리: 다운샘플링(Voxel Grid), 노이즈 제거, 법선 추정, 메시 복원(Poisson) / 딥러닝: **PointNet**(순서 무관 처리)
- **Gaussian Splatting과의 관계**: 각 점을 **3D 가우시안 타원체**로 키워(위치 = 점, 공분산·색·불투명도 추가) 최적화 → "점 구름의 확장된 형태" (강의)

## 수식·원리
```
투영:  x_img ~ K [R | t] X_world
삼각측량 (DLT):  x × (P X) = 0  두 시점 → A X = 0,  X = A의 최소 특이벡터
Bundle Adjustment:  min_{R_i, t_i, X_j} Σ_{i,j} ‖ x_ij − π(K, R_i, t_i, X_j) ‖²
```

## 코드 예시
```python
import numpy as np

rng = np.random.default_rng(0)
K = np.array([[100.0, 0, 50], [0, 100.0, 50], [0, 0, 1]])
def P_mat(R, t): return K @ np.hstack([R, t[:, None]])
def project(P, X):
    x = (P @ np.hstack([X, np.ones((len(X), 1))]).T).T
    return x[:, :2] / x[:, 2:]

X_true = rng.uniform(-1, 1, (50, 3)) + np.array([0, 0, 5.0])     # 장면의 3D 점 (정답)
th = np.radians(10)
R2 = np.array([[np.cos(th), 0, np.sin(th)], [0, 1, 0], [-np.sin(th), 0, np.cos(th)]])
P1, P2 = P_mat(np.eye(3), np.zeros(3)), P_mat(R2, np.array([-1.0, 0, 0]))   # 두 카메라 포즈 (알고 있다고 가정)
x1 = project(P1, X_true) + rng.normal(0, 0.2, (50, 2))           # 두 사진에서 매칭된 특징점 (픽셀 노이즈)
x2 = project(P2, X_true) + rng.normal(0, 0.2, (50, 2))

def triangulate(P1, P2, a, b):                                  # DLT 삼각측량
    A = np.stack([a[0] * P1[2] - P1[0], a[1] * P1[2] - P1[1], b[0] * P2[2] - P2[0], b[1] * P2[2] - P2[1]])
    X = np.linalg.svd(A)[2][-1]
    return X[:3] / X[3]

cloud = np.array([triangulate(P1, P2, a, b) for a, b in zip(x1, x2)])   # 점 구름 복원
err = np.linalg.norm(cloud - X_true, axis=1)
reproj = np.linalg.norm(project(P1, cloud) - x1, axis=1).mean()
print(cloud.shape, round(float(np.median(err)), 3) < 0.1, round(float(reproj), 2) < 0.5)   # (50, 3) True True  3D 점 복원, 재투영 오차 작음

voxel = 0.5                                                    # Voxel Grid 다운샘플링
keys = np.floor(cloud / voxel).astype(int)
print(len(np.unique(keys, axis=0)) < len(cloud))               # True  같은 칸의 점을 하나로
```

## 관련 개념
[[Gaussian Splatting]] · [[NeRF]] · [[가상 카메라]] · [[Polygon·Mesh]] · [[특징점·디스크립터 매칭]]
