---
title: ros2 pkg create
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 패키지·빌드·인터페이스]
tags: [패키지·빌드·인터페이스, 패키지, 입문]
---
# ros2 pkg create

## 정의·핵심
- **정의**: 빈 패키지 뼈대(package.xml, setup.py 또는 CMakeLists.txt, 폴더 구조)를 찍어 내는 명령. **`~/ros2_ws/src` 안에서** 실행한다 (기초 5차시, 입문 1차시).
- **화면 출력 두 부분**: 먼저 무엇을 만들지 알리고(package name, build type, dependencies: [] …), 이어서 `creating …` 줄로 만든 것을 찍는다. 단 `--license`로 생기는 LICENSE는 목록에 안 찍힌다 — 화면이 만든 것의 전부가 아닐 수 있다.
- **옵션**

| 옵션 | 무엇을 정하나 |
|---|---|
| `--build-type ament_python` | 파이썬 패키지 뼈대 (C++·인터페이스는 `ament_cmake`) |
| `--license Apache-2.0` | 라이선스 — 빠뜨리면 `Unknown license 'TODO: License declaration'` 경고(빌드엔 지장 없음) |
| `--dependencies rclpy std_msgs` | package.xml에 `<depend>` 미리 적기 |
| `--node-name my_publisher` | 첫 노드 .py 뼈대 + entry_points 한 줄까지 |

- **같은 이름으로 다시 만들면** `Aborted! The directory already exists` — 덮어쓰지 않고 멈춘다(남의 작업을 날릴 걱정 없음). 폴더 검사가 라이선스 경고보다 먼저다.
- 이름은 snake_case — 하이픈·대문자·숫자 시작 금지.

## 원리·구조
| 증상 | 원인 → 해결 |
|---|---|
| `Aborted!` + `The directory already exists` | 같은 이름 존재 → 다른 이름 또는 기존 폴더 정리 |
| `unrecognized arguments: --build-type` | ROS 환경 source 안 함 |
| `Unknown license` 경고 | `--license` 누락 → 무시 가능, `--license Apache-2.0` 권장 |
| 패키지가 src 바깥에 생김 | src로 안 가고 실행 → src에서 다시 만들고 잘못 생긴 폴더 정리 |

## 코드 예시
```python
# pkg create가 만드는 파일 목록 흉내 (ament_python, --node-name 있을 때)
def pkg_create(name, node=None, license=None, existing=()):
    if name in existing:
        return [f"Aborted!", f"The directory already exists: ./{name}"]
    files = ["package.xml", f"{name}/__init__.py", "setup.py", "setup.cfg", f"resource/{name}",
             "test/test_copyright.py", "test/test_flake8.py", "test/test_pep257.py"]
    if license: files.append("LICENSE")
    if node: files.append(f"{name}/{node}.py")
    return files
print(pkg_create("my_py_pkg", node="my_publisher", license="Apache-2.0")[-2:])   # ['LICENSE', 'my_py_pkg/my_publisher.py']
print(pkg_create("my_first_package", existing={"my_first_package"}))
# ['Aborted!', 'The directory already exists: ./my_first_package']
```
```bash
cd ~/ros2_ws/src
ros2 pkg create --build-type ament_python --license Apache-2.0 \
  --dependencies rclpy std_msgs --node-name my_publisher my_py_pkg
ros2 pkg create --build-type ament_cmake --license Apache-2.0 my_interfaces
```

## 수업 메모

ROS2 입문
시나리오가 중요하다.!

패키지 구성요소 만지기!

### 페르소나

### 패키지
1. 폴더 만들기 
	 ws(work_space): 작업 공간 
		 src : 원소스 코드 , 원본 코드
2.  해당 폴더(ws/src)로 이동
3.  패키지 제작
	`ros2 pkg create --build-type ament_python --license Apache-2.0 my_first_package`
	`ros2 pkg create' 빌드 타입 ,라이센스, 이름

#### 특징 
타입마다 구조가 조금 씩 다를 수 있음

##### package.xml 의존성
받은 사람의 환경에는 필요한 도구가 없을 수 있다 그럼  package.xml 을 보고 의존성을 확인한다.

package.xml은 크게 머리 부분과 의존성 부분으로 볼 수있다. 
머리 부분은 이 파일이 지켜야 할 양식을 가리킨다 그러므로 건들일 이이 없다.
의존성 부분은 `<depend> <test_depend>` 부분을 봐야한다. 각각 빌드시 ,테스트시 필요하다.

### source

### 빌드

## 관련 개념
[[패키지]] · [[package.xml]] · [[setup.py]] · [[ament]] · [[ROS2 이름 규칙]] · [[ros2 pkg]]
