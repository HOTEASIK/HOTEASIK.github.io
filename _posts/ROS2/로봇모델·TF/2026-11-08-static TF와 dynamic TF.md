---
title: static TF와 dynamic TF
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 로봇모델·TF]
tags: [로봇모델·TF, TF, 실습]
---
# static TF와 dynamic TF

## 정의·핵심
- **정의**: 변하지 않는 관계(static)와 계속 바뀌는 관계(dynamic)는 **발행하는 법이 다르다** (실습 4차시).
- **static**: 시간이 지나도 안 변함 — 몸통에 고정된 센서 장착 위치. `static_transform_publisher` / `StaticTransformBroadcaster` → **`/tf_static`**. **한 번만** 발행하면 계속 유효(TRANSIENT_LOCAL로 늦은 구독자도 받는다).
- **dynamic**: 계속 바뀜 — 굴러가는 바퀴, 꺾이는 관절. `TransformBroadcaster`로 바뀔 때마다(보통 일정 주기) → **`/tf`**.
- **robot_state_publisher도 둘을 나눠 낸다**: fixed 조인트는 /tf_static 한 번, 움직이는 조인트는 관절 상태를 받을 때마다 /tf — 그래서 슬라이더 전에는 arm_link 변환이 없었다.
- **At time 0.0**: tf2_echo로 static 변환을 조회하면 시각이 0 — TF2가 static을 「언제든 유효한 값」으로 보관하고 조회 결과에 0을 붙인다. dynamic은 실제 시각(`At time 1791083709.31…`).
- **발행자가 죽어도 옛 값을 쓴다(static)**: 떠 있던 tf_reader는 static_sensor_tf를 끈 뒤 12초 동안 경고 없이 (1.0, 0.0, 0.0) — 버퍼에 남는다. 새로 띄운 tf_reader만 `"base_link" … does not exist` 경고. static을 고쳐 다시 낼 때 이미 받은 노드가 새 값을 받는지 확인.
- **헷갈렸을 때 증상**
  - 안 변하는 관계를 dynamic으로: 동작은 하지만 부하, 발행이 한 번만 끊겨도 그 사이 조회 실패.
  - 변하는 관계를 static으로: 처음엔 맞다가 곧 어긋남 — RViz에서 부품이 멈춰 보이거나 손끝이 점점 빗나간다. 「처음엔 맞다가 시간이 지날수록 틀어진다」면 먼저 의심.

## 원리·구조
| 구분 | 예 | 발행 | 토픽 | tf2_echo 시각 |
|---|---|---|---|---|
| static | 센서 장착 | 한 번 | /tf_static | 0.0 |
| dynamic | 관절·바퀴·odom | 주기마다 | /tf | 실제 시각 |

## 코드 예시
```python
# 버퍼 흉내: static은 시간 무관, dynamic은 오래되면(1초) 조회 실패
class Buffer:
    def __init__(self): self.static, self.dyn = {}, {}
    def set(self, child, val, t=None):
        (self.static.__setitem__(child, val) if t is None else self.dyn.__setitem__(child, (val, t)))
    def lookup(self, child, now):
        if child in self.static: return ("At time 0.0", self.static[child])
        if child in self.dyn:
            val, t = self.dyn[child]
            return (f"At time {t}", val) if now - t <= 1.0 else "변환이 끊겼다(오래됨)"
        return "frame does not exist"
b = Buffer()
b.set("sensor", (1.0, 0, 0))              # static 한 번
b.set("arm_link", (0, 0, 0.3), t=10.0)    # dynamic
print(b.lookup("sensor", now=99.0))       # ('At time 0.0', (1.0, 0, 0))  ← 발행자가 죽어도 남는다
print(b.lookup("arm_link", now=10.5))     # ('At time 10.0', (0, 0, 0.3))
print(b.lookup("arm_link", now=12.0))     # 변환이 끊겼다(오래됨)
```

## 관련 개념
[[TF2]] · [[TF 브로드캐스터]] · [[TF 리스너]] · [[QoS Durability]] · [[robot_state_publisher]]
