---
title: Jupyter에서 ROS2
date: 2026-11-08 12:00:00 +0900
categories: [ROS2, CLI·진단도구]
tags: [CLI·진단도구, Jupyter, 입문]
---
# Jupyter에서 ROS2

## 정의·핵심
- **정의**: 노트북 셀에서 rclpy 노드를 만들어 토픽을 받아 보고 바로 그래프로 그리는 방법 — 파일·빌드 없이 실험·분석 (입문 8차시).
- **설치**: Ubuntu 24.04의 시스템 python3에는 pip로 못 깐다(externally-managed) → `sudo apt install python3-notebook`(또는 jupyter 관련 apt 패키지). ROS가 깔린 그 python3여야 `import rclpy`가 된다.
- **source는 띄우기 전에**: 터미널에서 `source /opt/ros/jazzy/setup.bash`(+ 워크스페이스) 후 `jupyter notebook`. 셀에서 `!source …`는 `sh: source: not found` — 셀의 `!`는 매번 새 sh라 효과도 남지 않는다.
- **spin이 아니라 spin_once**: `rclpy.spin(node)`은 셀을 영원히 붙잡는다(커널 중단 필요). `rclpy.spin_once(node, timeout_sec=0.1)`를 원하는 만큼 반복.
- **셀 셋으로 나눈다**: ① 초기화(init·노드·구독 — 한 번만) ② 작업(spin_once 반복·그리기 — 여러 번) ③ 정리(destroy_node·shutdown).
  - ①을 두 번 돌리면 `Context.init() must only be called once`.
  - ③을 두 번 돌리면 `Context must be initialized before it can be shutdown` — `try_shutdown()`이 안전.
- **예**: /chatter를 받아 리스트에 쌓고 matplotlib로 그린다.

## 원리·구조
| 셀 | 내용 | 몇 번 |
|---|---|---|
| ① 초기화 | `rclpy.init()`, 노드, `create_subscription` | 한 번 |
| ② 작업 | `for _ in range(50): spin_once(timeout_sec=0.1)` → 그리기 | 원하는 만큼 |
| ③ 정리 | `node.destroy_node()`, `rclpy.try_shutdown()` | 한 번 |

## 코드 예시
```python
# ① 초기화 셀
import rclpy
from std_msgs.msg import String
rclpy.init()
node = rclpy.create_node("jupyter_listener")
got = []
node.create_subscription(String, "/chatter", lambda m: got.append(m.data), 10)

# ② 작업 셀 — 5초 동안 받기 (spin 금지)
for _ in range(50):
    rclpy.spin_once(node, timeout_sec=0.1)
print(len(got), got[-3:])

import matplotlib.pyplot as plt
plt.plot([int(s.split()[-1]) for s in got]); plt.title("/chatter count"); plt.show()

# ③ 정리 셀
node.destroy_node()
rclpy.try_shutdown()
```
```bash
sudo apt install python3-notebook
source /opt/ros/jazzy/setup.bash
jupyter notebook
ros2 run demo_nodes_cpp talker      # 다른 터미널에서 /chatter 발행
```

## 수업 메모

### 정의
코드를 셀이라는 작은 묶음으로 나눠 실행하고, 결과를 코드 바로 아래에서 즉시 확인하는 대화형 도구

커널: 노트북 뒤에서 코드를 실제로 실행하는 파이썬 프로세스. 셀보다 오래 산다
- 커널: 셀을 여러 번 돌려도 그대로 살아 있음, 재시작하면 새로 뜸
- 셀: 누를 때마다 커널 위에서 한 번 돌고 끝남

본 프로그램(로봇 제어)은 일반 노드로, 탐색과 분석은 노트북으로

### 설치

```bash
sudo apt update
sudo apt install -y jupyter
```

- apt 로 깐 노트북은 ROS 와 같은 시스템 파이썬(`/usr/bin/python3`)으로 돈다 → [[rclpy]] 를 그대로 import 가능
- `pip install jupyter` → `pip: command not found` (이 과정 PC 에는 pip 없음)
- `jupyter lab` → `jupyter-lab not found` → `jupyter notebook` 으로

#### 오버레이 언더레이
노트북은 띄운 터미널의 환경을 그대로 물려받는다

- underlay(ROS 본체): `.bashrc` 가 켜 둠 → rclpy 는 따로 안 챙겨도 잡힘
- overlay(내 작업공간): `my_interfaces` 같은 내 양식을 쓰려면 켜고 띄운다

```bash
cd ~
source ~/ros2_ws/install/setup.bash    # overlay
jupyter notebook
```

- 홈 폴더에서 띄워야 노트북 파일과 bag 이 한곳에 모인다
- 브라우저가 안 열리면 찍힌 `http://localhost:8888/?token=…` 주소를 통째로 복사
- 끌 때 터미널에서 `Ctrl+C` 두 번

overlay 없이 띄우면 → `ModuleNotFoundError: No module named 'my_interfaces'` (`import rclpy` 는 됨)

셀에서 `!source …` 는 소용없다
- `!` 는 sh 로 도는데 sh 에는 `source` 가 없음
- 돌더라도 그 명령 하나 위한 셸이 켜졌다 꺼질 뿐
- 환경은 주피터를 띄우는 순간 정해진다 → 끄고 overlay 켠 터미널에서 다시 띄운다

### 실습

#### 노트북에서 rclpy

셀에서는 `spin` 대신 `spin_once` → 셀을 셋으로 나눈다 (켜고, 발행하고, 끈다)

```python
# 셀 1: 초기화 (켤 때 한 번만)
import rclpy
from std_msgs.msg import String
rclpy.init()                                  # 켜진 채로 두 번 부르면 오류
node = rclpy.create_node('nb_node')
pub = node.create_publisher(String, 'nb', 10)
```

```python
# 셀 2: 발행하고 잠깐만 처리 (여러 번 실행 가능)
msg = String()
msg.data = 'hello from notebook'
pub.publish(msg)
rclpy.spin_once(node, timeout_sec=0.1)        # 일감 있으면 하나 처리, 없으면 0.1초 뒤 셀 반환
```

```python
# 셀 3: 정리 (마칠 때 한 번)
node.destroy_node()
rclpy.shutdown()                              # 꺼진 채로 두 번 부르면 오류
```

- 셀에서 `rclpy.spin(node)` → 셀이 안 끝남. 정지 버튼으로도 안 풀리면 커널 재시작 → 셀 1 부터
- 노트북의 구독: `spin_once` 를 부를 때만 콜백이 불림 → 값을 모으려면 짧은 간격으로 반복 호출
- 노드 셀을 또 돌리면 오류 없이 같은 이름 노드가 겹친다 (`Publisher already registered` 경고만) → 노드는 한 번만 만든다

#### bag 사용 

[[ROS bag]] 을 읽어 숫자로 재고 그림 한 장으로 그린다 (pandas 없음 → 리스트 + matplotlib)

```python
# 셀 A: bag 을 읽어 리스트에 담는다
import rosbag2_py
from rclpy.serialization import deserialize_message
from std_msgs.msg import String

reader = rosbag2_py.SequentialReader()
reader.open(rosbag2_py.StorageOptions(uri='hangman_bag', storage_id='mcap'),
            rosbag2_py.ConverterOptions(input_serialization_format='cdr',
                                        output_serialization_format='cdr'))
rows = []                                     # (초, 토픽, 글자)
while reader.has_next():
    topic, data, t = reader.read_next()
    rows.append((t, topic, deserialize_message(data, String).data))
t0 = rows[0][0]
rows = [((t - t0) / 1e9, topic, text) for t, topic, text in rows]
```

```python
# 셀 B: 센다
guesses = [r for r in rows if r[1] == '/guess']
boards = [r for r in rows if r[1] == '/board']
print('추측', len(guesses), '· 보드', len(boards))
print('걸린 시간(초):', round(rows[-1][0], 2))
gaps = [round(b[0] - a[0], 2) for a, b in zip(boards, boards[1:])]
print('보드 사이 간격(초):', gaps)
```

- 보드가 추측보다 많음 → 녹화기가 놓친 추측이 있음
- 간격이 다른 것의 두 배쯤 → 그 사이 추측이 게임 노드에도 닿지 못했을 수 있음
- 걸린 시간 ↔ `info` 의 `Duration` 이 맞으면 읽기 정상

```python
# 셀 C: 남은 빈칸 수를 계단으로
import matplotlib.pyplot as plt
xs = [t for t, topic, text in boards]
ys = [text.count('_') for t, topic, text in boards]
plt.step(xs, ys, where='post', marker='o')    # 다음 보드가 올 때까지 그대로
plt.xlabel('time (s)')
plt.ylabel('blanks left')
plt.title('hangman: one round')
plt.savefig('hangman_round.png')
plt.show()
```

그림 안 글자는 영어로 → 한글은 네모로 깨지고 `UserWarning: Glyph … missing` 경고만 뜸

### 오류

| 증상 | 원인 | 해결 |
|---|---|---|
| `No module named 'my_interfaces'` | overlay 없이 띄움 | 끄고 overlay 켠 터미널에서 다시 |
| `/usr/bin/sh: 1: source: not found` | 셀에서 `!source` | 위와 같음 |
| 셀이 안 돌아옴 | 셀에서 `spin` | 커널 재시작 → 셀 1 부터, `spin_once` |
| `Context.init() must only be called once` | init 두 번 | init 셀은 한 번 |
| `Context must be initialized before it can be shutdown` | shutdown 두 번 | shutdown 셀은 한 번 |
| `No module named 'pandas'` | pandas 없음 | 리스트로 센다 |

## 관련 개념
[[spin]] · [[rclpy 종료 처리]] · [[rosbag2_py]] · [[ROS2와 venv]] · [[토픽]]
