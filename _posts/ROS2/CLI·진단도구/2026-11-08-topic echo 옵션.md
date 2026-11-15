---
title: topic echo 옵션
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, CLI·진단도구]
tags: [CLI·진단도구, CLI, 실습]
---
# topic echo 옵션

## 정의·핵심
- **정의**: `ros2 topic echo`의 출력을 정리해서 보는 옵션들 — 시끄러운 토픽에서 필요한 것만 (실습 1차시).
- **`--field x`**: 메시지 전체가 아니라 한 필드만. `x·y·theta` 중 x의 변화만 추적. 중첩은 점으로 — `--field linear.x`, `--field header.stamp`.
- **`--no-arr`**: 긴 배열 칸을 「몇 개짜리 배열」 한 줄로 접는다 — 라이다 `ranges`에 가려 있던 헤더·각도 정보를 볼 때. (문자열은 `--no-str`)
- **`--once`**: 메시지 하나만 받고 끝 — 값 한 번 확인(`--field encoding --once`로 영상 인코딩 확인 등).
- **`--qos-reliability` / `--qos-durability` / `--qos-depth`**: 받는 쪽 QoS를 지정. **옵션 없는 echo는 발행자에 맞춰 붙는다** → QoS가 어긋나도 비지 않는다. 그래서 「echo엔 흐르는데 내 노드만 못 받는」 상황이 생긴다 — 그때는 내 노드 쪽 QoS를 의심.
- **`--flow-style`**, **`--csv`**: 한 줄로 / 쉼표로 — 로그로 남겨 엑셀·파이썬 분석.
- **`-n 5`**(`--times`)**: 다섯 개만 받고 끝.
- 메시지 사이 `---` 구분선이 찍힌다.

## 원리·구조
```
$ ros2 topic echo /scan --no-arr
header:
  stamp: {sec: 0, nanosec: 0}
  frame_id: ''
angle_min: 0.0
...
ranges: '<sequence type: float, length: 5>'
---
```

## 코드 예시
```python
# --field / --no-arr 를 흉내: 중첩 dict에서 점 경로 꺼내기, 긴 배열 접기
msg = {"header": {"stamp": {"sec": 12, "nanosec": 5}, "frame_id": "base_scan"},
       "angle_min": -3.14, "ranges": [1.0, 2.0, 3.0, 4.0, 5.0]}
def field(m, path):
    for k in path.split("."): m = m[k]
    return m
def no_arr(m):
    return {k: (no_arr(v) if isinstance(v, dict) else
                f"<sequence type: float, length: {len(v)}>" if isinstance(v, list) else v)
            for k, v in m.items()}
print(field(msg, "header.frame_id"))    # base_scan
print(no_arr(msg)["ranges"])            # <sequence type: float, length: 5>
print(",".join(str(field(msg, p)) for p in ("header.stamp.sec", "angle_min")))   # 12,-3.14  (--csv 꼴)
```
```bash
ros2 topic echo /turtle1/pose --field x
ros2 topic echo /scan --no-arr
ros2 topic echo /camera/image_raw --field encoding --once
ros2 topic echo /chatter --qos-reliability reliable
```

## 관련 개념
[[ros2 topic]] · [[QoS 불일치 진단]] · [[PointCloud2]] · [[진단 사다리]]
