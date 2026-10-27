# 칼리코치 동작 영상 자료 확보·탑재 가이드 (개인·비상업적 사용)

> **2026-10-27 최신 상태**: Pexels 12개와 Mixkit 1개, 총 13개 MP4를 연결했습니다. 추가 조사와 적용 결과는 `docs/14_alternative_video_sources.md`를 참조하세요. 원본 및 다운로드 검증 기록은 `media/pending/`에 보관합니다. 아래 11개 후보 목록과 승인 명령은 최초 수집 당시 안내입니다. 이번 연결은 운동 동작의 전문 검수를 의미하지 않습니다.

이 자료는 3인이 각자의 아이폰에서 사용하는 개인 비상업적 프로젝트를 전제로 작성했습니다. 다만 GitHub Pages의 공개 URL에 파일을 올리는 행위는 재배포이므로 비상업적 프로젝트도 개별 자료의 라이선스를 준수해야 합니다.

## 권장 자료

- Pexels 라이선스: https://www.pexels.com/license/ — 앱에서 사용/수정 가능, 출처 표기 권장, 원본 영상 단독 판매 및 별도 스톡 재게시 금지
- Pexels 공식 영상 API: https://www.pexels.com/api/documentation/ (비공개 API 키 필요)
- Wikimedia Commons: https://commons.wikimedia.org/ — 파일별 PD/CC BY/CC BY-SA 조건 확인
- Pixabay: https://pixabay.com/service/license-summary/ — 앱에서 사용 가능하나 Standalone 콘텐츠 재배포 금지

**배제**: 동작 영상 저작권 출처를 확인할 수 없는 '무료 운동 데이터셋'. 소스의 MIT 라이선스가 남이 만든 영상의 권리까지 해결하지는 않습니다.

## 가장 간단한 방법: 브라우저에서 다운로드

`tools/video_sources.json`에 Pexels 영상 11개 링크가 정리되어 있습니다.

1. 링크를 열고 동작이 앱에 등록된 운동과 **정확히 동일한지** 확인합니다.
2. `Free download`에서 720p 또는 적절한 HD MP4를 받습니다.
3. 다운로드한 파일을 `media/pending/<운동ID>.mp4`라는 이름으로 저장합니다. (예: `media/pending/push.mp4`)
4. 터미널에서 `python tools/manage_media.py approve push` 실행 후, **실제 영상을 시청한 경우에만 `APPROVE` 입력**합니다.
5. 승인 파일이 `media/videos/push.mp4`로 복사되고 `video-catalog.js`에 등록됩니다.
6. `git add . && git commit -m 'feat: add reviewed exercise footage' && git push origin main` 실행합니다.

`approve` 전에 있는 `media/pending/` 폴더는 `.gitignore`로 GitHub에 올라가지 않도록 했습니다.

## API를 사용한 자동 수집 (Windows PowerShell)

Pexels 무료 API 키 발급: https://www.pexels.com/api/

```powershell
$env:PEXELS_API_KEY = '발급받은_개인_API_KEY'
python tools/manage_media.py list
python tools/manage_media.py fetch push
python tools/manage_media.py fetch squat
# 후보를 모두 받아 검수하려면
python tools/manage_media.py fetch all
```

**API 키를 `app.js`나 `video-catalog.js`에 기록하지 마세요.** 브라우저 개발자도구, GitHub 공개 저장소, 커밋에 노출됩니다. API 요청은 사용자의 Windows PC에서만 실행하세요.

자동 수집은 `media/pending/`에만 저장합니다. 자동으로 승격하지 않는 이유는 파일의 출처와 라이선스가 적합해도 **동작이 실제로 정확할지는 직접 봐야 하기 때문**입니다. 특히 무릎 푸시업/인클라인 푸시업/스플릿 스쿼트/사이드 플랭크의 좌우 방향은 확인하지 않으면 잘못된 자료가 될 수 있습니다.

## 적용된 영상의 재생 방식

승인한 MP4가 있으면 운동 화면과 '동작 배우기' 화면에서 우선 재생됩니다. 무음 자동 반복, 0.5배/1배, 누르면 일시정지를 지원합니다. 등록되지 않은 동작은 기존 자체 제작 GIF와 설명을 그대로 사용합니다. 후보가 있으면 링크가 노출됩니다. iOS PWA에서 MP4는 브라우저 요청으로 재생되고 오프라인 선탑재는 아직 지원하지 않습니다.

## 영상 제작 권장 규격

- 실제 사람의 전신/주요 관절이 보이는 5~15초 영상, 측면 또는 45도, 정확한 동작 반복
- H.264 + AAC 또는 무음 MP4, 최대 720p/30fps 권장. 오프라인 저장과 Git 저장소를 위해 파일당 약 1~4MB 권장
- 저작자·소스·이용허락 정보를 문서에 그대로 유지
- 광고성 연출 또는 잘못된 자세는 배제

## 검토 완료 조건

- [ ] 해당 동작과 정확히 일치함
- [ ] 손·발·허리·무릎 등 관절이 보임
- [ ] 카메라 각도 때문에 반대쪽 동작으로 오인되지 않음
- [ ] 처음부터 끝까지 정상 속도로 1회 이상 반복됨
- [ ] 영상 제공자의 공개 앱 이용·수정 권한 확인
- [ ] 최종 아이폰 Safari에서 재생 확인

## 참고 자료

CDC 푸시업(미국 연방정부 공식 업무, PD 표시): https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_Home_-_Push-ups.webm

CDC 반스쿼트(같은 표시): https://commons.wikimedia.org/wiki/File:Muscle_Strengthening_at_Home_-_Half_squat.webm

Wikimedia Commons 맨몸 스쿼트 GIF (CC BY-SA 4.0): https://commons.wikimedia.org/wiki/File:Bodyweight_Squats.gif

Wikimedia Commons 좁은 푸시업 GIF (CC BY-SA 4.0): https://commons.wikimedia.org/wiki/File:Narrow_Push_Ups.gif

개인·비상업적이라는 사유만으로 모든 유튜브/헬스 앱 영상의 복사·재업로드가 허용되는 것은 아닙니다.
