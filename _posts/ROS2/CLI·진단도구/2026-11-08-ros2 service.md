---
title: ros2 service
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, CLI·진단도구]
tags: [CLI·진단도구, CLI, 실습]
---
# ros2 service

## 정의·핵심
- **정의**: 서비스를 보고 직접 부르는 명령 — `list`, `type`, `call`, `find` (기초 4차시, 입문 3차시, 실습 1차시).
- **부르기 전에 `-t`로 타입부터**: `ros2 service list -t` → 이름과 타입이 함께. 칸 이름을 모르면 `ros2 interface show 타입`.
- **`call` 화면 세 줄**: `waiting for service to become available...`(서버가 이미 떠 있어도 한 번 찍힌다) → `requester: making request: ...Request(a=3, b=4)`(보낸 값이 되비침) → `response: ...Response(sum=7)`. 보낸 것과 받은 것이 한 화면에 — echo와 다른 점.
- **요청 칸이 빈 서비스**는 `"{}"` — `ros2 service call /clear std_srvs/srv/Empty "{}"`.
- **서버를 먼저 CLI로 검증**: 클라이언트를 짜기 전에 call로 서버만 시험 — 「CLI로는 되는데 내 클라이언트로는 안 된다」면 문제는 거의 확실히 클라이언트. 문제를 반으로 가르기.
- **목록에 줄이 여덟쯤**: `/add_server/get_parameters` 같은 노드 이름으로 시작하는 것은 ROS가 모든 노드에 달아 주는 파라미터 서비스 — 내가 만든 이름 하나만 찾는다(`| grep add`).
- **토픽은 방송, 서비스는 통화**: 서비스는 「내 요청의 그 답」 한 쌍.
- **흔한 오류**: 「waiting...」만 계속(서버 미실행·이름 오타·source) / YAML 파싱 오류(콜론 뒤 공백, 따옴표).

## 원리·구조
```
$ ros2 service call /add_two_ints example_interfaces/srv/AddTwoInts "{a: 3, b: 4}"
waiting for service to become available...
requester: making request: example_interfaces.srv.AddTwoInts_Request(a=3, b=4)
response:
example_interfaces.srv.AddTwoInts_Response(sum=7)
```

## 코드 예시
```python
# YAML 꼴 요청 문자열의 흔한 실수 점검 (콜론 뒤 공백, 중괄호)
import re
def check_yaml_req(s):
    s = s.strip()
    if not (s.startswith("{") and s.endswith("}")): return "✗ 중괄호로 감싼다"
    bad = re.findall(r"\w+:(?=\S)", s)
    if bad: return f"✗ 콜론 뒤 공백 필요: {bad}"
    return "✓"
print(check_yaml_req("{a: 3, b: 4}"))     # ✓
print(check_yaml_req("{a:3, b: 4}"))      # ✗ 콜론 뒤 공백 필요: ['a:']
print(check_yaml_req("a: 3"))             # ✗ 중괄호로 감싼다
```
```bash
ros2 service list -t
ros2 service type /spawn
ros2 service call /spawn turtlesim/srv/Spawn "{x: 2.0, y: 2.0, name: 'leo'}"
ros2 service call /clear std_srvs/srv/Empty "{}"
ros2 service find std_srvs/srv/Empty
```

## 관련 개념
[[서비스]] · [[서비스 서버]] · [[ros2 interface]] · [[진단 사다리]] · [[ros2 CLI 구조]]
