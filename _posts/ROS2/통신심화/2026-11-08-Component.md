---
title: Component
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 통신심화]
tags: [통신심화, Component, 실습]
---
# Component

## 정의·핵심
- **정의**: 한 프로세스(컨테이너)에 실었다 내렸다 할 수 있는 노드(composable node). **빈 트럭(컨테이너) + 화물(노드)**, 짐칸 안에서 바로 주고받기는 [[Intra-Process Communication]], 여는 문은 `use_intra_process_comms` 스위치(기본 꺼짐) (실습 3차시).
- **배치는 운영하는 쪽이 정한다**: 노드 코드는 자기가 어느 컨테이너에 실릴지 모른다 — 개발 때는 따로 띄워 디버깅, 배포 때는 한 컨테이너로. 「무엇을 한 그릇에」는 명령이나 launch 대본에 적힌다.
- **세 역할**: 컨테이너(빈 프로세스) · 관리자 `/ComponentManager`(적재·해제 요청 접수창구) · 컴포넌트(실리는 노드 알맹이).
- **만드는 법**: C++로 main 없이 쓰고, 라이브러리로 빌드, 등록 매크로로 드러내면 컨테이너가 실행 중에 찾아 적재 — 이 과정은 데모(`composition::Talker`/`Listener`)로 본다.
- **묶기 ≠ 켜기**: 묶기만 해도 프로세스·메모리 절약과 「끄지 않고 갈아끼우기」, 복사 제거는 스위치를 **양쪽에** 켰을 때만. 「묶었으니 빨라졌겠지」는 착각.
- **운명을 같이한다**: 한 컴포넌트가 메모리 오류로 죽으면 그 컨테이너 프로세스가 죽고 안의 노드도 함께 사라진다. 불안정한 노드(예: 자주 죽는 위치 추정)는 별도 컨테이너로.
- **실행기 선택**: `component_container`(단일 스레드, 콜백 가벼울 때) / `component_container_mt`(다중 스레드) — 그 밖에 `_events_cbg`, `_isolated`.
- **id는 번호**: 적재 순서대로 매기고 한 번 쓴 번호는 다시 안 쓴다 — unload 전엔 반드시 list.
- **오류 단서(적재 단계: Load Library → Found class → Instantiate)**: `Could not find requested resource in ament index`(패키지 철자) · `Failed to find class with the requested plugin name.`(클래스 철자) · `Unable to find container node '/ComponentManager'`(컨테이너 없음) · `No node found with unique_id: 9`(없는 id). 바깥(컨테이너)부터 좁혀 들어간다.

## 원리·구조
```
# 터미널 A
ros2 run rclcpp_components component_container          ← 빈 트럭, /ComponentManager
# 터미널 B
ros2 component types | grep composition                  ← 실을 수 있는 부품
ros2 component load /ComponentManager composition composition::Talker
  Loaded component 1 into '/ComponentManager' container node as '/talker'
ros2 component list                                      ← /ComponentManager  1 /talker  2 /listener
ros2 component unload /ComponentManager 1                ← 번호로 내린다, PID 그대로
ros2 component load … composition::Talker -e use_intra_process_comms:=true
ps aux | grep component_container                        ← 프로세스는 하나
```

## 코드 예시
```python
# 컨테이너 흉내: id는 일련번호, unload해도 재사용 안 함
class Container:
    def __init__(self): self.next_id, self.loaded = 1, {}
    def load(self, cls):
        i = self.next_id; self.next_id += 1; self.loaded[i] = cls
        return f"Loaded component {i} as '/{cls.split('::')[1].lower()}'"
    def unload(self, i):
        if i not in self.loaded: return f"No node found with unique_id: {i}"
        del self.loaded[i]; return f"Unloaded component {i}"
c = Container()
print(c.load("composition::Talker"))     # Loaded component 1 as '/talker'
print(c.load("composition::Listener"))   # Loaded component 2 as '/listener'
print(c.unload(1))                       # Unloaded component 1
print(c.load("composition::Talker"))     # Loaded component 3 as '/talker'
print(c.unload(9))                       # No node found with unique_id: 9
print(sorted(c.loaded))                  # [2, 3]
```

## 관련 개념
[[Intra-Process Communication]] · [[Component launch]] · [[실행기]] · [[노드]] · [[프로세스와 스레드]]
