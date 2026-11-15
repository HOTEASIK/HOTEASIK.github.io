---
title: Ray Casting
date: 2026-11-05 12:00:00 +0900
categories: [AI, 3D 렌더링]
tags: [3D, 레이캐스팅, 광선, AI응용]
---
# Ray Casting

## 정의·핵심
- **비유 (응용 9차시)**: Ray Casting은 '**레이저 포인터**'와 같다
  1. **레이저 발사**: 눈(카메라)에서 **픽셀을 향해** 가상의 광선을 쏨
  2. **충돌 감지**: 광선 경로에 있는 물체들과 만나는지 검사
  3. **최초 충돌 선택**: **가장 가까이 있는 물체만** 인식 → 레이저가 날아간 거리(t)로 **깊이(Depth)** 획득
  - **가려짐 (Occlusion)**: 앞 물체에 닿으면 뒤 물체는 닿지 않음 (강의 그림: 광선이 T2, T1 두 삼각형을 지나지만 처음 닿는 T2만 보이고 T1은 가려짐)
  - **색상 결정**: 부딪힌 지점의 색을 계산해 픽셀에 칠함
  - Ray Tracing과 NeRF의 **기초가 되는 핵심 원리**
- **광선의 방정식 (강의)**: **r(t) = o + t·d** (t > 0)
  - **o: Ray Origin** — 픽셀마다 광선을 쏘기 위한 **시작점 (카메라 위치)**
  - **d: Ray Direction** — 광선을 쏘는 **방향** (단위 벡터)
  - **t**: 거리 파라미터 → r(t) = "레이저 포인터를 쏠 때 거리 t에 있는 점"
  - 9차시 과제 문항 1: 광선을 정의하는 두 벡터 = **Ray Origin, Ray Direction**
- **광선 생성 (강의, 과제 문항 3 `get_rays`)**: 이미지 픽셀 (u, v) → **카메라 좌표계**의 방향 `((u − W/2)/f, −(v − H/2)/f, −1)` → **c2w 회전**을 곱해 **월드 좌표계 방향** / 원점 = c2w의 이동 성분(카메라 위치) → [[가상 카메라]]
- **Ray Tracing vs Ray Marching (9차시 Tiny NeRF 노트)**
  - **Ray Tracing**: **메시 필요** — 표면에 정확히 맞을 때까지 진행, 반사·그림자 계산 → [[Polygon·Mesh]]
  - **Ray Marching (NeRF)**: **메시 없음** — 광선을 따라 **일정 간격으로 여러 점 샘플링** → 각 점에서 MLP로 색·밀도 → 볼륨 렌더링 공식으로 합침 → [[Volume Rendering]]

## 수식·원리
```
r(t) = o + t · d,   t > 0
카메라 방향:  d_cam = ( (i − W/2)/f,  −(j − H/2)/f,  −1 )
월드 방향:    d = R_c2w · d_cam,        o = t_c2w (c2w[:3, 3])
구 교차:  ‖o + t d − c‖² = r²  →  t² (d·d) + 2t (d·(o − c)) + ‖o − c‖² − r² = 0   (작은 양수 근 = 최초 충돌)
```

## 코드 예시
```python
import numpy as np

def get_rays(H, W, focal, c2w):                          # 9차시 과제 문항 3 (numpy 버전)
    i, j = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32), indexing="xy")
    dirs = np.stack([(i - W * .5) / focal, -(j - H * .5) / focal, -np.ones_like(i)], -1)
    rays_d = np.sum(dirs[..., None, :] * c2w[:3, :3], -1)   # 카메라 → 월드 회전
    rays_o = np.broadcast_to(c2w[:3, -1], rays_d.shape)     # 모든 광선의 원점 = 카메라 위치
    return rays_o, rays_d

c2w = np.eye(4); c2w[2, 3] = 4.0                           # 카메라: z=4에서 −z 방향을 봄
H = W = 64; rays_o, rays_d = get_rays(H, W, 60.0, c2w)
print(rays_o.shape, rays_d[32, 32].tolist())               # (64, 64, 3) [0.0, 0.0, -1.0]  중앙 광선은 정면

def hit_sphere(o, d, center, r):                           # 최초 충돌 거리 t (없으면 inf)
    oc = o - center
    a, b, c = (d * d).sum(-1), 2 * (d * oc).sum(-1), (oc * oc).sum(-1) - r ** 2
    disc = b * b - 4 * a * c
    t = (-b - np.sqrt(np.maximum(disc, 0))) / (2 * a)
    return np.where((disc >= 0) & (t > 0), t, np.inf)

t_front = hit_sphere(rays_o, rays_d, np.array([0, 0, 0.0]), 1.0)     # 앞 구 (T2 역할)
t_back = hit_sphere(rays_o, rays_d, np.array([0, 0, -3.0]), 2.0)     # 뒤의 더 큰 구 (T1 역할)
depth = np.minimum(t_front, t_back)
img = np.where(np.isinf(depth), 0, np.where(t_front <= t_back, 1, 2))   # 1=앞 구, 2=뒤 구, 0=배경
print(round(float(depth[32, 32]), 3), int(img[32, 32]))     # 3.0 1  중앙: 앞 구까지 거리 3, 뒤 구는 가려짐
print(sorted(np.unique(img).tolist()))                      # [0, 1, 2]  가장자리에선 뒤 구가 보임
```

## 관련 개념
[[가상 카메라]] · [[Volume Rendering]] · [[NeRF]] · [[Tiny NeRF 구현]] · [[Polygon·Mesh]]
