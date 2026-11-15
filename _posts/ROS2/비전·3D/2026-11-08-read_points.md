---
title: read_points
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 비전·3D]
tags: [비전·3D, 점구름, 실습]
---
# read_points

## 정의·핵심
- **정의**: `sensor_msgs_py.point_cloud2`의 풀기 함수 — PointCloud2의 바이트 띠를 계산에 쓸 numpy 배열로 되돌린다. 영상의 cv_bridge 자리 (실습 7차시).
- **`read_points(msg, field_names=('x','y','z'), skip_nans=True)`**: 점 N개짜리 **1차원 structured numpy array** — 칸 하나가 점 하나, 열마다 `'x'`·`'y'`·`'z'` 이름표. 실측 `[('x', '<f4'), ('y', '<f4'), ('z', '<f4')] (3,)`.
  - 열 통째로는 **이름으로** `pts['x']` → `[0.1 1.  4. ]`
  - 점 하나 안의 `p[0]`(=`pts[0][0]`)은 그 점의 x → `0.1`
  - **함정**: `pts[:, 0]` → `IndexError: too many indices for array: array is 1-dimensional, but 2 were indexed`
- **`read_points_numpy(msg, field_names=['x','y','z'], skip_nans=True)`**: 처음부터 일반 **(N,3) float 배열** → `float32 (3, 3) | x 열 = [0.1 1.  4. ]`, `xyz[:, 0]`이 된다. Open3D `Vector3dVector`에 바로 들어간다 — 이 차시의 기본.
  - read_points 결과를 그대로 넣으면 `RuntimeError: Unable to cast Python instance of type <class 'numpy.void'> to C++ type '?'`.
- **skip_nans=True**: 측정되지 않은 빈 점(NaN)을 버린다. 점 개수가 0이면 전부 NaN이었는지 본다.
- **왜 structured array가 있나 — 결함이 아니라 설계**: 실제 센서는 한 점에 좌표(float)·색(정수)·링 번호(또 다른 정수)를 싣는다 → 자료형이 뒤섞인 속성을 한 배열에 담으려면 칸마다 이름·자료형을 정의하는 그릇이 자연스럽다. read_points는 「점의 모든 속성」을 다루는 일반성, read_points_numpy는 「좌표만」의 지름길.

## 원리·구조
| | read_points | read_points_numpy |
|---|---|---|
| 반환 | 1차원 structured array(이름표 칸 N개) | 일반 (N,3) float 배열 |
| 열 꺼내기 | `pts['x']` (이름) | `xyz[:,0]` (위치) |
| 점 하나의 `p[0]` | 그 점의 x(필드 차례) | 그 행의 x |
| `pts[:,0]` | IndexError | 정상 |
| 혼합 속성 | 보존하기 좋음 | 같은 자료형 수치만 |
| Open3D 연동 | 변환 필요 | 바로 투입 |

## 코드 예시
```python
# read_points가 돌려주는 꼴(structured array)과 read_points_numpy의 꼴을 numpy로 재현
import numpy as np
xyz = np.array([[0.1, 0.2, 0.3], [1.0, 2.0, 3.0], [4.0, 5.0, 6.0]], dtype=np.float32)
pts = np.zeros(3, dtype=[('x', '<f4'), ('y', '<f4'), ('z', '<f4')])
pts['x'], pts['y'], pts['z'] = xyz[:, 0], xyz[:, 1], xyz[:, 2]
print('read_points', pts.dtype, pts.shape)     # read_points [('x', '<f4'), ('y', '<f4'), ('z', '<f4')] (3,)
print('pts[0][0] =', pts[0][0], '| pts["x"] =', pts['x'])   # pts[0][0] = 0.1 | pts["x"] = [0.1 1.  4. ]
try:
    print(pts[:, 0])
except IndexError as e:
    print('IndexError:', e)    # IndexError: too many indices for array: array is 1-dimensional, but 2 were indexed
back = np.stack([pts['x'], pts['y'], pts['z']], axis=1)          # 이름표 → (N,3)
print('read_points_numpy', back.dtype, back.shape, '| x 열 =', back[:, 0])   # read_points_numpy float32 (3, 3) | x 열 = [0.1 1.  4. ]
```
```python
# 실제 함수 (ROS 환경)
from sensor_msgs_py import point_cloud2
from sensor_msgs_py.point_cloud2 import read_points_numpy
pts = point_cloud2.read_points(msg, field_names=('x', 'y', 'z'), skip_nans=True)
xyz = read_points_numpy(msg, field_names=['x', 'y', 'z'], skip_nans=True)
```

## 관련 개념
[[PointCloud2]] · [[점구름 발행]] · [[Open3D]] · [[cv_bridge]]
