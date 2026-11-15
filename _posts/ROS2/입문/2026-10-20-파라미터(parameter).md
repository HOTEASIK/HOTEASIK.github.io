---
title: "파라미터(parameter)"
date: 2026-10-20 12:00:00 +0900
categories: [ROS2, 입문]
tags: []
---
# 정의
노드의 설정 값(Configuration value)을 저장하고 관리하는 데이터.
코드에 박히는 대신 **노드 바깥에서 주어지고, 실행 중에도 조회·변경할 수 있는 이름 붙은 설정**이다. 라디오의 주파수 다이얼·음량 손잡이처럼, 켜 둔 채로 돌린다.

# 특징
- 토픽·서비스·액션 같은 **통신이 아니다** — 노드에 달린 설정 손잡이다 (내부적으로는 서비스/토픽 기반 구현)
- 자료형: 정수 · 실수 · 불리언 · 문자열 · 배열
- 한 번 선언된 파라미터의 **자료형은 바꿀 수 없다**

## 방향
노드로 (바깥 → 노드)

| 길 | 언제 정해지나 | 쓰는 법 |
|---|---|---|
| 명령줄 | 노드를 켤 때 한 개씩 | `--ros-args -p speed:=2.0` |
| 파일 | 노드를 켤 때 한꺼번에 | `--ros-args --params-file params.yaml` |
| 실행 중 변경 | 노드가 도는 동안 | `ros2 param set /param_demo speed 2.0` |

# 코드
```python
self.declare_parameter('speed', 1.0)          # ① 이름과 기본값을 선언 (자료형도 여기서 정해짐)
v = self.get_parameter('speed').value         # ② 지금 값을 읽는다 (.value 필수)
```

## 설정 콜백 — 바뀌는 순간 검증
```python
from rcl_interfaces.msg import SetParametersResult

self.add_on_set_parameters_callback(self.on_set)   # __init__ 에서 등록

def on_set(self, params):
    for p in params:
        if p.name == 'speed' and p.value < 0:
            return SetParametersResult(successful=False, reason='속도는 0 이상')
    return SetParametersResult(successful=True)
```
- `successful=False`면 변경이 거부되고 이전 값이 남는다
- 한 번 읽어 세팅해 둔 것(예: 타이머 주기)은 값이 바뀌어도 그대로 → 콜백에서 다시 세팅한다

# 명령어
```bash
ros2 param list                          # 파라미터 목록
ros2 param get /param_demo speed         # 지금 값
ros2 param set /param_demo speed 2.0     # 값 변경 (도는 노드에만 적용, 재시작하면 기본값)
ros2 param describe /param_demo speed    # 자료형과 제약
ros2 param dump /param_demo > params.yaml    # 현재 설정을 YAML로 저장
ros2 param load /param_demo params.yaml      # YAML에서 복원
```

# 흔한 오류
| 증상 | 원인 | 해결 |
|---|---|---|
| 선언 안 한 이름을 읽어 노드가 죽음 | `declare_parameter` 없이 읽음 | `__init__`에서 먼저 선언 |
| 숫자 대신 이상한 값이 찍힘 | `.value` 누락 | `get_parameter('이름').value` |
| `set`이 거부됨 | 자료형이 다름 (실수 자리에 정수) | `2.0`처럼 소수점 |
| 껐다 켜니 값이 되돌아감 | `set`은 도는 노드에만 적용 | 파일에 적고 `--params-file` |
