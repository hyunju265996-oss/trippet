# 고용24 개선안 · KRDS 실습 프로토타입 (HTML)

Figma `KRDS_실습(진현주)` 의 플로우 5화면을 정적 HTML로 옮긴 배포용 버전입니다.
빌드 도구 없이 이 폴더를 그대로 정적 호스팅(GitHub Pages 등)에 올리면 됩니다.

| 화면 | 주소 |
| --- | --- |
| 01 메인 | `index.html#/` |
| 02 K-디지털 훈련 목록 | `index.html#/list` |
| 04 훈련과정 상세 | `index.html#/detail` |
| 05 수강신청 확인 (팝업) | 상세 화면의 **수강신청** 버튼 |
| 06 수강신청 완료 | `index.html#/done` |

`main`에 머지되면 GitHub Pages 주소는 `https://hyunju265996-oss.github.io/myapp/krds/` 입니다.

## 피그마 프로토타입에서 그대로 옮긴 동작

| 요소 | 피그마 설정 | 구현 |
| --- | --- | --- |
| 메인 배경 그라데이션 | 3단계 변형, 2.5초 대기 후 Smart Animate 2.5초 ease-in-out, 반복 | CSS keyframes 15초 루프 |
| 카드뉴스 캐러셀 | 7장, 자동재생 3초(0.8초 전환), 이전/다음 0.6초, 일시정지, 3D 원형 배치 | `perspective 1400px` + 슬롯별 `translateZ/rotateY/scale` |
| 캐러셀 「K-디지털 훈련」 카드 | 클릭 → 목록 | `#/list` 이동 |
| 고용정책 카드 | Mouse enter → 8px 위로 + 그림자 0.18초, 아이콘 3° 흔들림 후 복귀 | `:hover` transition + 아이콘 keyframes |
| 목록 과정 카드 | Hover → 5px `#3f58d4` 테두리 + 그림자, 클릭 → 상세 (Move in · 아래에서 0.3초 ease-in) | `:hover` + 페이지 전환 애니메이션 |
| 상세 「수강신청」 | Overlay 팝업 Dissolve 0.3초 | 모달 (ESC/닫기/취소, 포커스 트랩) |
| 팝업 「수강신청」 | → 완료 화면 Dissolve 0.25초 | 입력 검증 후 `#/done` |
| 상세 「과정 자세히 보기」 | 변수 컬렉션 `Switch` › BOOLEAN `펼침매뉴가펼쳐졌나요?` (기본 false)를 `NOT`으로 토글. 이 변수에 묶인 「펼침」 인스턴스가 True면 훈련과정 안내 패널(탭·개요·NCS·교재·강사·시설), False면 40px 빈 영역 | `app.js`의 `vars['펼침매뉴가펼쳐졌나요?']` → `#moreMenu` 표시/숨김, `aria-expanded` |
| 펼침 패널 「NCS 이수체계도 연계과정 펼치기」 | 208px로 잘린 표 + 펼치기 버튼 | 펼치기/접기 |
| 상세 「관심정보 등록」 | (피그마 동작 없음) | `aria-pressed` 토글 (추가) |
| 위로 버튼 | Scroll to 0.74초 | 부드러운 스크롤 |
| 메인 탭바 | 탭 클릭 시 선택 상태 변경 | 탭 선택 |

## 다국어 (i18n)

헤더 `header_templet__pc` 의 **language** 메뉴에서 한국어 · English · 中文 · 日本語 를 고를 수 있습니다.
선택한 언어는 브라우저에 기억되고, `?lang=en` 처럼 주소로 지정할 수도 있습니다.

- **문자열 분리**: 화면 문구는 HTML/JS에 하드코딩하지 않고 `locales/{ko,en,zh,ja}.json` 에 있습니다.
  키는 역할과 위치를 드러냅니다. 예: `list.card.wish`, `apply.error.phone`, `toast.wishAdded`.
- **로케일**: `ko-KR`, `en-US`, `zh-CN`, `ja-JP` (`meta.locale`). `<html lang>` 도 함께 바뀝니다.
- **변수 치환**: `"{start} ~ {end} ({round}회차)"` 처럼 문장 단위로 번역하고 `{name}` 자리표시자를 씁니다. 어순이 다른 언어도 문장째 번역됩니다.
- **복수형**: `Intl.PluralRules` 로 `key.one` / `key.other` 를 고릅니다 (예: `You saved 1 course` / `2 courses`).
- **날짜·숫자·통화**: `format.date` (`YYYY-MM-DD`, `MM/DD/YYYY`, `YYYY/MM/DD`), `Intl.NumberFormat`, `format.currency` (`181,500 원`, `₩181,500`, `181,500 韩元`, `181,500 ウォン`).
- **텍스트 길이 대비**: 버튼·탭·칩은 고정 폭 대신 `min-width` + 패딩(Hug), 말줄임 없음. 좁은 화면(390~402px)에서는 세로 흐름으로 바뀌어 겹치지 않습니다.
- **글꼴**: 중국어·일본어 선택 시 Noto Sans SC / JP 를 필요할 때만 불러옵니다.

문구를 고칠 때는 JSON만 수정하면 됩니다. `index.html` 을 파일로 바로 열 때(`file://`)를 위한 `locales/bundle.js` 는
JSON을 고친 뒤 아래 명령으로 다시 만들어 주세요.

```bash
node scripts/build-locales.mjs
```

## 원본에서 바꾼 부분 (문제 소지가 있는 정보만)

- 로고: 정부 상징(태극 엠블럼) → 실습용 중립 로고(`assets/logo-mark.svg`). 상단 공지의 태극기 아이콘 → 안내 아이콘.
- 전화번호·이메일·주소·URL: 예시 값으로 교체 (`070-0000-0001`, `itcampus@example.com`, `서울특별시 OO구 OO로 00`, `https://example.com`, 푸터 `@example.com`).
- 실제 기관명: `(주)모두의연구소` → `(주)예시디지털연구소`, `한경닷컴IT교육센터` → `예시IT교육센터`, `라인원격평생교육원` → `예시원격평생교육원`, `서울남부고용` → `OO고용센터(예시)`.
- 저작권 문구: 행정안전부 표기 → `© 2026 KRDS 실습 프로젝트`.

디자인 시스템(KRDS 색·간격·반경·글꼴 토큰)은 피그마 변수 값을 그대로 `styles.css` 의 `:root` 에 옮겼습니다.

## 파일 구성

```
krds/
├── index.html          # 5개 화면 + 헤더/푸터/모달
├── styles.css          # KRDS 토큰 + 화면 스타일 + 반응형
├── i18n.js             # 번역 런타임 (치환·복수형·날짜/통화)
├── app.js              # 라우팅, 캐러셀, 목록, 모달, 언어 메뉴
├── locales/            # ko.json · en.json · zh.json · ja.json (+ bundle.js)
├── scripts/build-locales.mjs
└── assets/             # 피그마에서 내려받은 아이콘·이미지
```
