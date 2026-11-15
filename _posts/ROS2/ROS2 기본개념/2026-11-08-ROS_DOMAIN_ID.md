---
title: ROS_DOMAIN_ID
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, ROS2 기본개념]
tags: [ROS2기본개념, 네트워크, 기초]
---
# ROS_DOMAIN_ID

## 정의·핵심
- **정의**: 같은 네트워크 안의 ROS2 노드들을 **번호로 나눈 방(논리 네트워크)**. 같은 번호끼리만 서로를 발견하고 통신한다. DDS 도메인 번호를 환경변수로 지정한 것 (기초 4차시).
- **비유**: 방 번호. 7번 방 사람끼리만 말이 통하고 42번 방은 소리조차 안 들린다.
- **기본값 0**: 아무것도 안 정하면 모두 0번 → 강의실 같은 와이파이에서 옆 사람의 talker가 내 listener에 섞여 들어온다.
- **권장 범위 0~101**: 번호가 DDS 포트 계산에 쓰이므로 너무 크면 포트 범위를 벗어난다. 0~101이 OS와 상관없이 안전.
- **순서가 중요**: `export ROS_DOMAIN_ID=7`을 **노드를 띄우기 전에, 그 터미널에서** 해야 한다. 이미 떠 있는 노드에는 반영되지 않고, 다른 터미널에는 적용되지 않는다 → 고정하려면 `.bashrc`.
- **실무 예**: AMR 5대를 각자 도메인 11, 12, 13…으로 나눠 서로 간섭을 막는다. 관제가 다 봐야 하면 같은 도메인 + namespace.
- **namespace와 차이**: namespace는 같은 세계 안 폴더, DOMAIN_ID는 세계 자체가 다르다.

## 원리·구조
$$\text{port}_{\text{multicast}} = 7400 + 250 \times \text{domain\_id} + 0$$
```
도메인 7:  [talker] ←→ [listener]       서로 보임
도메인 42: [listener]                     아무것도 안 들림
```

## 코드 예시
```python
# 도메인별 발견 + DDS 기본 포트 공식(PB=7400, DG=250)
nodes = [("talker", 7), ("listener_a", 7), ("listener_b", 42)]
def peers(me):
    d = dict(nodes)[me]
    return [n for n, dom in nodes if dom == d and n != me]
print(peers("listener_a"))   # ['talker']
print(peers("listener_b"))   # []
for d in (0, 7, 101, 232):
    print(d, 7400 + 250 * d)  # 0 7400 / 7 9150 / 101 32650 / 232 65400
```
```bash
export ROS_DOMAIN_ID=7
ros2 run demo_nodes_cpp talker          # 같은 터미널, export 뒤에
printenv ROS_DOMAIN_ID
echo "export ROS_DOMAIN_ID=7" >> ~/.bashrc
```

## 관련 개념
[[DDS]] · [[namespace]] · [[환경변수와 PATH]] · [[source와 .bashrc]] · [[포트 번호]]
