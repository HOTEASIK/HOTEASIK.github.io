---
title: check_urdf
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, 로봇모델·TF]
tags: [로봇모델·TF, URDF, 실습]
---
# check_urdf

## 정의·핵심
- **정의**: URDF 파일의 **XML 문법과 링크 트리를 검사**하는 명령 — 실습 환경에 이미 있어 설치와 상관없이 돈다 (실습 4차시).
- **성공 화면**: `robot name is: simple_arm` / `---------- Successfully Parsed XML ---------------` / `root Link: base_link has 1 child(ren)` / `child(1):  arm_link` — 로봇 이름, 문법 통과, 링크 트리 요약.
- **이 트리가 곧 TF 트리의 골격**: 그리퍼를 더하면 `child(1): gripper_link`가 한 층 더 들여써져 세 층.
- **끊긴 링크**: 어느 조인트에도 걸리지 않은 `<link name="orphan_link"/>`를 더하면 `Error: Failed to find root link: Two root links found: [base_link] and [orphan_link]` → `ERROR: Model Parsing the xml failed`. 루트가 둘 = 트리가 둘로 쪼개졌다.
- **파싱 실패**: XML 문법·태그 닫힘 오류 — 에러가 가리키는 줄의 태그·따옴표 확인.
- **언제 치나**: URDF를 고칠 때마다 띄우기 전에 — 노드 쪽 오류와 섞이지 않게 모델 자체부터 확인.

## 원리·구조
```
$ cd ~/ros2_ws && check_urdf simple_arm.urdf
robot name is: simple_arm
---------- Successfully Parsed XML ---------------
root Link: base_link has 1 child(ren)
    child(1):  arm_link
        child(1):  gripper_link
```

## 코드 예시
```python
# check_urdf 흉내: 루트 찾기 + 트리 출력
import xml.etree.ElementTree as ET
def check(urdf):
    r = ET.fromstring(urdf)
    links = [l.get("name") for l in r.findall("link")]
    kids = {}
    for j in r.findall("joint"):
        kids.setdefault(j.find("parent").get("link"), []).append(j.find("child").get("link"))
    children = {c for cs in kids.values() for c in cs}
    roots = [l for l in links if l not in children]
    if len(roots) != 1:
        return f"Error: Failed to find root link: Two root links found: [{roots[0]}] and [{roots[1]}]"
    out = [f"robot name is: {r.get('name')}", f"root Link: {roots[0]} has {len(kids.get(roots[0], []))} child(ren)"]
    def walk(n, d):
        for i, c in enumerate(kids.get(n, []), 1):
            out.append("    " * d + f"child({i}):  {c}"); walk(c, d + 1)
    walk(roots[0], 1)
    return "\n".join(out)
J = '<joint name="{0}" type="revolute"><parent link="{1}"/><child link="{2}"/></joint>'
ok = f'<robot name="simple_arm"><link name="base_link"/><link name="arm_link"/><link name="gripper_link"/>{J.format("shoulder","base_link","arm_link")}{J.format("gripper_joint","arm_link","gripper_link")}</robot>'
print(check(ok))
# robot name is: simple_arm
# root Link: base_link has 1 child(ren)
#     child(1):  arm_link
#         child(1):  gripper_link
print(check(ok.replace("</robot>", '<link name="orphan_link"/></robot>')))
# Error: Failed to find root link: Two root links found: [base_link] and [orphan_link]
```

## 관련 개념
[[URDF]] · [[TF2]] · [[TF2 오류 해독]] · [[xacro]]
