---
title: localhost
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 네트워크·소켓]
tags: [네트워크·소켓, 네트워크, 기초]
---
# localhost

## 정의·핵심
- **정의**: 내 컴퓨터 **자기 자신**을 가리키는 주소. 숫자로는 `127.0.0.1`(루프백) (기초 2차시).
- **특징**
  - 밖으로 나가지 않는다 — 내 컴퓨터 안에서 두 프로그램이 대화한다.
  - 인터넷·와이파이가 끊겨 있어도 된다 → 다른 컴퓨터 없이 노트북 한 대로 서버와 클라이언트를 띄울 수 있어 실습하기 딱 좋다.
- 소켓 코드의 `('localhost', 9090)` = "내 컴퓨터의 9090번 창구".
- **오해 바로잡기**: "localhost는 어떤 서버 주소" ✗ — 내 컴퓨터 자신이다.
- **ROS2에서**: 같은 PC 안의 노드끼리도 네트워크 스택(DDS)을 거쳐 통신한다. 다른 PC와 섞이지 않게 하려면 `ROS_DOMAIN_ID`를 나누거나 `ROS_AUTOMATIC_DISCOVERY_RANGE=LOCALHOST`(Jazzy)로 발견 범위를 내 PC로 좁힌다.

## 원리·구조
```
[server.py] ──bind('localhost',9090)── ┐
                                       │  루프백(127.0.0.1): 랜카드 밖으로 안 나감
[client.py] ──connect('localhost',9090)┘
```

## 코드 예시
```python
import socket
print(socket.gethostbyname("localhost"))        # 127.0.0.1
s = socket.socket(); s.bind(("localhost", 0))   # 0 = 빈 포트를 OS가 골라 줌
print(s.getsockname()[0])                       # 127.0.0.1
s.close()
```

## 관련 개념
[[IP 주소와 포트]] · [[소켓 프로그래밍 실습]] · [[ROS_DOMAIN_ID]]
