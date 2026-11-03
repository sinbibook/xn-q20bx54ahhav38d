# Data Mapping 정의서 — t-template-J

`standard-template-data.json` 기준 HTML의 `data-*` 속성 매핑 정의.

원본 디자인: [gyeongjucaravan.co.kr](https://gyeongjucaravan.co.kr/) (정본) / 동일 계열 대조: [개울가풀빌라.kr](https://xn--o39a2bz89bkzg7kl3yu.kr/)

두 사이트는 같은 트립일레븐/makehome 원본의 동일 디자인이다.
`reset.css` 는 디스플레이 서체 `@font-face` 한 블록만 다르고, `custom.js` 는 `roundLengths: true`
6줄만 다르다. `style.css` 는 1017 / 1019줄에 diff 145줄(실질 변경 약 25곳)뿐이고,
9개 페이지 골격은 **한 줄도 다르지 않다** — diff 는 전부 객실·스페셜 반복 개수 차이다.

갈리는 축은 **브랜드 포인트 색 하나**(용천수 `#59812a` / 개울가 `#b2874e`)와
**디스플레이 서체 두 축**이다(아래 「테마 색상/폰트」 참고).

정본은 **용천수카라반** 으로 삼는다. 객실이 9실·부대시설이 9개라 목록·슬라이더 패턴이 풍부하고,
Swiper 도 8.4.7 로 더 최신이다.

베이스 인프라는 **t-template-I** 에서 가져왔다. 특징 셀렉터 15개로 기존 13개 템플릿을 대조했을 때
D2 / E2 / G / I 가 10/15 동률이었는데, 이 넷의 `preview-handler` / `image-helpers` / `popup` /
`kakao-maps-sdk` / `header-footer-loader` 는 **해시가 전부 동일**했고 갈리는 `base-mapper.js` 가
I 쪽이 최신이었다.
**I(jd38)의 디자인은 한 줄도 가져오지 않았다** — CSS·마크업·UI 스크립트는 전부 용천수 원본이다.

## 진행 현황

| 구분   | 파일                                                                    | 상태               |
| ------ | ----------------------------------------------------------------------- | ------------------ |
| 공통   | `styles/theme.css` (토큰 5개)                                           | 완료               |
| 공통   | `styles/reset.css` (원본 이식 + 토큰화)                                 | 완료               |
| 공통   | `styles/style.css` (원본 전체 이식 + 토큰화)                            | 완료               |
| 공통   | `styles/popup.css`                                                      | 공통본 그대로      |
| 공통   | `js/` 인프라                                                            | I 복사본 + J 대응  |
| 공통   | `common/header.html` + `common/footer.html` + `header-footer-mapper.js` | 완료               |
| 공통   | `js/common.js` (원본 `custom.js` UI 동작 + `TplSwiper`)                 | 완료               |
| 페이지 | `index.html` + `index-mapper.js` + `pages/index.js`                     | 완료               |
| 페이지 | `main.html` + `main-mapper.js` + `pages/main.js`                        | 완료               |
| 페이지 | `layout-map.html` + `layout-map-mapper.js` + `pages/layout-map.js`      | 완료               |
| 페이지 | `room.html` + `room-mapper.js` + `pages/room.js`                        | 완료               |
| 페이지 | `facility.html` + `facility-mapper.js` + `pages/facility.js`            | 완료               |
| 페이지 | `reservation.html` + `reservation-mapper.js`                            | 완료               |
| 페이지 | `nearby-attractions.html` + `nearby-attractions-mapper.js`              | 완료               |
| 페이지 | `directions.html` + `directions-mapper.js`                              | 완료               |
| 페이지 | `404.html`                                                              | 공통본 그대로 사용 |

---

## 원본 페이지 → 템플릿 파일명

| 원본 (gyeongjucaravan.co.kr) | 템플릿                    | 데이터 소스                                  |
| ---------------------------- | ------------------------- | -------------------------------------------- |
| `index.html`                 | `index.html`              | `pages.index.sections[0]`                    |
| `about.html` + `view.html`   | `main.html` (병합)        | `pages.main.sections[0]`                     |
| `room.html` 목록             | `layout-map.html`         | `pages.layoutMap.sections[0]`                |
| `room.html?room_id=`         | `room.html?room_id=`      | `pages.room[]` + `roomtypes[]` + `rooms[]`   |
| `special1~9.html`            | `facility.html?id=`       | `property.facilities[]`                      |
| `reservation.html`           | `reservation.html`        | `pages.reservation.sections[0]` + `property` |
| `travel.html`                | `nearby-attractions.html` | `pages.nearbyAttractions.sections[0]`        |
| `traffic.html`               | `directions.html`         | `pages.directions.sections[0]` + `property`  |
| —                            | `404.html`                | 공통본                                       |

원본 객실 id 참고 — 용천수: `33726~33734` (9실) / 개울가: `32138~32140` (3실).
원본 시설 — 용천수 `special1~9` (9개) / 개울가 `special1~5` (5개).

---

## 구현 원칙

A/B/C2/D2/E2/G/H/I 와 동일하다.

- 파일명과 JS 구조는 우리 템플릿 구조를 따른다. 원본 `about.html`, `view.html`,
  `special1~9.html`, `travel.html`, `traffic.html` 파일명은 쓰지 않는다.
- 페이지 링크는 GitHub Pages 하위 경로 배포를 위해 상대경로(`./xxx.html`)만 쓴다.
- 이미지·아이콘 등 템플릿 고정 에셋은 `images/` 에 둔다. 원본 도메인(`/assets/...`) 직접 참조 금지.
- **로고는 고정 저장하지 않는다.** `homepage.images[0].logo[isSelected]` → 숙소명 텍스트 →
  placeholder 3단 폴백. 헤더 2곳(`.logo1` / `.logo2`) + 푸터 1곳(`.foot_logo`) + 파비콘이 같은 값을 쓴다.
- **객실 목록의 단일 소스는 `homepage.customFields.roomtypes`** 다. 최상위 `rooms[]` 는
  `roomtypes[i].id === rooms[j].id` 매칭으로 **상세값을 조회할 때만** 쓴다.
- 각 페이지 mapper 는 `js/preview-handler.js` 의 `mapperConfig` 에 등록한다. 초기화 주체는
  `preview-handler` 이고, 페이지 매퍼의 `DOMContentLoaded` 핸들러는 `if (window.previewHandler) return;` 로 빠진다.
- **렌더 게이트**: 각 HTML `<head>` 에 `html.tpl-loading body{opacity:0}` + `window.__tplReveal`(3초 타임아웃)을 둔다.
- **원본의 장식용 하드코딩 텍스트는 그대로 둔다.** 모든 영역을 매핑하지 않는다.
- **원본에서 주석 처리된 블록은 가져오지 않는다.** (아래 「원본에서 가져오지 않은 것」 참고)
- 값이 비어 있으면 `firstText()` / `cleanText()` 가 `trim()` 후 판단해 다음 폴백으로 넘어간다.
- Swiper 초기화는 `TplSwiper.init()` / `initVisual()` / `initRoomList()` 를 거친다.

### 문구 매핑 1순위는 항상 `customFields`

각 페이지의 제목·설명 슬롯은 **`pages.{page}.sections[0]` 의 값이 1순위**이고,
비어 있을 때만 원본 문구(+숙소명)를 기본값으로 쓴다.

| 페이지               | 슬롯                       | 1순위                                  | 폴백                                      |
| -------------------- | -------------------------- | -------------------------------------- | ----------------------------------------- |
| `index`              | 히어로 대제목 / 리드       | `hero.title` / `description`           | 숙소명 / `Welcome To {영문 숙소명}`       |
| `index`              | 객실 미리보기 리드         | `essence.description/title`            | `{숙소명}의 객실을 소개합니다.`           |
| `index`              | 스페셜 포인트 리드         | `signature.description/title`          | `{숙소명}의 스페셜 포인트를 …`            |
| `index`              | 예약 배너 2줄              | `closing.description/title`            | `Welcome To …` / `Make your Stay …`       |
| `index`              | 둘러보기 리드              | `gallery.description/title`            | `{숙소명} 내·외부 둘러보기`               |
| `main`               | `.title_box` 제목 / 설명   | `hero.title` / `description`           | `펜션소개` / `{숙소명}에 오신 것을 …`     |
| `main`               | 소개 블록 영문 리드 / 본문 | `about[].title/description`            | `About {영문명}` / `property.description` |
| `layout-map`         | `.main_room` 제목 / 설명   | `hero.title` / `description`           | `객실 미리보기` / `{숙소명}의 객실을 …`   |
| `room`               | (문구 슬롯 없음)           | —                                      | 객실명·구조는 `roomtypes[]`/`rooms[]`     |
| `facility`           | 시설명 / 영문명 / 소개문   | `facilities[].name/nameEn/description` | 없음                                      |
| `reservation`        | `.title_box` 제목 / 설명   | `hero.title` / `description`           | `이용안내` / `예약시 참고하실 …`          |
| `nearby-attractions` | `.title_box` 제목 / 설명   | `hero.title` / `description`           | `주변여행지` / `펜션 근처의 주요 …`       |
| `directions`         | `.title_box` 제목 / 설명   | `hero.title` / `description`           | `오시는 길` / `{숙소명}에 찾아오시는 …`   |
| `directions`         | 교통 안내 제목 / 본문      | `notice.title/description`             | `대중교통 이용시`                         |

**배정할 블록이 없어 하드코딩으로 남긴 자리**는 다음과 같다. 모두 섹션 라벨·영문 장식 문구이고
본체는 `facilities[]` / `roomtypes[]` / `property` 가 채운다.

- 모든 페이지의 `.title_box span` 눈썹 (`ROOMS PREVIEW` / `SPECIAL POINTS` / `ABOUT` / `LOCATION` …)
- 모든 서브 히어로의 `h3` (`ABOUT` / `ROOMS PREVIEW` / `LOCATION` / `RESERVATION` / `TRAVEL` / `SPECIAL`)
  — 페이지 이름이라 데이터로 뺄 값이 아니다
- 서브 히어로의 둘째 줄 (`{숙소명} 찾아오시는 길` / `{숙소명} 객실 미리보기` / `{숙소명} 이용안내` …)
  — 숙소명만 끼워 넣는 고정 문형이다
- `index` / `room` / `layout-map` 의 `.main_room .title_box h3` (`객실 미리보기`)
- `index` 의 `.main_special .ps_txt` (`Special Points`, Alex Brush 배경 장식)
- `index` / `main` 의 `.main_wide_bg strong` (`Make your Stay Even Better`) — **두 원본이 완전히 동일**
- `room` 의 표 머리글 5개(`객실명 / 기준 / 최대 / 유형 / 평형`)와 `집기품목` 라벨
- `reservation` 의 `이용안내` / `환불정보` dt 라벨
- `directions` 의 `자가용 이용시` dt 와 `네비게이션에 주소를 검색해주세요.` 리드

### 매핑하지 않은 `customFields` 필드

배정할 자리가 원본 마크업에 없어 읽지 않는 값이다. **의도된 미사용**이다.

| 필드                                                       | 이유                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| 전 페이지 `mediaType` / `videos`                           | 원본에 비디오 영역이 없다 (`.vimeoWrap` CSS 는 있으나 미사용)       |
| `index.essence.images` / `signature.images`                | 두 섹션의 본체가 `roomtypes[]` / `facilities[]` 라 사진 자리가 없다 |
| `layoutMap.about.title` / `description`                    | 배치도 이미지 옆에 글을 놓을 자리가 없다                            |
| `reservation.about.title` / `description`                  | dt/dd 가 `이용안내` / `환불정보` 고정 라벨이다                      |
| `room.hero.title/description`, `gallery.title/description` | 원본 객실 상세 히어로에 `.txt_box` 가 없다                          |
| `pages.facility[]` 전체 (`hero` / `about` / `experience`)  | 내용을 전부 `property.facilities[]` 에서 읽는다 (I 와 동일)         |

---

## 공통 — 헤더 / 푸터

`common/header.html` · `common/footer.html` 을 `js/header-footer-loader.js` 가 fetch 로 주입하고,
`header-footer-mapper.js` 가 `headerFooterLoaded` 이벤트에서 매핑한다.

| 슬롯                                               | 데이터                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `[data-logo-image]` / `.logo_text` / `.logo_sub`   | `homepage.images[0].logo[isSelected]` → 숙소명 → placeholder       |
| `link[rel=icon]`                                   | 같은 로고 URL (없으면 그대로 둔다)                                 |
| `[data-property-name]` / `[data-property-name-en]` | `customFields.property.name` → `property.name` / 영문명 체인       |
| `[data-rooms-submenu]`                             | `roomtypes[]` (그룹이 있으면 그룹명으로 접는다)                    |
| `[data-special-submenu]`                           | `property.facilities[]` (displayOrder 순)                          |
| `[data-special-menu]`                              | 시설 0개면 SPECIAL 메뉴째 숨김                                     |
| `[data-menu-id="layout-map"]`                      | `pages.layoutMap.sections[0].enabled === false` 면 숨김            |
| `[data-rooms-link]`                                | 대메뉴 ROOMS — 위 값 켜짐 → `layout-map.html` / 꺼짐 → 첫 객실 상세 |
| `[data-travel-menu]`                               | `pages.nearbyAttractions…enabled === false` 면 숨김                |
| `[data-booking-link]`                              | `property.realtimeBookingId` (URL 로 보일 때만 링크)               |
| `[data-ybs-button]` / `[data-ybs-wrap]`            | `property.ybsId` (없으면 줄째 숨김)                                |
| `[data-homepage-socialLinks-blog]`                 | `homepage.socialLinks.blog` — 헤더 네이버 버튼 (없으면 숨김)       |
| `[data-homepage-socialLinks-instagram]`            | `homepage.socialLinks.instagram` — 헤더 인스타 버튼 (없으면 숨김)  |
| `[data-footer-property-name]`                      | 숙소명                                                             |
| `[data-footer-address]`                            | `property.address` → `businessInfo.businessAddress`                |
| `[data-footer-representative]`                     | `businessInfo.representativeName`                                  |
| `[data-footer-business-number]`                    | `businessInfo.businessNumber`                                      |
| `[data-footer-phone]` / `[data-footer-phone-link]` | `property.contactPhone[]` — 번호 수만큼 링크를 복제해 `\|` 로 구분 |

- 전화번호는 **`contactPhone` 배열**을 쓴다. `businessInfo.businessPhone` 은 쓰지 않는다.
- 푸터의 값 슬롯은 값이 비면 `<p>` 줄째 숨긴다 (`대표자 :` 만 남는 빈 줄 방지).
- 헤더 `.hd_right` 의 네이버 N 로고 버튼은 원본(오리온풀빌라 · 아라뜰한옥펜션)과 같이 예약하기 앞에
  둔다. 원본 링크는 네이버 플레이스 주소이고 어드민 **blog** 칸에 넣어 쓴다. 크기는 원본 그대로 img
  인라인 style(40×40, `margin-right: 10px`), PC·모바일 동일. 마크업은 `.hidden-social-link`(숨김) 로
  시작하고 `mapSocialLinks()` 가 값이 있을 때만 `href` 를 넣고 클래스를 뗀다(`null`·빈 문자열·키 없음
  → 숨김). 매퍼는 `facebook / instagram / blog / youtube` 4종을 처리하고 J형 헤더 마크업은 blog·instagram 두 개다.
- 인스타그램 버튼은 기준 사이트 헤더에 없어서 네이버 버튼 바로 뒤에 같은 구조(`span.for_t > img`, 40×40,
  `margin-right: 10px`)로 둔다. 로고 `images/insta_logo.png`(122×126) 를 40×40 으로 줄여 쓴다.
- 어드민 프리뷰 `section_update` 의 `section === 'socialLinks'` 는 `pages[page].sections[0]` 이 아니라
  `homepage.socialLinks` 에 반영하고 헤더 버튼만 다시 매핑한다.
- 원본 ABOUT 서브메뉴는 `카라반소개 / 외경보기 / 오시는길` 3개였다. 앞 둘이 `main.html` 로
  병합됐으므로 `펜션소개 / 오시는길` 2개로 줄였다. 페이지 안의 `.sub_cate_wrap` 탭도 같다.

---

## 페이지별 매핑

### index.html

| 슬롯                               | 데이터                                                        |
| ---------------------------------- | ------------------------------------------------------------- |
| `[data-index-hero-title]`          | `hero.title` → 숙소명                                         |
| `[data-index-hero-description]`    | `hero.description` → `Welcome To {영문명}`                    |
| `[data-index-hero-slides]`         | `hero.images` → `property.images[0].thumbnail`+`exterior`     |
| `[data-index-room-description]`    | `essence.description/title` → `{숙소명}의 객실을 소개합니다.` |
| `[data-index-room-list]`           | `roomtypes[]` (`renderRoomSlides`)                            |
| `[data-index-special-section]`     | 시설 0개면 섹션째 숨김                                        |
| `[data-index-special-description]` | `signature.description/title` → 원본 문장                     |
| `[data-index-special-list]`        | `property.facilities[]` (`renderSpecialCards`)                |
| `[data-index-closing-bg]`          | `closing.images` → `gallery` → `hero` → property 외경         |
| `[data-index-closing-description]` | `closing.description` → `Welcome To {영문명}`                 |
| `[data-index-closing-title]`       | `closing.title` → `Make your Stay Even Better`                |
| `[data-index-look-section]`        | 사진 0장이면 섹션째 숨김                                      |
| `[data-index-look-description]`    | `gallery.description/title` → `{숙소명} 내·외부 둘러보기`     |
| `[data-index-look-list]`           | `gallery.images` → property 외경/공용/주변 → 시설 대표 사진   |

**섹션 배정** — `hero`→히어로 / `essence`→객실 리드 / `signature`→스페셜 리드 /
`closing`→예약 배너 / `gallery`→둘러보기. 5개 블록을 전부 쓴다.

⚠️ `.main_look` 은 원본 CSS 가 1번째 칸만 50%/600px, 나머지를 25%/295px 로 깔아 **5칸을 전제**한다.
매퍼가 5장으로 자른다. 칸 라벨은 이미지의 `description` 이고, 없으면 hover 오버레이를 만들지 않는다.

### main.html — 원본 `about.html` + `view.html` 병합

| 슬롯                              | 데이터                                                         |
| --------------------------------- | -------------------------------------------------------------- |
| `[data-main-hero-slides]`         | `hero.images` → property 외경 (풀높이 `.main_visual` 슬라이더) |
| `[data-main-visual-description]`  | `{숙소명}을 소개합니다.` (조사 `withJosa`)                     |
| `[data-main-hero-title]`          | `hero.title` → `펜션소개`                                      |
| `[data-main-hero-description]`    | `hero.description` → `{숙소명}에 오신 것을 환영합니다.`        |
| `[data-main-about-blocks]`        | `about[]` — 블록마다 `.{k}_top` + `.{k}_bnr` 생성              |
| `[data-main-closing-bg]`          | 소개 블록이 쓰고 남은 property 외경 사진                       |
| `[data-main-closing-description]` | `Welcome To {영문명}` (하드코딩)                               |

**히어로는 원본 `view.html` 의 `.main_visual.visual`** 이다. 풀높이(100vh) 슬라이더로 원본은
외경 사진 15장이 순서대로 돈다. `.sub_visual`(500px 단일 배경)이 아니다.
문구만 `ABOUT` + 숙소명으로 바꿨다 — 이 페이지는 외경보기가 아니라 펜션소개로 병합된 자리다.

**소개 블록**은 `about[]` 하나가 `큰 사진 1장 + 글`(`.{k}_top`) + `작은 사진 3칸`(`.{k}_bnr`)이다.
원본 두 페이지의 CSS 가 **좌우 반전 쌍**이라 블록 순서대로 번갈아 쓴다.

- `about[0]` → `.about_top` / `.about_bnr` — 사진 **왼쪽**, 회색 판 오프셋, bnr 홀수칸이 아래로
- `about[1]` → `.view_top` / `.view_bnr` — 사진 **오른쪽**, 테두리 오프셋, bnr 짝수칸이 아래로
- `about[2]` → 다시 `about_*` (교대 반복)

⚠️ `.{k}_bnr` 은 32%×3 고정 CSS 다. 큰 사진까지 합쳐 4장이 안 되면 `<ul>` 을 만들지 않는다.
⚠️ 클로징 배경은 소개 블록이 쓴 사진을 피해서 고른다. **히어로 슬라이드는 그 판정에서 뺀다** —
히어로가 외경을 통째로 쓰는 일이 흔해(원본도 15장 전부) 포함시키면 남는 사진이 없다.

### layout-map.html — 원본 `room.html` 목록

| 슬롯                                  | 데이터                                               |
| ------------------------------------- | ---------------------------------------------------- |
| `[data-layoutmap-hero]`               | `hero.images` → 객실 썸네일 첫 장 → property 외경    |
| `[data-layoutmap-visual-description]` | `{숙소명} 객실 미리보기`                             |
| `[data-layoutmap-room-nav]`           | `roomtypes[]` (`renderRoomNav`, `currentId` 없음)    |
| `[data-layoutmap-title]`              | `hero.title` → `객실 미리보기`                       |
| `[data-layoutmap-description]`        | `hero.description` → `{숙소명}의 객실을 소개합니다.` |
| `[data-layoutmap-room-slides]`        | `roomtypes[]` (`renderRoomSlides`)                   |
| `[data-layoutmap-images]`             | `about.images` — 배치도. 없으면 **placeholder 유지** |

`sections[0].enabled === false` 면 `404.html` 로 리다이렉트한다(백오피스 preview 제외).
헤더의 `미리보기` li 도 같은 기준으로 숨는다.

**대메뉴 `ROOMS`(`[data-rooms-link]`)는 이 값에 따라 이동처가 갈린다.** — `getRoomsEntryLink()`

| `layoutMap` | ROOMS 클릭 시                                     |
| ----------- | ------------------------------------------------- |
| 켜짐        | `layout-map.html` (객실 배치도)                   |
| 꺼짐        | 첫 번째 객실 상세 (헤더 객실 메뉴 첫 항목과 같음) |

꺼진 상태에서 그대로 두면 `layout-map.html` 이 404 로 튕긴다. 판정은 이 페이지의 404 기준과 같은
`isLayoutMapEnabled()`(섹션 없음 / `enabled:false` → 꺼짐)를 쓴다. 객실이 하나도 없으면 원래 href 를 둔다.
`room.html` 의 객실 탭 첫 칸 `미리보기` 도 꺼져 있으면 숨긴다.

**배치도**는 원본 `room.html` 맨 아래 `.layout_img` 다(두 사이트 모두 `room/layout.webp` 한 장).
숙소에 따라 동/층별 여러 장이 올 수 있어 순서대로 세로로 쌓는다.
⚠️ 비어도 영역을 유지하고 placeholder 를 세운다 — 이 페이지 이름이 가리키는 본 목적이다.
(`room.html` 의 평면도는 부가 정보라 반대로 영역째 숨긴다)

### room.html — 원본 `room.html?room_id=`

| 슬롯                                                       | 데이터                                                |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| `[data-room-hero-slides]`                                  | `pages.room[].hero.images` → 객실 인테리어/썸네일     |
| `[data-room-nav]`                                          | `renderRoomNav(…, currentId)` — 그룹 안이면 펼침      |
| `[data-room-name]`                                         | 객실명 (`roomtypes[].name` → `rooms[].name`)          |
| `[data-room-structure]`                                    | `rooms[].roomStructures[0]` + `totalRoomCount`        |
| `[data-room-notice]`                                       | `rooms[].roomInfo` → `usageGuide` → 원본 문장         |
| `[data-room-base-occupancy]` / `[data-room-max-occupancy]` | `rooms[].baseOccupancy` / `maxOccupancy`              |
| `[data-room-size]`                                         | `rooms[].sizePyeong` → `size`(㎡) 환산, **항상 `평`** |
| `[data-room-amenities]`                                    | `rooms[].amenities[]` → `집기품목 : …`                |
| `[data-room-detail-images]`                                | `pages.room[].gallery.images` → 객실 사진             |
| `[data-room-floorplan]` / `[data-room-floorplan-images]`   | 이미지 카테고리 `floor_plan` — 없으면 영역째 숨김     |
| `[data-room-list-description]`                             | `{숙소명}의 객실을 소개합니다.` (하드코딩)            |
| `[data-room-list-slides]`                                  | `roomtypes[]` (`renderRoomSlides`)                    |

**객실 그룹** — `roomtypes[].groupName` 이 하나라도 있으면 그룹 모드다.

- 헤더 ROOMS 서브메뉴 / `layout-map` 탭 → **그룹명으로 접힌 목록**
- 미리보기 카드(`renderRoomSlides`) → 그룹과 무관하게 **항상 전체 객실**. 카드마다 자기 객실 상세로 연결한다
- 그룹 항목 클릭 → 그 그룹의 **첫 객실 상세**로 이동
- 그 상세의 `.sub_cate_wrap` 탭 → **그 그룹의 객실만** 펼친다. 다른 그룹은 섞지 않는다
  (그룹명과 객실명이 나란히 놓이면 부모/자식이 형제처럼 보인다)
- 멤버가 1실인 그룹은 펼치지 않는다
- 상세 페이지의 `h4` 제목은 **객실명**이다. 그룹명이 아니다

**평면도**는 `getRoomFloorplanImages()` 가 `floor_plan` / `floorplan` / `roomtype_floorplan` /
`room_floorplan` 카테고리를 본다. 없으면 제목까지 `display:none` 으로 숨기고,
**일반 객실 사진으로 폴백하지 않는다** — 평면도 자리에 인테리어 사진이 들어가면 잘못된 정보다.
이 블록은 정본(용천수)에 없고 대조본(개울가)의 room 상세에만 있어 CSS 도 개울가에서 가져왔다.

**객실 사진**은 원본이 `ul(2칸 420px) + div(1칸 550px) + ul(3칸 250px)` = **6장 고정**이다.
두 원본의 객실 12개(용천수 9 + 개울가 3)가 **예외 없이 6장**이다 — 객실마다 사진이 13~26장씩
있는데도 여기엔 6장만 골라 넣고 나머지는 히어로 슬라이더가 보여준다.
매퍼도 앞에서부터 `DETAIL_MAX`(=6)장만 쓴다. 넘치는 만큼 덩어리를 반복하면 원본에 없는 길이가
된다(18장이면 세로 4000px). CSS 가 `ul:nth-of-type(1)/(2)` 로 칸 크기를 나누는 것도 같은 전제다.
6장 미만이면 빈 칸이 안 생기게 줄인다 — 2장이면 윗줄만, 1장이면 큰 사진만.

⚠️ 이 페이지의 탭만 `.inner` 가 아니라 `.sub_inner` 를 쓴다(원본 그대로). `.sub_inner` 는 CSS 가
없어 폭 제한이 걸리지 않는다 — 객실이 많은 숙소에서 탭이 넓게 퍼지라고 둔 것이다.

### facility.html — 원본 `special1~9.html` 병합

| 슬롯                            | 데이터                                        |
| ------------------------------- | --------------------------------------------- |
| `[data-facility-hero-slides]`   | `facilities[i].images` 전체                   |
| `[data-facility-nav]`           | `property.facilities[]` (displayOrder 순)     |
| `[data-facility-name]`          | `facilities[i].name` → `nameEn`               |
| `[data-facility-caption]`       | `facilities[i].nameEn` (한글명과 같으면 숨김) |
| `[data-facility-image]`         | `images[0]` — 없으면 placeholder              |
| `[data-facility-description]`   | `description` + (한 줄 띄고) `usageGuide`     |
| `[data-facility-bottom-images]` | `images[1]`, `images[2]` — 2칸 고정           |

내용은 **전부 `property.facilities[]`** 에서 온다. `pages.facility[]` 는 읽지 않는다(I 와 동일).
`?id=` 없이 들어오면 첫 시설, 잘못된 id 면 `404.html`(백오피스 preview 제외).

⚠️ `.special_btm` 은 `li{width:49%}` + `li+li{margin-left:2%}` 로 **2칸 전제**다. 두 원본의 special
14개 페이지 전부 2장이다. 소개 블록이 첫 장을 쓰므로 두 번째 장부터 가져가고, 사진이 모자라면
앞에서부터 순환해 채운다. 사진이 아예 없으면 `<ul>` 째 숨긴다.

**부대시설은 크롤링으로 채울 수 없다.** 업주가 백오피스에 등록해야 화면에 나온다.
시설이 0개인 숙소를 위해 헤더 SPECIAL 메뉴(PC + aside)와 index `.main_special` 섹션을
같은 기준으로 숨긴다 — 그대로 두면 서브 0개짜리 메뉴가 남고 누르면 404 로 튕긴다.

### reservation.html — 원본 `reservation.html`

| 슬롯                                    | 데이터                                                               |
| --------------------------------------- | -------------------------------------------------------------------- |
| `[data-reservation-hero]`               | `hero.images` → `about.images` → property 외경                       |
| `[data-reservation-visual-description]` | `{숙소명} 이용안내`                                                  |
| `[data-reservation-title]`              | `hero.title` → `이용안내`                                            |
| `[data-reservation-description]`        | `hero.description` → `예약시 참고하실 사항을 …`                      |
| `[data-reservation-info-body]`          | `property.address` + `usageGuide`                                    |
| `[data-reservation-refund-body]`        | `refundPolicies[]` 문장 조립 + `refundSettings.customerRefundNotice` |
| `[data-reservation-refund-title]`       | 환불 내용이 없으면 dt/dd 두 줄을 함께 숨김                           |

⚠️ `checkInOutInfo` 를 `usageGuide` 와 함께 붙이면 안 된다. `usageGuide` 안에 이미 `[입퇴실안내]`
절이 들어 있어 같은 내용이 두 번 나온다. **`usageGuide` 가 비었을 때만** `checkInOutInfo` +
`reservationGuide` 로 대신한다.

환불 규정 문장 규칙 — 가장 이른 날짜는 `이용일 N일 이전`, 당일은 `이용일 당일`, 그 사이는
`이용일 N일 전`. 비율 100/0 은 `전액 환불` / `환불 불가`.

### nearby-attractions.html — 원본 `travel.html`

| 슬롯                               | 데이터                                              |
| ---------------------------------- | --------------------------------------------------- |
| `[data-nearby-hero]`               | `hero.images` → 첫 여행지 사진 → property 주변/외경 |
| `[data-nearby-visual-description]` | `{숙소명} 주변여행지`                               |
| `[data-nearby-title]`              | `hero.title` → `주변여행지`                         |
| `[data-nearby-description]`        | `hero.description` → `펜션 근처의 주요 관광지 …`    |
| `[data-nearby-list]`               | `about[]` → `property.nearbyAttractions[]` 폴백     |

`sections[0].enabled === false` 면 `404.html` 로 리다이렉트(백오피스 preview 제외).
헤더 TRAVEL 메뉴도 같은 기준으로 숨는다.

⚠️ 이 섹션의 `about` 은 **여행지 항목 배열**이다. `layoutMap` / `reservation` 의 `about` 은
단일 객체라 헷갈리기 쉽다(`main` 의 `about` 만 여기와 같은 배열이다).

본문 / 자료출처 / 거리 분리 규칙은 C2·D2·E2·G·H·I·L 과 같다 —
거리는 `images[0].description` 이 정본이고, 출처는 `description` 안에서 `자료출처|출처` 로 시작하는
줄을, 거리는 `펜션에서|숙소에서` 로 시작하거나 `거리` 로 끝나는 줄을 **각각 첫 매칭 하나만** 골라낸다.

⚠️ 출처와 거리를 **하나의 `<span>` 안에 `<br>` 로 잇는다.** I 계열은 `span` + `em` 두 요소라 다르다.
⚠️ 항목이 없으면 목록을 비운 채 둔다. 홀짝 li 의 사진 좌우가 교차하는 float 그리드라
빈 li 를 넣으면 다음 항목의 좌우가 뒤집힌다.

### directions.html — 원본 `traffic.html`

| 슬롯                                   | 데이터                                              |
| -------------------------------------- | --------------------------------------------------- |
| `[data-directions-hero]`               | `hero.images` → property 주변/외경/썸네일           |
| `[data-directions-visual-description]` | `{숙소명} 찾아오시는 길`                            |
| `[data-directions-title]`              | `hero.title` → `오시는 길`                          |
| `[data-directions-description]`        | `hero.description` → `{숙소명}에 찾아오시는 길을 …` |
| `[data-directions-map]` (`#kakao-map`) | `property.latitude` / `longitude`                   |
| `[data-directions-info]`               | dt/dd 2쌍 — 앞쪽 `property.address`, 뒤쪽 `notice`  |

원본은 daum roughmap **'지도 퍼가기' 스크립트**(`key` / `timestamp` 하드코딩)를 심었다.
숙소마다 다른 고유값이라 데이터로 만들 수 없어 좌표로 그리는 `js/kakao-maps-sdk.js` 로 대체했다.
퍼가기 스크립트가 만들던 높이(`mapHeight: 360`)는 CSS 로 옮겼다(모바일 280px).
좌표가 없으면 placeholder 를 세워 영역은 유지한다.

`.location_info` 는 원본이 `자가용 이용시` / `대중교통 이용시` 두 쌍이다. `notice` 는
`{title, description}` 하나뿐이라 **앞 쌍은 `property.address` 로 만들고 뒤 쌍만 `notice` 가 채운다.**
원본의 `지번 주소` 줄은 데이터에 없어 도로명 한 줄만 쓴다. 쌍이 하나도 없으면 `<dl>` 째 숨긴다.

---

## 테마 색상/폰트

`styles/theme.css` 토큰 5개. 토큰 값은 **하나씩만** 두고 폴백은 사용처에서 붙인다
(`font-family: var(--font-ko-main), 'Noto Sans KR', sans-serif`).

| 토큰                | 값 (용천수)               | 개울가                | 사용처                                    |
| ------------------- | ------------------------- | --------------------- | ----------------------------------------- |
| `--color-primary`   | `#192333`                 | 동일                  | `#footer` 배경 1곳                        |
| `--color-secondary` | `#59812a`                 | `#b2874e`             | 브랜드 포인트 **27곳**                    |
| `--font-ko-main`    | `SDSamliphopangche_Basic` | `GangwonEdu_OTFBoldA` | 한글 대제목 2곳                           |
| `--font-ko-sub`     | `'Noto Sans KR'`          | 동일                  | `reset.css` 전역 본문·폼 2 + `.ff_notokr` |
| `--font-en-main`    | `SDSamliphopangche_Basic` | `Playfair Display`    | 영문 라벨 2곳                             |

**두 원본이 갈리는 축은 색 1개 + 서체 2개**다.

`--color-secondary` 27곳 내역 — 헤더 메뉴 hover·예약버튼 8 / 푸터 정책링크 1 / `.btn_more` 4 /
`.title_box span` 1 / 객실 카드 테두리·버튼·hover 4 / 스페셜 페이지네이션·라벨 2 /
배너·예약 버튼 3 / `dt:before` 막대 4곳(`location_info` · `special_info` · `info_box` · `travel_list`).

`--font-ko-main` 2곳 — `.title_box h3`(섹션 제목) / `.visual .visual_txt strong`(index 히어로 숙소명).
업주가 입력한 한글이 그대로 들어가는 자리다.

`--font-en-main` 2곳 — `.main_visual .visual_box .txt_box h3` / `.sub_visual .txt_box h3`.
`ABOUT` `LOCATION` `RESERVATION` `TRAVEL` `SPECIAL` 처럼 **영문 대문자만** 들어간다.
정본은 한글 디스플레이와 같은 서체를 썼지만 개울가는 여기만 `Playfair Display` 다.

### 하드코딩으로 남긴 값

| 값                      | 위치                                                                           | 이유                                                               |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 무채색 15종             | 전역                                                                           | `#fff`×32 `#333`×14 `#666`×8 `#ddd`×6 `#acacac`×5 … 본문 가독성 축 |
| rgba 오버레이 8종       | 헤더·히어로·배너                                                               | 전부 검정/흰색 알파다                                              |
| `#f89725`               | `.table_default` `border-top` 1px                                              | 표 상단선. 브랜드색과 별개인 강조선이라 그대로 뒀다                |
| `#b00`                  | `.table_text li.point`                                                         | 경고 문구. 의미색이라 브랜드색을 따라가면 안 된다                  |
| `'Alex Brush', cursive` | `.ps_txt` / `.main_wide_bg strong` / `.about_pension` / `.view_pension`        | 필기체 장식 4곳. 두 원본 동일                                      |
| `'Roboto', sans-serif`  | `.title_box span` / `.visual_txt p` / `.special_list span` / `.main_wide_bg p` | 영문 눈썹 4곳. 두 원본 동일                                        |
| `'Noto Serif KR'`       | `.aside .depth1 span` / `.visual_txt` / `.ff_noto_serif` 외                    | 한글 세리프 5곳. 두 원본 동일                                      |

`styles/theme.css` 에 `GangwonEdu_OTFBoldA` `@font-face` 도 함께 넣었다 — 개울가로 갈아끼울 때
토큰 값만 바꾸면 되도록 한 것이다. `Playfair Display` 는 `reset.css` 가 이미 `@import` 하고 있다.

### CSS 정리 내역

원본에서 다음을 정리했다.

- `SDSamliphopangche_Basic` `@font-face` 가 `reset.css` 와 `style.css` 에 **중복 선언**돼 있던 것을
  `theme.css` 한 곳으로 모았다.
- `reset.css` textarea 의 `'Lato'` 는 `@import` 가 없어 **로드되지 않던 값**이라
  `--font-ko-sub` 로 통일했다.
- 빈 규칙(`{}`)과 빈 `@media` 블록을 제거했다. prettier 로 확장하고 stylelint 를 통과시켰다.

**쓰이지 않는 셀렉터 20종(71개 규칙 / 812줄)을 제거했다.** 두 원본 어느 페이지에도, 템플릿
마크업에도, 매퍼가 만드는 className 에도 없는 것들이다 — 같은 makehome 계열의 다른 변형에서
쓰던 잔여 CSS 로 보인다.

`.about_wrap` · `.about_top_all` · `.about_top_img` · `.about_top_txt` · `.about_bottom` ·
`.view_top_all` · `.view_top_img` · `.view_top_txt` · `.bottom_img` · `.bottom_mask` ·
`.bottom_tit` · `.bottom_txt_all` · `.top_tit` · `.main_about` · `.ft_kakao` ·
`.sub_title_box` · `.sub_wide_visual` · `.special_img_bnr`(로드되지도 않는 `'Homemade Apple'` 포함) ·
`.root_daum_roughmap` · `.wrap_map`(지도 퍼가기 → Kakao SDK 로 대체했다)

**남긴 것** — `.about_pension` / `.view_pension` 은 매퍼가 `kind + '_pension'` 으로 조합해 만든다.
`.bg` · `.clear` · `.dn` · `.point` · `.ff_noto_serif` · `.ff_notokr` 는 백오피스 본문이 쓸 수 있는
유틸리티라 남겼다. `styles/style.css` 2888줄 → 2548줄.

### 템플릿 추가분 (원본에 없는 규칙)

| 규칙                                                                 | 이유                                                        |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `.header .logo .logo_text` / `.logo_sub`                             | 로고가 텍스트로 폴백됐을 때 쓸 자리가 원본에 없다           |
| `#footer .foot_logo .logo_text`                                      | 같음 (20% 칸이라 20px + `word-break: keep-all`)             |
| `#footer .foot_txt span` / `.foot_tel a` / `span` → `color: inherit` | 아래 참고                                                   |
| `#footer .foot_tel` → `white-space: nowrap`                          | 칸이 240px 뿐이라 번호가 길면 두 줄로 넘어간다              |
| `.map_wrap .map` 높이 360px / 모바일 280px                           | 퍼가기 스크립트가 만들던 높이를 CSS 로 옮겼다               |
| `.room_title .box_1 h4` / `.box.sub_inner`                           | 평면도 블록. 개울가 `style.css` 에서 가져왔다               |
| `.layout_img` 정렬 / `img + img` 간격                                | 원본은 `<img>` 한 장이라 규칙이 없었다. 여러 장을 쌓기 위함 |

### 이미지 로드 실패 처리

`ImageHelpers.applyPlaceholder` 는 **URL 이 아예 없을 때**만 막아 준다. URL 은 있는데 404/차단이면
브라우저가 깨진 이미지 아이콘 + `alt` 텍스트를 그린다. 크롤링 당시 경로가 이미 사라진 숙소가
실제로 있어(호스팅 이전 등) `ImageHelpers.setImage(img, url, label, onFail)` 로 `onerror` 를 문다.

배경 이미지 슬롯(`setBackground`)은 CSS 라 실패해도 빈 칸으로 조용히 끝나지만,
`<img>` 를 쓰는 네 곳은 깨진 아이콘이 그대로 드러나므로 전부 이 헬퍼를 거친다.

| `<img>` 슬롯                       | 로드 실패 시                        |
| ---------------------------------- | ----------------------------------- |
| 배치도 (`layout-map`)              | placeholder SVG (`{숙소명} 배치도`) |
| 평면도 (`room`)                    | placeholder SVG (`{객실명} 평면도`) |
| 여행지 사진 (`nearby-attractions`) | placeholder SVG (여행지명)          |
| 로고 (헤더 2곳 · 푸터)             | **숙소명 텍스트 폴백**              |

⚠️ **푸터 `color: inherit` 세 줄이 중요하다.** `reset.css` 의 범용 리셋 블록
(`html, body, div, span, …, p, a, …`)이 `color: #333` 을 **직접** 선언한다. 상속이 아니라 자기 규칙이다.
원본 푸터는 `대표자 : 김란숙` 이 통짜 텍스트라 `<p>` 의 `color: inherit` 만 타서 흰색이었는데,
템플릿이 값을 매핑하려고 `<span>` 으로 감싸는 순간 `#333` 이 걸려 남색 배경 위에서 안 보이게 된다.
`tel:` 링크도 `a { color: #666 }` 로 같은 문제다.

⚠️ **푸터 로고는 `<a>` 로 감싸지 않는다.** 원본 `.foot_logo` 에 링크가 없다. 감싸면 블록이 하나 더
생겨 20% 칸의 높이·정렬이 원본과 달라진다. (헤더 `.logo1` / `.logo2` 는 원본에도 `<a>` 가 있다)

---

## 원본에서 가져오지 않은 것

| 원본                                                         | 이유                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `board.js` / `board_black.css`                               | 예약 게시판. 템플릿은 실시간 예약 링크만 쓴다                      |
| `popup_black.css`                                            | 팝업은 `js/popup.js` + `styles/popup.css` 공통본을 쓴다            |
| `jquery.cookie.min.js`                                       | 위와 같음 (원본 팝업의 "오늘 하루 보지 않기" 전용)                 |
| `#talk_custom_button` (카카오 상담)                          | bookingplay `tid` 하드코딩이라 데이터로 만들 수 없다               |
| daum roughmap 퍼가기 스크립트                                | 업체 고유 `key` / `timestamp` 가 필요하다 → Kakao Maps SDK 로 대체 |
| `view.html` 의 `.sub_visual`                                 | 두 원본 모두 주석 처리돼 있다 (구버전 히어로)                      |
| `special*.html` 의 `.special_info`                           | 두 원본의 special 14개 페이지 **전부** 주석 처리돼 있다            |
| `.lnb_bg`                                                    | 마크업은 남겼으나 원본에 `display:block` 규칙이 없어 뜨지 않는다   |
| `custom.js` 의 `.btn_top` / `.btn_toggle` / `.btn_lnb_close` | 두 원본 어느 페이지에도 해당 요소가 없는 죽은 코드                 |

---

## 알려진 제약

**로고가 한 장뿐이다.** 원본은 흰 로고(`w_logo.png`)와 검정 로고(`b_logo.png`) 두 파일을 CSS 로
갈아끼운다 — `.logo1` 은 히어로 위 투명 헤더용, `.logo2` 는 스크롤 시 흰 헤더용이다.
그런데 `homepage.images[0].logo` 는 `isSelected` 하나만 고르는 구조라 한 장밖에 못 받는다.
지금은 세 자리(`.logo1` / `.logo2` / `.foot_logo`)에 같은 URL 이 들어가므로,
**업주가 어두운 배경과 밝은 배경 모두에서 보이는 로고를 올려야 한다.**
A~I 도 같은 구조다.

**부대시설은 크롤링 대상이 아니다.** `property.facilities[]` 는 업주가 백오피스에서 등록해야
채워진다. 미등록 상태에서도 화면이 무너지지 않도록 SPECIAL 메뉴와 index 섹션을 숨기도록 했다.

---

## 카피라이트 (`data-copyright`)

푸터 카피라이트는 `property.tripProviderName`(Trip11 공급자명)으로 렌더한다.

`common/footer.html` 의 카피라이트 요소에 템플릿 문자열을 두고,
`header-footer-mapper.js` 의 `mapCopyright()` 가 `{provider}` 를 치환한다.

```html
<a href="http://trip11.kr/" data-copyright="COPYRIGHT©{provider}. ALL RIGHTS RESERVED.">
  COPYRIGHT©(주)트립일레븐. ALL RIGHTS RESERVED.
</a>
```

| `property.tripProviderName` | 결과                                  |
| --------------------------- | ------------------------------------- |
| `"신비서"`                  | `COPYRIGHT©신비서. ALL RIGHTS RESERVED.` |
| `""` / 미입력               | HTML 에 적힌 기존 문구 그대로          |

- 문구 형식(대소문자, `ⓒ` 접두, `(주)` 표기)은 템플릿마다 달라서 **형식은 `data-copyright` 속성값이 갖고
  매퍼는 이름만 바꾼다**.
- 값이 없을 때(백오피스 미입력 → `""`) 는 건드리지 않으므로 기존 트립일레븐 문구가 그대로 남는다.
- `trip11.kr` 링크는 변경하지 않는다.

---

## landing.html (선택 기능 — 여러 숙소 게이트)

t-template-A 와 같은 구현이다 (상세 스키마·카드 구조는 `t-template-A/data-mapping.md` 의 landing 절).
헤더/푸터가 없는 별도 페이지이고, 카드(`pages.landing.sections[0].about[]`, 1~3장)를 그리드로 나란히 놓는다.

**루트 가드** — `IndexMapper.mapPage()` → `maybeRedirectToLanding()` → `shouldEnterLanding()`

- 어드민 프리뷰 iframe 안이면 skip
- `pages.landing.sections[0].enabled !== true` 면 skip — **명시적으로 켠 숙소만** 가로챈다.
  섹션이 없거나 `enabled` 가 false/누락이면 기존처럼 `index.html` 을 그대로 보여준다
- `document.referrer` 가 같은 origin 이면 skip (헤더 로고·메뉴, 랜딩의 자기 자신 카드)
- `document.referrer` 호스트가 `about[].domain` 중 하나면 skip (연결 숙소 랜딩에서 카드로 넘어옴)
- 그 외 (주소 직접 입력·즐겨찾기·검색/외부 링크) → `location.replace('landing.html')`

**조기 랜딩 가드** (`index-mapper.js` `earlyLandingGate`) — 매핑을 기다리지 않고 스크립트 로드 직후 JSON 을 읽어
같은 `shouldEnterLanding()` 으로 판단한다. 판단이 끝날 때까지 `__tplReveal` 을 붙잡아 두고,
진입 대상이면 index 를 노출하지 않고 바로 이동한다 (이동을 시작한 뒤의 노출 요청은 무시).
iframe·같은 사이트 referrer 는 JSON 을 읽기 전에 건너뛰고, 3초 뒤에는 무조건 판단을 끝낸다 (head 렌더 게이트와 같은 값).

`landing.html` 을 직접 열었는데 `enabled !== true` 면 `404.html` 로 보낸다.

쿼리 파라미터 없이 **referrer** 로 "랜딩을 이미 거쳤는지" 를 가른다. 그래서 헤더 로고 링크는
원래대로 `./index.html`, 랜딩 카드도 `./index.html` / `{domain}/` 로 보낸다.

- 크로스 도메인 referrer 는 브라우저 기본 정책(`strict-origin-when-cross-origin`)상 origin 만 오므로
  호스트로만 비교한다 (`www.` 유무 무시).
- 연결 숙소 B 의 랜딩 `about[]` 에 A 의 도메인이 없으면, A 랜딩 → B 카드 클릭 시 B 의 랜딩이 한 번 더 뜬다.
- https → http 로 넘어가면 브라우저가 referrer 를 보내지 않아 랜딩이 다시 뜬다 (연결 숙소 도메인은 https 전제).

**카드 링크** (`landing-mapper.js` `getCardLink()`) — 전부 새 탭. 도착한 index 는 referrer 로 랜딩을 건너뛴다

| 조건                                         | 이동                          |
| -------------------------------------------- | ----------------------------- |
| `about[i].propertyId === property.id`        | `./index.html`                |
| 연결 숙소 + `about[i].domain` 있음           | `{domain}/`                   |
| 연결 숙소인데 `domain` 없음                  | `href="#"` (비활성)           |

카드는 `about[i].order` 오름차순으로 그린다 (없거나 같으면 배열 순서 유지).
카드 배경은 `about[i].images` 첫 장, 로고는 `hero.images[]` 중 `blockId === about[i].blockId`,
로고가 없으면 `about[i].propertyName` 텍스트, `about[i].title` 은 입력했을 때만 보인다.
