---
title: PointCloud2
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 비전·3D]
tags: [비전·3D, 점구름, 실습]
---
# PointCloud2

## 정의·핵심
- **정의**: `sensor_msgs/msg/PointCloud2` — 점구름을 **바이트 띠(data) + 그 띠를 읽는 설명서(fields·point_step)** 로 한 봉투에 담은 메시지. 영상이 Image였듯 점구름은 PointCloud2로 토픽을 흐른다 (실습 7차시).
- **직렬화**: 여러 점의 좌표를 통신·저장에 유리하도록 바이트 한 줄로 납작하게 눌러 담는다. 점을 하나하나 포장하면 메모리도 대역도 감당이 안 된다 → 받는 쪽은 반드시 **풀어야** 한다.
- **핵심 필드**:
  - `height`, `width` — 점 격자의 세로·가로(흩어진 점이면 height=1, width=점 개수)
  - `fields` — 각 점의 속성 이름·자료형·offset(표의 「열 정의」)
  - `point_step` — 점 하나의 바이트 수(표 한 행의 길이)
  - `row_step` — 한 줄의 바이트 수
  - `data` — 실제 바이트 배열(표의 본문)
  - `is_dense` — NaN(빈 측정) 없이 꽉 찼나
- **띠 자르는 규칙**: data를 point_step씩 자르면 점 하나 → 점 안에서 fields의 offset·자료형대로 → x·y·z 복원. 직접 하지 않고 `sensor_msgs_py.point_cloud2`의 `read_points` 계열이 대신.
- **점 세 개짜리 실측**: `create_cloud_xyz32(Header(frame_id='map'), pts)` → `height 1 width 3` · `point_step 12 row_step 36 data 36` · `x offset 0`, `y offset 4`, `z offset 8` — float32 셋(4바이트×3), 점이 셋이라 12×3.
- **frame_id**: 점이 어느 좌표계 기준인지 — RViz Fixed Frame과 맞아야 그려진다. 안 보이면 먼저 의심.
- **package.xml**: 관례로 `<exec_depend>sensor_msgs_py</exec_depend>`.

## 원리·구조
```
data: [x0 y0 z0][x1 y1 z1][x2 y2 z2]      ← point_step = 12 바이트씩
       0  4  8   (fields offset)
row_step = point_step × width = 36,  len(data) = row_step × height = 36
```

## 코드 예시
```python
# create_cloud_xyz32가 하는 일 흉내: float32 (N,3) → 바이트 띠, 그리고 설명서로 다시 풀기
import struct
import numpy as np
pts = np.array([[0.1, 0.2, 0.3], [1.0, 2.0, 3.0], [4.0, 5.0, 6.0]], dtype=np.float32)
fields = [("x", 0), ("y", 4), ("z", 8)]
point_step = 12
data = pts.tobytes()
print("height", 1, "width", len(pts))
print("point_step", point_step, "row_step", point_step * len(pts), "data", len(data))
for name, off in fields:
    print(name, "offset", off)
i = 1
x, y, z = (struct.unpack_from("<f", data, i * point_step + off)[0] for _, off in fields)
print(x, y, z)          # 1.0 2.0 3.0  ← 둘째 점 복원
# height 1 width 3
# point_step 12 row_step 36 data 36
# x offset 0
# y offset 4
# z offset 8
```
```python
# 실제 함수로 (ROS 환경)
import numpy as np
from std_msgs.msg import Header
from sensor_msgs_py import point_cloud2
pts = np.array([[0.1, 0.2, 0.3], [1.0, 2.0, 3.0], [4.0, 5.0, 6.0]], dtype=np.float32)
msg = point_cloud2.create_cloud_xyz32(Header(frame_id='map'), pts)
print('height', msg.height, 'width', msg.width)
print('point_step', msg.point_step, 'row_step', msg.row_step, 'data', len(msg.data))
for f in msg.fields:
    print(f.name, 'offset', f.offset)
```

## 관련 개념
[[read_points]] · [[점구름 발행]] · [[점구름]] · [[RViz]] · [[직렬화]] · [[메시지 헤더]]
