---
title: "sensor_msgs"
date: 2026-10-20 12:00:00 +0900
categories: [ROS2, 패키지·빌드·인터페이스]
tags: []
---
# 정의
**카메라·라이다·관성센서** 같은 센서 데이터를 담는 표준 메시지 패키지. 표준 양식 모음(common_interfaces)의 하나다.

# 주요 타입
| 타입 | 센서 | 담는 것 |
|---|---|---|
| `Image` | 카메라 | 픽셀 격자 |
| `CameraInfo` | 카메라 | 내부 파라미터(초점거리 등) |
| `LaserScan` | 2D 라이다 | 각도별 거리 `ranges` |
| `PointCloud2` | 3D 라이다·깊이 카메라 | 3D 점 배열 |
| `Imu` | 관성센서 | 가속도·각속도·자세 |

# Image
한 꺼풀 벗기면 그림이 아니라 **숫자의 격자**다. 640×480 컬러 한 장 = 640 × 480 × 3(BGR) = 921,600개.
- 칸: `header`(시각·좌표계 이름), `height`, `width`, `encoding`(색 규칙, 예 `bgr8`), `step`(한 줄 바이트 수), `data`

OpenCV(numpy)와는 `cv_bridge`로 오간다.
```python
from sensor_msgs.msg import Image
from cv_bridge import CvBridge

bridge = CvBridge()
frame = bridge.imgmsg_to_cv2(msg, 'bgr8')      # 받을 때: ROS Image → numpy
ros_img = bridge.cv2_to_imgmsg(frame, 'bgr8')  # 보낼 때: numpy → ROS Image
self.pub = self.create_publisher(Image, '/camera/image_raw', 10)
```

# PointCloud2
점구름을 바이트 한 줄로 눌러 담고, **읽는 설명서**를 함께 넣는다.

| 필드 | 의미 |
|---|---|
| `height`, `width` | 점 격자 크기 (흩어진 점이면 height=1, width=점 개수) |
| `fields` | 각 점의 속성과 자료형 (예: x는 0번째 바이트부터 4바이트 float) |
| `point_step` | 점 하나의 바이트 수 |
| `row_step` | 한 줄의 바이트 수 |
| `data` | 실제 좌표 바이트 배열 |
| `is_dense` | NaN(빈 측정) 없이 꽉 찼는지 |

# 의존성
```xml
<depend>sensor_msgs</depend>
<depend>cv_bridge</depend>
```

# 관련
- [[std_msgs]] · [[geometry_msgs]]
