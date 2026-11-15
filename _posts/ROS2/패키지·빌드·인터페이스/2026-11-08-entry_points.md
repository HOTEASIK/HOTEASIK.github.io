---
title: entry_points
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 패키지·빌드·인터페이스]
tags: [패키지·빌드·인터페이스, 패키지, 입문]
---
# entry_points

## 정의·핵심
- **정의**: setup.py 안에서 `.py` 파일의 함수를 **`ros2 run` 실행 이름으로 등록하는 칸** — 노드의 전화번호부 (입문 1·3차시).
- **형식**: `'실행이름 = 패키지.파일:함수'`
  - `=` 왼쪽: `ros2 run`에서 칠 이름.
  - **점(.)** 은 폴더 안으로 — `my_py_pkg.my_publisher` = 패키지 안의 `my_publisher.py`.
  - **콜론(:)** 뒤는 그 파일에서 부를 함수 — 보통 `main`.
- **흐름**: 노드 코드를 짠다 → entry_points에 올린다 → **다시 빌드** → source → `ros2 run`이 찾는다. 빌드 때 colcon이 이 줄을 실제 실행 파일로 만든다.
- **「노드는 짰는데 ros2 run이 안 된다」의 단골 원인**: 등록 누락 또는 등록 뒤 재빌드 안 함 → `No executable found`. `--symlink-install`이어도 entry_points를 바꾸면 재빌드.
- **오타 TOP**: 콜론·점을 바꿔 쓰기, 항목 사이 콤마 누락. 실행 이름과 파일 이름은 달라도 된다.

## 원리·구조
```python
entry_points={
    'console_scripts': [
        'my_publisher = my_py_pkg.my_publisher:main',     # ← 콤마
        'my_subscriber = my_py_pkg.my_subscriber:main',
    ],
},
```
```
ros2 run my_py_pkg my_publisher
   → install/my_py_pkg/lib/my_py_pkg/my_publisher (colcon이 만든 스크립트)
   → from my_py_pkg.my_publisher import main; main()
```

## 코드 예시
```python
# 등록 줄 해석 + 흔한 실수 검출
import re
PAT = re.compile(r"^\s*([a-z][a-z0-9_]*)\s*=\s*([a-z][\w]*(?:\.[a-z][\w]*)+):([a-z_]\w*)\s*$")
def parse(line):
    m = PAT.match(line)
    if not m:
        if line.count(":") == 0: return "✗ 콜론(:함수) 없음"
        return "✗ 형식 오류 — '실행이름 = 패키지.파일:함수'"
    exe, mod, fn = m.groups()
    return f"ros2 run → {mod.replace('.', '/')}.py 의 {fn}()  (실행이름 {exe})"
print(parse("my_publisher = my_py_pkg.my_publisher:main"))
# ros2 run → my_py_pkg/my_publisher.py 의 main()  (실행이름 my_publisher)
print(parse("my_publisher = my_py_pkg:my_publisher.main"))   # ✗ 형식 오류 — '실행이름 = 패키지.파일:함수'
print(parse("my_publisher = my_py_pkg.my_publisher"))        # ✗ 콜론(:함수) 없음
```

## 관련 개념
[[setup.py]] · [[setup.cfg]] · [[ros2 run]] · [[colcon 오류 해독]] · [[퍼블리셔]]
