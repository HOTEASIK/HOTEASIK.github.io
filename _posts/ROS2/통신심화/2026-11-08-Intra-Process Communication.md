---
title: Intra-Process Communication
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 통신심화]
tags: [통신심화, 성능, 실습]
---
# Intra-Process Communication

## 정의·핵심
- **정의**: 보내는 노드와 받는 노드가 **같은 프로세스 안**에 있을 때, 포장(직렬화)했다 푸는 대신 **메모리 주소(포인터)만 넘기는** 통신. 흔히 zero-copy (실습 2·3차시).
- **세 낱말**: 직렬화 = 데이터 구조를 일렬 바이트로 포장 / 포인터 = 물건 대신 「몇 번 창고에 있어」 쪽지 / zero-copy = 복사를 아예 안 하고 쪽지만.
- **왜 빨라지나**: 프로세스 간 통신은 ① 직렬화 ② 경계 너머 복사 ③ 역직렬화를 치른다. 같은 프로세스면 셋 다 건너뛴다.
- **이득은 데이터 크기에 비례**: std_msgs 작은 문자열은 체감 차이 거의 없음. 카메라 영상·포인트클라우드·점유 격자 지도(수 MB, 초당 여러 번)에서 진가.
- **항상 모으면 되나? 아니다**: 프로세스를 나누는 까닭 — 안정성(한 노드가 죽어도 나머지 생존), 격리(권한·자원 제한), 분산(다른 컴퓨터). 「함께 빨라져야 하는 무거운 경로만 골라 모으기」.
- **켜는 자리**: [[Component]] 컨테이너에 올리고 `use_intra_process_comms=True` — **발행·구독 양쪽 다**. 한쪽만 켜면 경고 없이 평소 경로로 되돌아간다.
- **정직하게 — rclpy엔 켜는 네이티브 스위치가 없다**: rclcpp(C++)에만 구현. 인터넷의 「rclpy로 켰다」 예제를 외우지 않는다.
- **안전**: 발행 쪽이 더 건드리지 않겠다고 넘긴 메시지에 한해 주소만 넘기고, 손상은 프레임워크가 막는다.
- **켜졌는지 확인**: 평소 화면(INFO)·hz·CPU는 끈 판과 **똑같다** → 컨테이너를 `--log-level rcl:=debug`로 띄워 `Subscription taking message` / `take succeeded` 두 줄이 사라지는지 본다. `intra_process_demo two_node_pipeline`은 보낸 주소 = 받은 주소를 찍는다.

## 원리·구조
```
프로세스 간:   A ─직렬화→ bytes ─복사→ bytes ─역직렬화→ B
같은 프로세스: A ──────── 주소 0x5E7326C3DF50 ─────────→ B
Published message with value: 0, and address: 0x5E7326C3DF50
 Received message with value: 0, and address: 0x5E7326C3DF50   ← 같다
```

## 코드 예시
```python
# 복사 vs 참조: 큰 메시지일수록 복사 비용이 커진다
import pickle, time
frame = bytes(6 * 1024 * 1024)                 # 6 MB 영상 한 프레임
t = time.perf_counter()
for _ in range(30):                            # 30 fps, 1초 분량
    pickle.loads(pickle.dumps(frame))          # 직렬화 + 역직렬화(복사)
copy_ms = (time.perf_counter() - t) * 1000
t = time.perf_counter()
for _ in range(30):
    ref = frame                                # 주소만 넘김
ref_ms = (time.perf_counter() - t) * 1000
print(copy_ms > ref_ms * 100)                  # True  ← 복사가 훨씬 비싸다
print(ref is frame, id(ref) == id(frame))      # True True  ← 같은 자리
```

## 관련 개념
[[Component]] · [[Component launch]] · [[직렬화]] · [[프로세스와 스레드]] · [[영상 토픽]]
