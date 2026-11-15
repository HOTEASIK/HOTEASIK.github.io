---
title: ros2 interface
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, CLI·진단도구]
tags: [CLI·진단도구, CLI, 입문]
render_with_liquid: false
---
# ros2 interface

## 정의·핵심
- **정의**: 메시지·서비스·액션 양식(인터페이스)을 찾고 펼쳐 보는 명령 — 「어떤 칸을 어떤 형식으로 채울지」 모를 때 (기초 4차시, 입문 2·3차시, 실습 1차시).
- **`show 타입`**: 양식을 펼친다. 주석·정렬까지 적은 그대로, 품고 있는 타입(중첩)은 들여쓰기로 펼쳐 보인다 — `Twist`는 linear·angular 아래 x·y·z. 구분선 `---` 개수로 msg(0)·srv(1)·action(2)을 바로 안다.
- **`list`**: 등록된 모든 양식 — `Messages:` `Services:` `Actions:` 머리글 아래 네 칸 들여 찍힌다. `| grep my_interfaces`로 내 양식이 다 올라왔는지.
- **`package 패키지`**: 그 패키지의 양식만.
- **`proto 타입`**: 채워 넣을 YAML 뼈대를 출력 — `topic pub`·`service call`에 붙여 넣을 꼴.
- **source 누락**: 새 터미널에서 내 양식을 show하면 `Unknown package 'my_interfaces'`(종료 코드 1) — 워크스페이스 source.
- **양식을 잊었을 때 첫 명령**: 코드를 짜다 칸 이름이 헷갈리면 파일을 찾기 전에 show.

## 원리·구조
```
$ ros2 interface show geometry_msgs/msg/Twist
# This expresses velocity in free space broken into its linear and angular parts.
Vector3  linear
        float64 x
        float64 y
        float64 z
Vector3  angular
        float64 x
        float64 y
        float64 z
$ ros2 interface proto geometry_msgs/msg/Twist
"linear:
  x: 0.0
  ...
```

## 코드 예시
```python
# interface show 출력에서 최상위 칸과 펼쳐진 하위 칸 가르기
show = """Vector3  linear
\tfloat64 x
\tfloat64 y
\tfloat64 z
Vector3  angular
\tfloat64 x
\tfloat64 y
\tfloat64 z"""
tree, cur = {}, None
for line in show.splitlines():
    t, name = line.split()
    if not line.startswith("\t"):
        cur = name; tree[cur] = []
    else:
        tree[cur].append(name)
print(tree)   # {'linear': ['x', 'y', 'z'], 'angular': ['x', 'y', 'z']}
print("{" + ", ".join(f"{k}: {{{', '.join(f'{c}: 0.0' for c in v)}}}" for k, v in tree.items()) + "}")
# {linear: {x: 0.0, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 0.0}}
```
```bash
ros2 interface show turtlesim/srv/Spawn
ros2 interface list | grep my_interfaces
ros2 interface package sensor_msgs
ros2 interface proto geometry_msgs/msg/Twist
```

## 관련 개념
[[인터페이스]] · [[메시지 타입]] · [[표준 메시지 패키지]] · [[ros2 topic]] · [[ros2 service]]
