---
title: "Task 좌표, Joint 좌표"
date: 2026-11-12 12:00:00 +0900
categories: [ROBOTICS, 협동로봇]
tags: []
---
### task 좌표와 joint 각도 출력

```python
homej = posj(0,0,90,0,90,0)
movej(homej,vel=50,acc=50)

cur_posj = get_current_posj()
tp_log("posj:{}".format(str(cur_posj)))

home_px = posx(400,200,300,0,180,0)
movel(home_px,vel=50,acc=50)

cur_posx, sol = get_current_posx()
tp_log("posx:{}".format(str(cur_posx)))
```

### joint 토크와 외력 출력

```python
#조인트센서 토크 값을 리턴합니다.
torque_joint = get_joint_torque()

#각 관절에서 외력에 의해 발생하는 토크 값을 리턴합니다.
torque_ext=get_external_torque()

#기준좌표계(DR_BASE)에서의 툴에 작용하는 외력 값을 리턴합니다
force_ext = get_tool_force(DR_BASE)
```