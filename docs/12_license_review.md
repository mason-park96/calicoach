# 운동 시연 영상 권리 검토 기록 — 2026-10-27

## 사용자 프로젝트 범위

- 칼리코치 개인용 체력·운동 앱, 3명, 수익 없음.
- 현재 GitHub Pages 저장소가 Public이며 URL 공개 접근이 가능함.
- 따라서 비상업적이라는 조건은 NC 라이선스 채택 가능성을 높이지만, 영상 다운로드·재가공·공개 게시 권리가 자동으로 생기지는 않음.

## 검토한 소스

| 공급원 | 개인/비상업적 사용 | 앱 삽입 | 필요한 조치 |
|---|---|---|---|
| Pexels License | 허용 | 허용 | 스톡 서비스 식의 단독 재게시 피함, 인물·브랜드 권리 주의, 크레딧 권장 |
| Pixabay Content License | 허용 | 허용 | 원본만 독립적으로 배포하는 행위 금지 등 약관 확인 |
| Wikimedia PD 파일 | 대체로 자유로움 | 가능 | 파일별 법역/상태 확인, 출처 표시 권장 |
| Wikimedia CC BY | 허용 | 가능 | 저작자, 원본 URL, 라이선스 링크, 변경 여부 표시 |
| Wikimedia CC BY-SA | 허용 | 가능 | 위와 같으며 재가공 영상의 공유 조건 준수 |
| Wikimedia CC BY-NC | 개인 비상업적 조건에 부합할 가능성 | 가능할 수 있음 | 파일별 라이선스, 비상업적 범위 및 표시 요건 확인 |
| 출처 불명 운동 영상 데이터셋 | 미확인 | 불권장 | 데이터셋 코드 라이선스는 미확인 영상 권리를 해결하지 못함 |

## 공식 출처

- https://www.pexels.com/license/
- https://www.pexels.com/api/documentation/
- https://help.pexels.com/hc/en-us/articles/900005880463-What-are-the-Terms-and-Conditions
- https://pixabay.com/service/license-summary/
- https://creativecommons.org/licenses/by/4.0/
- https://creativecommons.org/licenses/by-sa/4.0/
- https://creativecommons.org/licenses/by-nc/4.0/

## 소스별 동작 일치 검토

Pexels 후보는 공개 영상 제목 및 설명을 바탕으로 선택했습니다. 여기서 이름이 일치하는 것과 프레임·세트 동작이 실제로 일치하는 것은 별개입니다. 원본 영상 11개를 직접 재생해 프레임 단위로 검수하지 못했으므로 11개 모두 `manual_review_required`로 표기했습니다.

검수 후 승인한 파일에 대해서는 Pexels 링크와 저작자를 `video-catalog.js`에 보존합니다. 원본을 변경할 경우 개인 기획서에 수정 내역과 날짜를 함께 기록하세요.
