---
title: Lifecycle 관리
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 통신심화]
tags: [통신심화, Lifecycle, 실습]
---
# Lifecycle 관리

## 정의·핵심
- **정의**: 관리되는 노드의 상태를 **밖에서 묻고 옮기는** 일 — 손으로는 `ros2 lifecycle`, 실제 배포에서는 관리자 노드나 launch가 자동으로 (실습 4차시).
- **명령 넷**: `nodes`(관리되는 노드 목록) · `get /노드`(지금 상태, 예 `unconfigured [1]`) · `list /노드`(지금 갈 수 있는 전이와 번호, `Start`·`Goal`) · `set /노드 전이`(성공하면 `Transitioning successful`).
- **습관 — get → list → set**: 기어를 바꾸기 전에 지금 몇 단인지 본다. 「activate가 안 먹힌다」의 대부분은 아직 Unconfigured.
- **막혀 보기**: Unconfigured에서 곧장 `set activate` → `Unknown transition requested, available ones are: - configure [1] - shutdown [5]`(종료 코드 1) — 갈 수 있는 길을 함께 알려 준다.
- **list 화면**: Unconfigured에선 `configure [1]`·`shutdown [5]`, Active에선 `deactivate [4]`·`shutdown [7]` — 상태마다 길이 다르다.
- **데모**: `ros2 run lifecycle lifecycle_talker`(C++, 노드 `/lc_talker`, 토픽 `/lifecycle_chatter`) — 띄운 직후 아무것도 안 찍혀도 고장이 아니다. 다른 자료의 `lifecycle_py`는 실습 환경에 없다(`Package 'lifecycle_py' not found`).
- **아무도 전이를 내리지 않으면 Unconfigured에 머문다 — 에러도 없다**: 「토픽이 안 나온다」의 상당수.
- **일반 노드에 set** → `Node not found`(LifecycleNode가 아니다).
- **순차 기동**: 모두 configure까지 올린 뒤 센서부터 activate → 라이다 → 오도메트리 → SLAM. 부팅과 동시에 전부 active면 라이다가 회전을 안정화하기 전 SLAM이 쓰레기 스캔을 받아 지도 초반부가 뒤틀린다. 다음 차시 Nav2가 lifecycle manager로 여러 노드를 차례로 켠다.

## 원리·구조
```
$ ros2 lifecycle get /lc_talker            unconfigured [1]
$ ros2 lifecycle set /lc_talker configure  Transitioning successful
$ ros2 lifecycle get /lc_talker            inactive [2]
$ ros2 lifecycle set /lc_talker activate   Transitioning successful
$ ros2 lifecycle get /lc_talker            active [3]
$ ros2 topic echo /lifecycle_chatter       data: 'Lifecycle HelloWorld #6'
```

## 코드 예시
```python
# 순차 기동 스크립트 흉내: 모두 configure → 센서부터 activate, 실패하면 멈춘다
order = ["/lidar", "/odom", "/slam"]
state = {n: "unconfigured" for n in order}
log = []
for n in order:
    state[n] = "inactive"; log.append(f"configure {n}")
for n in order:
    if n == "/slam" and state["/lidar"] != "active":
        log.append("lidar not ready → stop"); break
    state[n] = "active"; log.append(f"activate {n}")
print(log)
# ['configure /lidar', 'configure /odom', 'configure /slam', 'activate /lidar', 'activate /odom', 'activate /slam']
print(all(s == "active" for s in state.values()))   # True
```
```bash
ros2 lifecycle nodes
ros2 lifecycle list /lc_talker
ros2 lifecycle set /lidar configure && ros2 lifecycle set /lidar activate
```

## 관련 개념
[[Lifecycle 노드]] · [[Lifecycle 노드 프로그래밍]] · [[Nav2]] · [[SLAM]] · [[launch 파일]]
