# 사용자 제공 GIF 매칭 기록

2026-10-27. `media/gif/`의 원본 18개를 보존하고, 앱 재생용 H.264 MP4와 정지 썸네일을 `media/videos/`에 생성했다. 운동 화면·동작 배우기·홈 미리보기에 같은 매핑을 사용한다. 재생 오류 시에도 해당 사용자 원본 GIF를 사용한다. 기존 Pexels/Mixkit 영상 11개와 합쳐 전체 29개 동작에 재생 자료가 있다.

| 원본 파일 (`media/gif/`) | 운동 ID | 연결 동작 |
|---|---|---|
| 맨몸 스쿼트.gif | squat | 맨몸 스쿼트 — 기존 Pexels 교체 |
| 푸시업 gif.gif | push | 푸시업 — 기존 Pexels 교체 |
| w 레이즈.gif | wraise | W 레이즈 |
| T 레이즈.gif | traise | T 레이즈 |
| 리버스 스노우 엔젤.gif | snowangel | 리버스 스노우 엔젤 |
| 데드버그.gif | dead | 데드버그 |
| 버드독.gif | bird | 버드독 |
| 한발 글루트 브리지.gif | singlebridge | 한발 글루트 브리지 |
| 클램셸.gif | clam | 클램셸 |
| 옆으로 누워 다리 들기.gif | hipabduct | 옆으로 누워 다리 들기 |
| 좁은 푸시업.gif | closepush | 좁은 푸시업 |
| 템포 푸시업.gif | tempo | 템포 푸시업 — 3초 하강·1초 상승으로 편집 |
| 의자 스쿼트.gif | chairsquat | 의자 스쿼트 |
| 천천히 스쿼트.gif | temposquat | 천천히 스쿼트 — 3초 하강·1초 상승으로 편집 |
| 고관절 워밍업.gif | prep2 | 고관절 워밍업 |
| 앉아서 무릎 번갈아 들기.gif | prep3 | **앉아서 무릎 펴기** — 실제 파일에 맞춰 사용자 승인으로 이름·설명 변경 |
| 복부 긴장·호흡.gif | prep4 | 복부 긴장·호흡 — 호흡 원리 참고 그림으로 표시 |
| 종아리·발바닥 가볍게 풀기.gif | cool1 | 종아리·발바닥 가볍게 풀기 |

앱 파일명은 운동 ID를 사용한다. 예: `media/videos/dead.mp4`, `media/videos/dead.jpg`.

## 표현과 확인 범위

원본은 실제 사람·인체 모형·호흡 원리 그림이 섞여 있어 표시를 구분했다. `prep4`의 그림은 복부 긴장 동작 자체를 보여주지 않으므로 안내 설명을 함께 표시한다. 원본 자료의 저작자나 라이선스는 추정해서 기록하지 않았다.

모든 제공 파일의 시계열 프레임을 확인하고, 변환 MP4 전체를 디코딩 검사했다. 푸시업·스쿼트의 템포 변형은 한 주기의 시작·최저점 프레임을 구분해 하강 3초·상승 1초, 총 4초 반복으로 편집했다. 이는 전문 운동 자세 검수와는 구별된다.

## 재생성

Pillow와 FFmpeg가 있는 환경에서:

```text
python tools/import_user_media.py
```

특정 파일만 재생성하는 예:

```text
python tools/import_user_media.py push squat
```

원본 경로·앱 매핑은 `tools/video_sources.json`에 보존된다. `python tools/manage_media.py refresh`를 실행해도 전체 매핑이 유지된다. 다운로드 명령의 `fetch all`은 사용자 원본 GIF를 제외하고 외부 제공 영상만 대상으로 한다.
