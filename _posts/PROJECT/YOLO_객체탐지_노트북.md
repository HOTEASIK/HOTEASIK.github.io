# 개요

간단하게 노트북 카메라를 이용 하여 객체 탐지하고 분류 하는 코드를 짜기

- 목표: 노트북 웹캠 영상을 ROS2 토픽으로 받아 YOLO로 객체를 탐지하고, 결과(박스·클래스·신뢰도)를 화면과 토픽으로 출력
- 범위: 사전학습 모델(COCO 80클래스) 사용. 커스텀 학습은 이후 확장 항목

# 준비물

| 항목 | 내용 |
|---|---|
| OS | Ubuntu 24.04 LTS (네이티브) |
| 미들웨어 | ROS2 Jazzy |
| WorkSpace | `~/cam_yolo` |
| 패키지 | `cam_search` (ament_python) |
| 언어 | Python 3.12 |
| 객체 탐지 | YOLO (ultralytics) — 버전은 아래 후보 중 사양에 맞게 선택 |
| 카메라 | 노트북 내장 웹캠 (`/dev/video0`) |

## YOLO 버전 후보

| 모델 | 크기 | CPU 실시간 | 정확도 | 비고 |
|---|---|---|---|---|
| YOLOv3-tiny | 약 35MB | 가능 | 낮음 | 2018년 모델. ultralytics에서 `yolov3-tinyu.pt`로 사용 가능 |
| YOLOv4-tiny | 약 23MB | 가능 | 낮음~보통 | Darknet 기반. ultralytics 미지원 → OpenCV DNN(`cv2.dnn`)으로 `.cfg`+`.weights` 로드 |
| YOLOv5n | 약 5MB | 가능 | 보통 이하 | ultralytics에서 `yolov5nu.pt`로 사용 가능 |
| YOLOv6n | 약 10MB | 가능 | 보통 | Meituan 별도 저장소. ultralytics는 사전학습 가중치 미제공 |
| YOLOv7-tiny | 약 12MB | 가능 | 보통 | 별도 저장소(WongKinYiu/yolov7). ultralytics 미지원 |
| YOLOv8n | 약 6MB | 가능 | 보통 | 자료가 가장 많음 |
| YOLO11n | 약 5MB | 가능 | v8n보다 약간 높음 | 사용법 v8과 동일 |
| YOLOv8s / YOLO11s | 약 20MB | GPU 권장 | 높음 | GPU(NVIDIA) 있을 때 |

- 선택 기준: GPU 없으면 `n`, NVIDIA GPU 있으면 `s` 이상
- ultralytics 패키지로 쓸 수 있는 건 v3, v5, v8, 11뿐이고 모델 파일명만 바꾸면 됨 (`yolov3-tinyu.pt`, `yolov5nu.pt`, `yolov8n.pt`, `yolo11n.pt`)
  ultralytics 패키지: 살시간 컴퓨터 비전(Computer Vision) AI 모델을 손쉽게 학습, 검증, 예측 및 배포할 수 있도록 지원하는 오픈소스 Python 라이브러리
- v4, v6, v7은 저장소·로드 방식이 달라 detector 노드 코드도 따로 짜야 함 → 버전끼리 비교해 보고 싶을 때만 선택

## 필요 패키지

- ROS2: `ros-jazzy-v4l2-camera` (카메라 노드), `ros-jazzy-cv-bridge`, `ros-jazzy-vision-msgs`, `ros-jazzy-rqt-image-view`
    sudo apt update
    sudo apt install ros-jazzy-v4l2-camera # 리눅스(Linux) 운영체제에서 카메라, 웹캠, TV 튜너 같은 비디오 장치를 제어하기 위해 사용하는 표준 시스템 프레임워크
    source /opt/ros/jazzy/setup.bash
- Python: `ultralytics`, `opencv-python`
- 주의: Ubuntu 24.04는 시스템 pip 설치가 막혀 있음(PEP 668) → `pip install --break-system-packages` 또는 venv(`--system-site-packages`) 사용

# 구조

```
[v4l2_camera_node] --/image_raw--> [detector 노드 (cam_search)] --/detections--> (vision_msgs/Detection2DArray)
                                                               \--/detections/image--> rqt_image_view
```
# 왜 -v4l2-camera 인가
다른 프레임워크
• Libcamera: V4L2를 대체하기 위해 개발된 차세대 리눅스 카메라 스택입니다. 라즈베리 파이(Raspberry Pi OS Bullseye 이후 버전) 등에서 이미 기본 카메라 프레임워크로 채택되었습니다. 하드웨어 제어를 더 세밀하고 유연하게 처리합니다.
• PipeWire / GStreamer: 멀티미디어 스트리밍 프레임워크입니다. V4L2나 Libcamera가 로우레벨(하드웨어 직결) 제어를 담당한다면, 이들은 그 위에서 영상을 앱(웹 브라우저, OBS 등)으로 안전하게 공유하고 라우팅해 주는 역할을 합니다.


## 노드 설계

| 노드 | 패키지 | 구독 | 발행 |
|---|---|---|---|
| v4l2_camera_node | v4l2_camera | - | `/image_raw` (sensor_msgs/Image) |
| detector | cam_search | `/image_raw` | `/detections` (vision_msgs/Detection2DArray), `/detections/image` (박스 그린 이미지) |

## 파라미터 (detector)

- `model`: 모델 파일명 (기본 `yolov8n.pt`)
- `conf`: 신뢰도 임계값 (기본 0.5)
- `device`: `cpu` 또는 `0`(GPU)



# 진행 기록 (2026-11-03, 객체 인식 성공)

## 확인된 환경
- GPU 없음 → CPU 전용, 모델 `yolov8n.pt`
- 웹캠: `/dev/video0` = 영상(720p HD Camera, uvcvideo), `/dev/video1` = 메타데이터 전용(사용 안 함)
- 카메라 기본 포맷: YUYV 640x480 (MJPG도 지원)

## 1단계. 카메라 노드 실행
```bash
sudo apt update
sudo apt install ros-jazzy-v4l2-camera ros-jazzy-cv-bridge ros-jazzy-vision-msgs ros-jazzy-rqt-image-view v4l-utils
source /opt/ros/jazzy/setup.bash
ros2 run v4l2_camera v4l2_camera_node --ros-args -p video_device:=/dev/video0 -p image_size:="[640,480]"
```
- 처음에 `Package 'v4l2_camera' not found` → apt 설치로 해결
- 실행 로그의 아래 메시지는 무시해도 됨
  - `Permission denied (13)` / `Control type not currently supported`: 일부 카메라 제어값 문제, 영상과 무관
  - `possibly slow conversion: yuv422_yuy2 => rgb8`: 포맷 변환 경고, 640x480에선 문제 없음
  - `Camera calibration file ... not found`: 보정 파일 없음, 객체 탐지엔 불필요
- 확인: `ros2 topic list`(→ `/image_raw`), `rqt_image_view`로 영상 확인 완료

## 2단계. Python 라이브러리 설치 (CPU 버전)
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu --break-system-packages
pip install ultralytics --break-system-packages
pip install "numpy<2" "opencv-python<4.12" --break-system-packages #넘파이,opencv 설치 버전 확인 
```
- CPU 버전 torch를 먼저 설치해야 수 GB짜리 GPU 버전이 깔리지 않음
- numpy는 반드시 1.x (Jazzy cv_bridge가 numpy 1.x로 빌드됨), opencv-python 4.12 이상은 numpy 2.x를 요구하므로 함께 낮춤
- 확인: `python3 -c "import numpy, cv2; from cv_bridge import CvBridge; import ultralytics; print(numpy.__version__, cv2.__version__)"`

## 3단계. 워크스페이스·패키지 생성
```bash
mkdir -p ~/cam_yolo/src && cd ~/cam_yolo/src
ros2 pkg create cam_search --build-type ament_python --dependencies rclpy sensor_msgs vision_msgs cv_bridge
```

## 4단계. detector 노드 작성
파일: `~/cam_yolo/src/cam_search/cam_search/detector.py`
```python
import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import Image
from vision_msgs.msg import Detection2DArray, Detection2D, ObjectHypothesisWithPose
from cv_bridge import CvBridge
from ultralytics import YOLO


class Detector(Node):
    def __init__(self):
        super().__init__('detector')
        # 파라미터
        self.declare_parameter('model', 'yolov8n.pt')
        self.declare_parameter('conf', 0.5)
        self.declare_parameter('device', 'cpu')
        self.conf = self.get_parameter('conf').value
        self.device = self.get_parameter('device').value

        self.model = YOLO(self.get_parameter('model').value)
        self.bridge = CvBridge()

        # 구독: 웹캠 영상 / 발행: 탐지 결과 + 박스 그린 영상
        self.sub = self.create_subscription(
            Image, '/image_raw', self.callback, qos_profile_sensor_data)
        self.det_pub = self.create_publisher(Detection2DArray, '/detections', 10)
        self.img_pub = self.create_publisher(Image, '/detections/image', 10)

    def callback(self, msg):
        # ROS Image → OpenCV(BGR)
        frame = self.bridge.imgmsg_to_cv2(msg, 'bgr8')

        # YOLO 추론
        result = self.model(frame, conf=self.conf, device=self.device, verbose=False)[0]

        # 탐지 결과 → Detection2DArray
        det_array = Detection2DArray()
        det_array.header = msg.header
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            det = Detection2D()
            det.header = msg.header
            det.bbox.center.position.x = (x1 + x2) / 2
            det.bbox.center.position.y = (y1 + y2) / 2
            det.bbox.size_x = x2 - x1
            det.bbox.size_y = y2 - y1

            hyp = ObjectHypothesisWithPose()
            hyp.hypothesis.class_id = result.names[int(box.cls)]
            hyp.hypothesis.score = float(box.conf)
            det.results.append(hyp)
            det_array.detections.append(det)
        self.det_pub.publish(det_array)

        # 박스 그린 이미지 발행
        img_msg = self.bridge.cv2_to_imgmsg(result.plot(), 'bgr8')
        img_msg.header = msg.header
        self.img_pub.publish(img_msg)


def main():
    rclpy.init()
    node = Detector()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    node.destroy_node()
    rclpy.shutdown()
```

### 코드 핵심
| 부분 | 역할 |
|---|---|
| `declare_parameter` | model·conf·device를 실행 시 변경 가능 (`-p model:=yolo11n.pt`) |
| `qos_profile_sensor_data` | best-effort 구독. 카메라 QoS와 무관하게 연결되고 밀린 프레임은 버림 |
| `imgmsg_to_cv2(msg, 'bgr8')` | v4l2_camera의 rgb8 → YOLO/OpenCV용 BGR 변환 |
| `box.xyxy`, `box.cls`, `box.conf` | 박스 좌표, 클래스 번호, 신뢰도 (`result.names[번호]` = 클래스명) |
| `result.plot()` | 박스·라벨이 그려진 이미지 |
| `header = msg.header` | 원본 타임스탬프 유지 |

`setup.py`의 `entry_points`:
```python
entry_points={
    'console_scripts': [
        'detector = cam_search.detector:main',
    ],
},
```

## 5단계. 빌드·실행
```bash
cd ~/cam_yolo
colcon build --packages-select cam_search
source install/setup.bash
ros2 run cam_search detector --ros-args -p model:=yolov8n.pt -p conf:=0.5
```
- 실행해도 터미널에 아무것도 안 뜨는 게 정상 (`verbose=False`, 로그 출력 없음)
- 처음 실행 시 `yolov8n.pt` 자동 다운로드
- 코드 수정 시 `colcon build` + `source install/setup.bash` 다시 해야 반영

## 6단계. 검증
```bash
ros2 node list                          # /detector, /v4l2_camera 확인
ros2 topic echo /detections --once      # class_id, score 확인
ros2 topic hz /detections/image         # 탐지 FPS
ros2 run rqt_image_view rqt_image_view  # /detections/image 선택 → 박스 표시
```
- [x] 노드 2개 실행 확인
- [x] 객체 인식 확인
- [ ] FPS 측정 → 5Hz 미만이면 `imgsz=320` 적용 검토

# 막혔던 부분과 해결 과정

## 문제 1. 카메라 노드 패키지가 없음
- **언제**: 1단계, 카메라 노드를 처음 실행할 때
- **증상**
  ```
  ros2 run v4l2_camera v4l2_camera_node --ros-args -p video_device:=/dev/video0 -p image_size:="[640,480]"
  Package 'v4l2_camera' not found
  ```
- **원인**: ROS2 Jazzy 기본 설치에는 `v4l2_camera` 패키지가 들어 있지 않음
- **해결**
  ```bash
  sudo apt update
  sudo apt install ros-jazzy-v4l2-camera
  source /opt/ros/jazzy/setup.bash   # 설치 후 다시 source 해야 ros2가 패키지를 인식
  ```
- **확인**: `ros2 pkg list | grep v4l2` → `v4l2_camera` 출력
- **배운 점**: `Package '...' not found`는 대부분 `ros-jazzy-<패키지명>` 미설치 또는 `source` 누락. 패키지명의 `_`는 apt에서 `-`로 바뀜

## 문제 2. 카메라 노드 로그에 ERROR/WARN이 섞여 나옴
- **언제**: 1단계, 카메라 노드 실행 직후
- **증상**
  ```
  [ERROR] Failed getting value for control 10092545: Permission denied (13); returning 0!
  [WARN]  Control type not currently supported: 8, for control: Region of Interest Auto Ctrls
  [WARN]  Image encoding not the same as requested output, performing possibly slow conversion: yuv422_yuy2 => rgb8
  [ERROR] Unable to open camera calibration file [/home/taeho-kim/.ros/camera_info/720p_hd_camera:_720p_hd_camera.yaml]
  ```
- **원인**
  - Permission denied / not supported: 웹캠의 일부 고급 제어 항목(ROI 등)을 v4l2_camera가 읽거나 지원하지 못함
  - slow conversion: 카메라는 YUYV로 찍는데 노드는 rgb8로 발행하므로 변환이 일어남
  - calibration file: 카메라 보정(내부 파라미터) 파일이 없음
- **해결**: 조치 불필요. `Starting camera` 이후 `/image_raw`가 정상 발행됨
- **확인**: `ros2 topic list`에 `/image_raw`, `rqt_image_view`로 영상 확인
- **배운 점**: ERROR 문구가 있어도 노드가 계속 돌고 토픽이 나오면 치명적인 오류가 아님. 판단 기준은 "토픽이 발행되는가". 보정 파일은 거리 측정·3D 변환 등을 할 때만 필요

## 문제 3. GPU가 없는 노트북
- **언제**: 2단계, 라이브러리 설치 전
- **상황**: `pip install ultralytics`를 그대로 하면 CUDA(GPU)용 PyTorch가 함께 설치되어 수 GB를 차지하고, GPU가 없으니 쓸모도 없음
- **해결**: CPU 버전 PyTorch를 먼저 설치한 뒤 ultralytics 설치
  ```bash
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu --break-system-packages
  pip install ultralytics --break-system-packages
  ```
  - 모델은 CPU에서 실시간에 가까운 `yolov8n.pt`로 결정, detector의 `device` 기본값은 `cpu`
- **배운 점**: 이미 torch가 설치돼 있으면 pip가 다시 설치하지 않으므로, torch를 먼저 원하는 버전으로 깔아 두는 순서가 중요

## 문제 4. NumPy 버전 충돌로 detector가 Segmentation fault로 종료
- **언제**: 5단계, detector를 처음 실행할 때
- **증상**
  ```
  A module that was compiled using NumPy 1.x cannot be run in
  NumPy 2.5.4 as it may crash. ...
  File "/opt/ros/jazzy/lib/python3.12/site-packages/cv_bridge/__init__.py", line 6, in <module>
      from cv_bridge.boost.cv_bridge_boost import cvtColorForDisplay, getCvType
  ...
  File ".../cam_search/detector.py", line 28, in callback
      frame = self.bridge.imgmsg_to_cv2(msg, 'bgr8')
  ...
  [ros2run]: Segmentation fault
  ```
- **원인**
  - `ultralytics`를 pip로 설치하면서 `~/.local`에 최신 numpy(2.5.4)가 설치됨
  - Jazzy의 `cv_bridge`는 apt 패키지로, numpy 1.x 기준으로 컴파일됨 → numpy 2.x와 바이너리 호환 안 됨
  - import 단계에서 경고만 나고 넘어간 뒤, 첫 영상이 들어와 `imgmsg_to_cv2`를 호출하는 순간 크래시
- **해결**: numpy를 1.x로 내리고, numpy 2.x를 요구하는 최신 opencv-python도 함께 내림
  ```bash
  pip list 2>/dev/null | grep -i -E "numpy|opencv"   # 현재 버전 확인
  pip install "numpy<2" "opencv-python<4.12" --break-system-packages
  # opencv-python-headless가 있으면 같은 방식으로 함께 낮춤
  ```
- **확인**
  ```bash
  python3 -c "import numpy, cv2; from cv_bridge import CvBridge; import ultralytics; print(numpy.__version__, cv2.__version__)"
  # numpy 1.26.x, cv2 4.11.x 출력되고 오류 없으면 OK
  ```
- **배운 점**
  - 에러 로그의 경로를 보면 원인을 찾을 수 있음: numpy는 `~/.local`(pip), cv_bridge는 `/opt/ros/jazzy`(apt) → 설치 경로가 달라 버전이 엇갈림
  - numpy만 내리면 opencv-python이 깨질 수 있으므로 의존 관계를 함께 봐야 함
  - 이후 pip로 다른 패키지를 설치하다 numpy가 다시 2.x로 올라가면 같은 오류 재발 → 같은 명령으로 복구

## 문제 5. detector를 실행해도 아무것도 안 뜸
- **언제**: 5단계, numpy 문제 해결 후 재실행
- **증상**: `ros2 run cam_search detector ...` 실행 후 터미널에 아무 출력 없음
- **원인**: 오류가 아니라 설계상 정상. YOLO 출력은 `verbose=False`로 꺼 두었고, 노드 코드에 로그(`get_logger().info`)가 없음. 결과는 토픽으로만 발행됨
- **해결**: 다른 터미널에서 토픽으로 동작 확인
  ```bash
  ros2 node list                        # /detector, /v4l2_camera 확인됨
  ros2 topic echo /detections --once
  ```
  - 터미널에 결과를 보고 싶으면 `callback`의 `self.det_pub.publish(det_array)` 위에 추가
    ```python
    self.get_logger().info(f'{len(det_array.detections)} objects: ' +
        ', '.join(d.results[0].hypothesis.class_id for d in det_array.detections))
    ```
- **배운 점**: ROS2 노드는 조용히 도는 경우가 많음. 동작 여부는 `node list` → `topic list` → `topic hz/echo` 순서로 확인

## 문제 6. 토픽이 발행되지 않는다고 나옴
- **언제**: 6단계, 탐지 결과 확인 중
- **증상**
  ```
  ros2 topic echo /detectionsc --once
  WARNING: topic [/detectionsc] does not appear to be published yet
  Could not determine the type for the passed topic
  ```
- **원인**: 토픽 이름 오타 (`/detectionsc` → 끝에 `c`가 붙음). 노드는 정상(`/detector`, `/v4l2_camera` 모두 실행 중)
- **해결**: `ros2 topic echo /detections --once`로 정확히 입력 → 객체 인식 결과 확인
- **배운 점**: `does not appear to be published yet`이 나오면 먼저 `ros2 topic list`로 실제 토픽 이름과 비교. 토픽 이름은 Tab 자동완성 사용 권장

# 다음 할 일

## 7단계. launch 파일
- [ ] `cam_yolo.launch.py`로 카메라 노드 + detector 한 번에 실행
- [ ] 파라미터(model, conf, device) launch에서 지정

파일: `~/cam_yolo/src/cam_search/launch/cam_yolo.launch.py`
```python
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    model = LaunchConfiguration('model')
    conf = LaunchConfiguration('conf')
    device = LaunchConfiguration('device')

    return LaunchDescription([
        DeclareLaunchArgument('model', default_value='yolov8n.pt'),
        DeclareLaunchArgument('conf', default_value='0.5'),
        DeclareLaunchArgument('device', default_value='cpu'),

        # 웹캠 → /image_raw
        Node(
            package='v4l2_camera',
            executable='v4l2_camera_node',
            parameters=[{
                'video_device': '/dev/video0',
                'image_size': [640, 480],
            }],
        ),

        # /image_raw → /detections, /detections/image
        Node(
            package='cam_search',
            executable='detector',
            parameters=[{
                'model': model,
                'conf': conf,
                'device': device,
            }],
        ),
    ])
```

`setup.py`에 launch 파일 설치 경로 추가 (없으면 빌드 시 launch 파일이 설치되지 않음):
```python
import os
from glob import glob
...
data_files=[
    # 기존 항목 유지
    (os.path.join('share', package_name, 'launch'), glob('launch/*.launch.py')),
],
```

`package.xml`에 실행 의존성 추가:
```xml
<exec_depend>launch_ros</exec_depend>
<exec_depend>v4l2_camera</exec_depend>
```

실행:
```bash
cd ~/cam_yolo
colcon build --packages-select cam_search
source install/setup.bash
ros2 launch cam_search cam_yolo.launch.py
ros2 launch cam_search cam_yolo.launch.py model:=yolo11n.pt conf:=0.4   # 파라미터 변경
```

## 8단계. venv 가상환경 + Python 종속성
- [ ] `requirements.txt`로 Python 라이브러리 관리
- [ ] venv에서 `ros2 run` / `ros2 launch` 실행

파일: `~/cam_yolo/src/cam_search/requirements.txt`
```
--extra-index-url https://download.pytorch.org/whl/cpu
torch
torchvision
ultralytics
numpy<2
opencv-python<4.12
```
- `--extra-index-url`: torch를 CPU 버전으로 받기 위함
- `numpy<2`, `opencv-python<4.12`: venv여도 cv_bridge는 apt 버전을 쓰므로 문제 4와 같은 충돌 방지
- `package.xml`·`setup.py`에 넣지 않는 이유: ultralytics/torch는 rosdep 키가 없고, `install_requires`는 colcon이 설치해 주지 않음

venv 생성·설치:
```bash
cd ~/cam_yolo
python3 -m venv venv --system-site-packages   # rclpy, cv_bridge 등 apt 패키지도 보이게
touch venv/COLCON_IGNORE                      # colcon이 venv를 빌드 대상으로 보지 않게
source venv/bin/activate                      # 가상환경 활성화
pip install -r src/cam_search/requirements.txt
```
- 확인: `python3 -c "import numpy, cv2; from cv_bridge import CvBridge; import ultralytics; print(numpy.__version__, cv2.__version__)"`
- GPU 버전 torch가 깔리면 먼저 따로 설치: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu`
- 기존 `~/.local`(--break-system-packages) 패키지가 venv보다 먼저 잡힐 수 있음 → 정리 여부 확인 필요
- venv가 없으면 sudo apt update, sudo apt install python3.12-venv
`setup.cfg`에 추가 (없으면 `ros2 run`이 venv가 아닌 `/usr/bin/python3`로 실행됨):
```ini
[build_scripts]
executable = /usr/bin/env python3
```

빌드·실행 (venv 활성화 상태에서):
```bash
cd ~/cam_yolo
source /opt/ros/jazzy/setup.bash
source venv/bin/activate
colcon build --packages-select cam_search
source install/setup.bash
ros2 launch cam_search cam_yolo.launch.py
```
- 새 터미널마다 `source venv/bin/activate` 필요

## 이후 확장 (선택)
- 특정 클래스만 필터링 (예: person만)
- 클래스별 개수 카운트 토픽 발행
- 커스텀 데이터셋 학습 후 모델 교체

# 트러블슈팅 메모

| 증상 | 확인할 것 |
|---|---|
| `/dev/video0` 없음 | BIOS/키보드 카메라 차단 키, `sudo usermod -aG video $USER` 후 재로그인 |
| `Package 'v4l2_camera' not found` | `sudo apt install ros-jazzy-v4l2-camera` 후 `source /opt/ros/jazzy/setup.bash` |
| pip 설치 오류 (externally-managed) | `--break-system-packages` 사용, 또는 venv 사용 (8단계: `setup.cfg`에 `executable = /usr/bin/env python3` 필요) |
| `compiled using NumPy 1.x cannot be run in NumPy 2.x` + Segmentation fault | ultralytics가 numpy 2.x를 설치함 → `pip install "numpy<2" "opencv-python<4.12" --break-system-packages` |
| detector 실행 후 아무 출력 없음 | 정상. `ros2 topic echo /detections --once`로 확인 |
| `topic does not appear to be published yet` | 토픽 이름 오타 확인 (`/detectionsc` ✗ → `/detections` ✓), `ros2 topic list` |
| 탐지가 너무 느림 | 모델 `n`으로, 카메라 해상도 640x480, `imgsz=320`, 프레임 건너뛰기 |
