---
title: QoS History와 Depth
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 통신심화]
tags: [통신심화, QoS, 실습]
---
# QoS History와 Depth

## 정의·핵심
- **정의**: 이력(history)은 **보관 방식**, 깊이(depth)는 **보관 개수** — 둘은 한 쌍으로 움직이며 구독자가 미처 못 꺼내간 메시지를 몇 개까지 줄 세워 들고 기다릴지 정한다 (실습 2차시).
- **KEEP_LAST(N)**: 최근 N개만 보관 — depth가 그 N. 실무에서 가장 흔하다. `KEEP_LAST` + depth 10이면 최근 10개.
- **KEEP_ALL**: 가능한 한 전부 — 자원 한계가 있어 특수한 경우에만.
- **원리 — 버퍼(임시 보관함)의 크기**: 구독자가 잠시 바빠 못 꺼내가는 동안 발행자가 계속 보내면 쌓인다. depth가 작으면 오래된 것부터 버려진다.
- **연결을 막는 일은 드물다**: 대신 버스트(한꺼번에 몰림) 때 일부가 밀려 **누락**되는 꼴로 나타난다 — 경고도 없다.
- **「클수록 안전하다」는 오해**: 센서 depth를 크게 두면 구독자가 잠시 느려졌을 때 오래된 값까지 쌓였다가 한꺼번에 밀려들어 최신 값 처리가 늦어진다 → 센서는 작게(5~10), 명령은 약간 넉넉히.
- **verbose로는 안 보인다**: `topic info --verbose`의 `History (Depth): UNKNOWN` — 깊이는 코드에서 확인한다.
- **흔한 실수**: `KEEP_LAST`로 두면서 depth를 안 적으면 의도와 다른 깊이로 동작할 수 있다 — 늘 짝지어 적는다.

## 원리·구조
```
발행: 1 2 3 4 5 6 7 8   (구독자가 잠시 멈춤)
KEEP_LAST(3) 버퍼: [6 7 8]   ← 1~5는 밀려 버려짐
구독자 재개 → 6, 7, 8 처리 (최신 값으로 빨리 따라잡음)
KEEP_LAST(100) 버퍼: [1 … 8]  ← 오래된 값부터 처리, 최신 값 지연
```

## 코드 예시
```python
# depth 버퍼 흉내: collections.deque(maxlen=depth)
from collections import deque
for depth in (3, 10):
    buf = deque(maxlen=depth)
    for i in range(1, 9):        # 구독자가 멈춘 동안 8개 도착
        buf.append(i)
    print(f"depth={depth}: 남은 {list(buf)}, 누락 {8 - len(buf)}개")
# depth=3: 남은 [6, 7, 8], 누락 5개
# depth=10: 남은 [1, 2, 3, 4, 5, 6, 7, 8], 누락 0개
```

## 관련 개념
[[QoS]] · [[QoSProfile]] · [[QoS 불일치 진단]] · [[토픽]]
