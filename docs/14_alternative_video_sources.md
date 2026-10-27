# 남은 운동 18개: Pexels 외 출처 조사와 적용 결과

조사일: 2026-10-27. 운동 이름뿐 아니라 현재 앱의 자세·도구·템포를 기준으로 조사했다. `후보`는 제공자의 영상 제목·설명에서 해당 동작을 확인한 상태이며 전체 동작 검수가 끝났다는 뜻은 아니다. 공개 시청 가능, 파일 다운로드 가능, 앱 재배포 허용은 별도로 기록했다.

## 이번에 적용한 영상

- `cool2`: [Mixkit 32635 — Young woman meditating on the floor with hand on chest](https://mixkit.co/free-stock-video/young-woman-meditating-on-the-floor-with-hand-on-chest-32635/). 공식 무료 다운로드가 제공하는 MP4를 받았다. [Stock Video Free License](https://mixkit.co/license/modal/videoFree/)는 다운로드·복제·수정·배포와 상업/비상업 프로젝트 사용을 허용한다. 시계열 프레임에서 앉아서 편안하게 호흡하는 장면을 확인했다. `media/videos/cool2.mp4`로 적용했다. 복부 긴장을 가르치는 `prep4`에는 사용하지 않았다.
- `prep1`: 이전 조사에서 찾은 [Pexels 6326787 — Woman Stretching her Shoulders](https://www.pexels.com/video/woman-stretching-her-shoulders-6326787/)도 공식 다운로드 후 확인했다. 서서 어깨를 앞뒤로 돌리는 시연으로 `media/videos/prep1.mp4`에 적용했다. 저작자 Pavel Danilyuk, Pexels License.
- 원본은 Git에서 제외된 `media/pending/`에 보관했다. 앱용 MP4는 H.264, 무음, 긴 변 최대 1280/높이 최대 720, faststart로 변환했고 전체 디코딩 검사를 통과했다. 원본 링크와 이용 조건은 앱의 동작 배우기에 표시한다.
- 이번 적용 후 등록 영상 13개, 애니메이션 유지 16개. 공개 사이트에 배포하거나 Git에 커밋하지 않았다.

## 18개 운동별 다른 출처

| 운동 / ID | 찾은 출처 | 현재 판단 |
|---|---|---|
| 어깨·팔 풀기 / prep1 | [UCSF Shoulder: Shoulder Rolls](https://sportsrehab.ucsf.edu/content/shoulder), [NUHS Physiotherapy – Shoulder Rolls](https://www.youtube.com/watch?v=Bv8QPOs7xks) | 병원 시연 후보 있음. 파일 재사용 허가 미확인. 이번에는 동작을 확인한 Pexels 파일로 교체. |
| 고관절 워밍업 / prep2 | [Special Olympics – Hip Circles](https://resources.specialolympics.org/sports-essentials/sports-and-coaching/warm-up-and-cool-down-videos/dynamic-warm-up-hip-circles) | 고관절 돌리기 시연 후보. 앱의 가벼운 무릎 굽힘·허리 안정 자세와 대조 필요. 다운로드·재배포 허가 미확인. 이전 Pexels 후보 9058019는 하체가 잘려 자세 확인이 어려워 미적용. |
| 앉아서 무릎 들기 / prep3 | [University of Manitoba – Seated Energizer Break](https://escholarship.umanitoba.ca/projects/motionminutes/resource-collection/all-videos/resource/seated-energizer-break) | 앉아서 제자리 걷기 포함. 전체 약 3분 복합 루틴. CC BY-NC-ND 4.0으로 표기되어 있어 운동 부분을 잘라 반복하는 편집용 파일로 채택하지 않음. [NHS 설명](https://www.nhs.uk/live-well/exercise/sitting-exercises/)은 동작 확인용이며 영상 확보로 계산하지 않음. |
| 복부 긴장·호흡 / prep4 | [BSR Physical Therapy – Abdominal Bracing](https://www.youtube.com/watch?v=3x6X1dwAn-s), [Pelvic Exercises – Abdominal Bracing](https://www.pelvicexercises.com.au/abdominal-bracing/) | 중립 척추·가벼운 복부 수축·지속 호흡이라는 앱 설명과 가까운 후보. 단순 명상 호흡으로 대체하지 않음. 파일 재사용 허가 미확인. |
| 종아리·발바닥 풀기 / cool1 | [OrthoIndy – Seated Ankle Circles](https://www.youtube.com/watch?v=bX6e_SwJWDk), [ColumbiaDoctors – Ankle Circles](https://www.columbiadoctors.org/health-library/multimedia/ankle-circles/) | 앉아서 발목 움직이기는 후보 확보. 발가락 움직임까지 포함하는지는 미확인. 파일 재사용 허가 미확인. |
| 호흡하며 마무리 / cool2 | [Mixkit 32635](https://mixkit.co/free-stock-video/young-woman-meditating-on-the-floor-with-hand-on-chest-32635/) | 공식 무료 다운로드와 재사용 조건 확인. 이번에 다운로드·적용 완료. |
| 템포 푸시업 / tempo | [HASfit – 3 1 Tempo Push Up](https://hasfit.com/exercises/chest/3-1-tempo-push-up/) | 3:1 템포 전용 시연 후보 발견. 실제 하강·상승 시간과 파일 재사용 허가 확인 필요. |
| 천천히 스쿼트 / temposquat | [Barbell Logic – Tempo Squat](https://barbell-logic.com/gym-shorts-the-tempo-squat/) | 바벨 기반 설명이라 맨몸 3초 하강·1초 상승과 정확히 일치하는 파일로 채택하지 않음. 이번 조사에서도 정확한 맨몸 3:1 시연 파일 미확보. 기존 허가 영상의 구간별 속도 편집은 별도 제작 대안. |
| 좁은 푸시업 / closepush | [Muscle & Strength – Close Grip Push Up](https://www.muscleandstrength.com/exercises/close-grip-push-up.html), [ShapeSense](https://www.shapesense.com/fitness-exercise/exercise-videos/triceps/close-grip-push-up.shtml) | 동작별 영상 후보 발견. 손 간격·팔꿈치 방향 검수 및 파일 재사용 허가 미완료. |
| 의자 스쿼트 / chairsquat | [UCSF Hip – Chair Squats](https://sportsrehab.ucsf.edu/hip), [UCSF 원본 영상](https://www.youtube.com/watch?v=ajWeAqOg72g) | 대학병원 시연 후보. 의자에 가볍게 닿기와 완전히 앉기의 차이 검수 필요. 제공 페이지의 다운로드 표시는 PDF용이며 영상 다운로드 허가로 계산하지 않음. |
| 한발 글루트 브리지 / singlebridge | [UCSF 원본 영상](https://www.youtube.com/watch?v=p-XVfkvtUPY), [Cornell Single Leg Bridge](https://vod.video.cornell.edu/media/Single%2BLeg%2BBridge/1_bnx7wazy) | 대학병원·대학 물리치료 영상 후보. 파일 다운로드·앱 재사용 허가 미확인. |
| 클램셸 / clam | [UCSF Clamshells](https://www.youtube.com/watch?v=juAbSSGyX0E) | 옆으로 누운 클램셸 시연 후보. 밴드 여부·발 붙이기 검수 필요. 누워 무릎을 옆으로 내리는 다른 변형은 제외. |
| 옆으로 누워 다리 들기 / hipabduct | [UCSF](https://www.youtube.com/watch?v=uLOpxoJaG-k), [Hampshire Hospitals NHS](https://www.youtube.com/watch?v=Nt74N6ZwqAE) | NHS 영상 설명에서 옆으로 누워 무릎을 편 윗다리를 들고 천천히 내리는 동작 확인. 수술 후 환자용 운동량·유지시간은 앱으로 가져오지 않음. 파일 재사용 허가 미확인. |
| W 레이즈 / wraise | [PURE Motivation Fitness – Prone W](https://www.youtube.com/watch?v=TYmmfiJzliQ) | 엎드린 W 운동 시연 후보. 파일 다운로드·재사용 허가 미확인. |
| T 레이즈 / traise | [Prone T Raise 영상 안내](https://www.fitmetrics.ch/en/exercise/6733d7262bc03-prone-t-raise/videos), [원본 YouTube](https://www.youtube.com/watch?v=dLlILrckB-A) | 맨몸·매트 시연 후보. 파일 재사용 허가 미확인. DVIDS Prone T Drill은 별개 달리기 훈련이므로 제외. |
| 리버스 스노우 엔젤 / snowangel | [[P]rehab – Reverse Snow Angel](https://theprehabguys.com/vimeo-video/reverse-snow-angel/) | 제공자 설명에서 엎드려 팔을 머리 위에서 엉덩이 방향으로 움직이는 시연 확인. 후반에는 외부 중량을 사용하므로 그대로 반복하면 안 됨. 편집·재배포 허가 미확인. |
| 버드독 / bird | [Hospital for Special Surgery – Bird-Dog](https://www.youtube.com/watch?v=xo7Qpb_NTKE), [Calgary Core Physiotherapy](https://calgarycorephysio.ca/exercise-bird-dog/) | 병원·물리치료 제공자 시연 후보. 네발 자세에서 반대 팔·다리를 펴는지 전체 시청 검수 필요. 파일 다운로드·재사용 허가 미확인. |
| 데드버그 / dead | [Sports Lab](https://www.sportslab.com.au/sports-lab-rehab-exercises-dead-bug), [SMH RENEW](https://www.smhrenew.com/exercise-videos/core-bw) | SMH가 페이지에서 직접 제공한 MP4를 검토용으로 다운로드함. 반대 팔·다리 시연이 있으나 [프로그램 정책](https://www.smhrenew.com/policies-and-procedures)은 무단 자료 사용을 금지하므로 앱에 탑재하지 않음. |

## 다운로드 검토 중 제외한 자료

- [DVIDS Prone T Drill](https://www.dvidshub.net/video/697874/prone-t-drill): Public Domain 표기와 공개 MP4가 있어 다운로드했으나, 실제 장면은 엎드렸다 일어나 콘 사이를 달리는 훈련이다. T 레이즈 대체에 부적합.
- [wger 공개 영상 API](https://wger.de/api/v2/video/?limit=200): 영상 78개와 운동명·파일별 라이선스 목록을 받았으나, 이번에 필요한 18개에 정확히 맞는 영상이 없었다. 운동 설명 항목의 존재를 영상 존재로 계산하지 않았다.
- [SeniorForm](https://www.seniorform.eu/index.php): 자체 웹사이트 사용 허용과 소스 ZIP 다운로드를 안내하지만, 페이지의 ZIP 주소 `https://www.seniorform.eu/opensource/downloads/seniorform-open-source.zip`는 확인 시 HTTP 404였다. 라이선스 명칭과 연결된 라이선스 URL도 서로 달라 활성 영상으로 채택하지 않았다.
- [MuscleWiki API FAQ](https://api.musclewiki.com/faq): 영상의 영구 저장·다운로드·재호스팅을 금지하고 있어 로컬 MP4 교체 출처에서 제외.
- Mixkit의 개인용 Restricted License 영상들은 공개 앱에서 자유롭게 재배포 가능한 Free License 영상과 구분했다. 이번에는 항목 32635의 Free License 파일만 사용했다.

## 재현과 다음 적용 조건

공식 MP4 재다운로드: `python tools/manage_media.py fetch cool2` (Mixkit은 API 키 불필요).
카탈로그 재생성: `python tools/manage_media.py refresh`.
실제 원본·다운로드 증거·검토용 프레임은 `media/pending/`에 있으며 Git에서 제외된다.

다른 출처 후보가 발견된 운동은 해당 제공자가 다운로드·앱 사용을 허용하는 파일을 제공하면 동작을 확인한 뒤 추가할 수 있다. 정확한 3:1 맨몸 템포 스쿼트는 별도 확보·제작이 남아 있다. 이번 검색 결과를 18개 모두 확보 완료로 표시하지 않는다.
