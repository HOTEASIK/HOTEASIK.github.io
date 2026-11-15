---
title: Polygon·Mesh
date: 2026-11-05 12:00:00 +0900
categories: [AI, 3D 렌더링]
tags: [3D, 메시, 폴리곤, AI응용]
---
# Polygon·Mesh

## 정의·핵심
- **왜 쪼개나 (응용 9차시)**: 컴퓨터는 **연속적인 곡면을 직접 이해할 수 없음** → 모든 객체를 **가장 단순한 단위로** 쪼갬
  - **점들의 집합 (Vertices)**: 객체는 3차원 좌표 (x, y, z)를 가진 점들의 집합
  - **기본 단위 = 삼각형 (Triangle)**: 점을 연결해 면(Face)을 만들 때 최소 단위. 현대 3D 그래픽스는 거의 모든 객체를 삼각형으로 처리
- **왜 하필 삼각형인가 (강의)**
  - **완벽한 평면성**: 3개의 점은 **항상 하나의 평면** 위에 존재 → 절대 뒤틀리지 않음
  - **사각형(Quad)의 문제**: 점 하나만 움직여도 평면이 깨짐 → **법선(Normal) 정의 불가**
  - **계산 단순화**: 법선 벡터·조명 계산이 가장 쉬움
  - **GPU 최적화**: 모든 그래픽 카드는 삼각형 처리에 특화
  - **표면 근사**: 가장 단순한 도형으로 모든 곡면 표현 가능
- **Polygon Mesh (강의)**: 현실의 매끄러운 물체를 디지털로 옮기기 위한 **껍데기(그물망)**
  - **메시의 3요소 (V-E-F)**: **Vertex**(정점, x·y·z) · **Edge**(두 점을 잇는 선) · **Face**(선들이 닫혀 만든 삼각형 면)
  - **연속 곡면의 근사**: 메모리가 유한하므로 부드러운 곡면을 **유한 개의 작은 삼각형**으로 근사 (많을수록 매끄럽지만 무거움)
  - **표면 속성**: 빛 반사 방향을 결정하는 **법선(Normal)**, 2D 이미지(텍스처)를 입히는 **UV 좌표**
- **파일 포맷 (강의)**: **.OBJ**(구조 중심), **.FBX**(애니메이션 포함), **.GLTF**(웹·모바일 최적화)
- **NeRF와의 차이**: 메시는 **표면**만 저장(명시적), NeRF는 공간 전체의 밀도·색을 **신경망 함수**로(암시적) → [[NeRF]]

## 수식·원리
```
법선:  n = (v1 − v0) × (v2 − v0) / ‖(v1 − v0) × (v2 − v0)‖
삼각형 넓이 = ½ ‖(v1 − v0) × (v2 − v0)‖
오일러 공식 (닫힌 메시, 구멍 없음):  V − E + F = 2
램버트 조명:  밝기 = max(0, n · l)      (l = 광원 방향)
```

## 코드 예시
```python
import numpy as np

V = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]], dtype=float)   # 사면체: 정점 4
F = np.array([[0, 2, 1], [0, 1, 3], [0, 3, 2], [1, 2, 3]])                  # 삼각형 면 4
E = {tuple(sorted((f[i], f[(i + 1) % 3]))) for f in F for i in range(3)}    # 모서리
print(len(V), len(E), len(F), len(V) - len(E) + len(F))   # 4 6 4 2  V-E+F = 2

def normal(f):
    v0, v1, v2 = V[f]
    n = np.cross(v1 - v0, v2 - v0)
    return n / np.linalg.norm(n)
print([normal(f).round(3).tolist() for f in F[:2]])      # 바닥(-z)·옆면(-y) 바깥쪽 법선

quad = np.array([[0, 0, 0], [1, 0, 0], [1, 1, 0.3], [0, 1, 0]], dtype=float)   # 사각형: 한 점이 들뜸
n1 = np.cross(quad[1] - quad[0], quad[2] - quad[0]); n2 = np.cross(quad[2] - quad[0], quad[3] - quad[0])
print(np.allclose(n1 / np.linalg.norm(n1), n2 / np.linalg.norm(n2)))   # False  평면이 깨져 법선이 하나로 안 정해짐

light = np.array([0, 0, -1.0])                           # 램버트 조명
print(round(max(0.0, float(normal(F[0]) @ light)), 2))   # 1.0  빛을 정면으로 받는 면이 가장 밝음

for n in (8, 32, 128):                                   # 원을 삼각형 n개로 근사 → n이 클수록 정확
    area = n * 0.5 * np.sin(2 * np.pi / n)
    print(n, round(area, 4))                             # π = 3.1416에 수렴
```

## 관련 개념
[[3D 렌더링 개요]] · [[Ray Casting]] · [[NeRF]] · [[SfM·Point Cloud]]
