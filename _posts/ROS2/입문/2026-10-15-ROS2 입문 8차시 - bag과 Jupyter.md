---
title: "ROS2 입문 8차시 - bag과 Jupyter"
date: 2026-10-15 12:00:00 +0900
categories: [ROS2, 입문]
tags: []
---
# ROS2 입문 8차시 — bag과 Jupyter

> 출처: 강의_10기_ROS2_입문_8차시.pdf (139쪽)

**흐름:** 행맨 한 판 녹화 → 남길 것 고르기 → 파이썬 코드로 쓰고 읽기 → Jupyter에서 숫자와 그림으로 분석

관련 노트: [[ROS bag]] · [[Jupyter]] · [[MCAP]] · [[rclpy]]

---

## 8.1 bag

### 개념
- **bag**: 토픽 메시지를 타임스탬프와 함께 파일로 저장해 두는 것. 재생하면 저장된 순서와 간격 그대로 다시 발행
- **쓰는 이유**: 로봇이 없어도 그때의 통신을 재현할 수 있어 디버깅 증거로 쓴다 ("그때 bag 떴어요?")
- **mcap**: Jazzy 기본 저장 형식. 예전 기본값은 sqlite3(`.db3`)
- **직렬화(cdr)**: 메시지 객체 → 바이트. 명령어에서는 안 보이지만 코드에서는 직접 불러서 "녹화하면서 가공"이 가능
- **명령어 vs 코드**: 명령어는 빠른 한 번, 코드는 조건부 녹화·가공·자동화 파이프라인

### 실습 ① 행맨 녹화·재생
```bash
ros2 bag record -o hangman_bag --topics /guess /board
ros2 bag info hangman_bag
ros2 topic echo /board std_msgs/msg/String   # 타입을 적어서 먼저 켜 둔다
ros2 bag play hangman_bag -d 1
```
- `--topics` 없이 나열하면 deprecated 경고
- **녹화기도 받는 쪽 노드** → 한 번 쏘고 끝나는 발행자의 메시지를 놓칠 수 있음. 추측 6개를 보냈는데 Count 4~5, bag 에 원인 없이 결과만 남기도 함
- **재생 때도 첫 메시지를 놓침** → echo 가 재생기에 붙기 전에 지나감. `-d 1` 로 1초 쉬고 시작
- 막히는 경우
  - 같은 이름으로 다시 녹화 → `Output folder already exists`
  - 게임 노드를 켠 채 재생 → 재생된 보드와 게임 노드가 새로 낸 보드가 섞임. 재생은 발행 노드를 모두 끄고

### 실습 ② 녹화·재생 옵션 고르기
| 녹화할 때 `record` | 다시 틀 때 `play` |
|---|---|
| `--topics`, `-a`, `-e`(정규식), `--exclude-regex` | `--topics`, `-e`, `-x` |
| `-s`(형식), `--compression-mode file/message`, `-d`(N초마다 파일 쪼개기) | `--rate`(배속), `-l`(반복), `-d`(시작 전 대기) |

- 두 명령의 옵션은 넘나들지 않음. `-d` 는 뜻이 다르고, 짧은 `-x` 는 재생에만 있음. 녹화에 `-l` → `unrecognized arguments`
- `-a` 로 녹화하면 `/rosout`, `/parameter_events`, `/events/write_split` 도 담김 → `--exclude-regex` 로 뺌
- **빈 bag 의 두 모양**: 발행자가 있었던 토픽은 `Count: 0`, 없었던 토픽은 목록에서 빠짐. Start 는 2262년
- **압축이 항상 작아지지는 않음**

  | bag | 크기 |
  |---|---|
  | 압축 없음 | 12.7 KiB |
  | `file` 압축 | 4.6 KiB |
  | `message` 압축 | 13.5 KiB (압축 없음보다 큼) |

  → 재 보고 고른다

### 실습 ③ rosbag2_py 로 쓰고 읽기
- **SequentialWriter(녹화)**: 만든다 → `open`(StorageOptions, ConverterOptions) → `create_topic`(TopicMetadata) → `write`(토픽, `serialize_message(msg)`, 나노초 시각)
- **SequentialReader(읽기)**: `has_next` / `read_next` → `deserialize_message(data, 타입)`. 쓴 차례가 아니라 **타임스탬프 차례**
- 자주 막히는 곳
  - `TopicMetadata` 에 `id` 없음 → TypeError (Jazzy 필수)
  - `write` 에 메시지 객체 그대로 → TypeError (바이트로 바꿔 넣기)
  - `create_topic` 없이 `write` → RuntimeError
  - 같은 `uri` 로 재실행 → `already exists`
  - `storage_id` 불일치 → `No storage could be initialized` (읽을 때 `''` 면 자동)
- **시각은 넣는 쪽이 정함** → 0 부터 넣으면 info 에 1970년
- **틀린 타입으로 풀면 위험**: String 을 Int32 로 풀면 오류 없이 15 → `get_all_topics_and_types()` + `get_message()` 로 타입을 bag 에게 묻는다
- 심화: 사건 기반 녹화(순환 버퍼 → 사건 감지 → 앞뒤 구간 저장). `--snapshot-mode` 는 버퍼를 쏟는 데까지, 언제 쏟을지는 코드가 판단

---

## 8.2 Jupyter

### 실습 ① 노트북에서 rclpy
- 설치: `sudo apt install -y jupyter` (pip 없음, jupyter lab 없음 → `jupyter notebook`)
- 노트북은 띄운 터미널의 환경을 물려받음 → **overlay 를 source 한 터미널의 홈 폴더에서** 띄운다
  - overlay 없이 → `No module named 'my_interfaces'`
  - 셀에서 `!source` 는 소용없음 (`!` 는 sh 로 돌고, 돌아도 잠깐 켜졌다 꺼짐)
- **셀 셋으로 나눈다**
  1. `init` + 노드 생성 — 한 번
  2. 발행 + `spin_once(timeout_sec=0.1)` — 여러 번
  3. `destroy_node` + `shutdown` — 한 번
- 셀에서 `spin` → 셀이 안 끝남, 정지로도 안 풀리면 커널 재시작 후 셀 1 부터
- 커널은 셀보다 오래 삼 → `init`·`shutdown` 두 번 부르면 RuntimeError

### 실습 ② bag 분석
1. **셀 A**: bag 을 `(초, 토픽, 글자)` 리스트로 담음 (pandas 없음)
2. **셀 B**: 추측·보드 수, 보드 사이 간격, 걸린 시간 ↔ info 의 Duration 비교
   - 보드 > 추측 → 녹화기가 놓친 추측 있음
   - 간격이 두 배쯤인 자리 → 그 사이 추측이 게임 노드에도 안 닿았을 수 있음
3. **셀 C**: 남은 빈칸 수를 `plt.step(where='post')` 계단 그림 → `savefig('hangman_round.png')`
4. 제목에 한글 → 네모로 깨지고 경고만. 그림 안 글자는 영어로

**원칙**: 본 프로그램은 일반 노드로, 탐색과 분석은 노트북으로

---

## 부록과 다음 차시
- 오류 해독 표(5쪽), CLI bag ↔ API bag 비교 표, mcap ↔ sqlite3 비교 표, 자기 점검 9문항
- 다음: **9차시 ROS2 응용 핵심정리** (QoS 는 실습 과정에서)
