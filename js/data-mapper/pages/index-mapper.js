(function (global) {
  'use strict';

  function setAllText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  // ── 랜딩 진입 판단 ─────────────────────────────────────────
  // index.html 진입을 landing.html 로 돌려야 하면 true. 쿼리 파라미터 없이 "어디서 왔는지(referrer)" 로 가른다.
  //   - 어드민 프리뷰 iframe → false (운영자가 "홈" 탭을 직접 볼 수 있어야 한다)
  //   - pages.landing.sections[0].enabled !== true → false (명시적으로 켠 경우만. 어드민 저장 시
  //     undefined 는 JSON 에서 키째 빠지므로, 누락을 '켜짐' 으로 보면 랜딩을 안 쓰는 숙소가 튕긴다)
  //   - 같은 사이트 안에서 넘어옴 → false (헤더 로고·메뉴, 랜딩의 자기 자신 카드)
  //   - 랜딩 카드에 등록된 연결 숙소 도메인에서 넘어옴 → false (그 숙소 랜딩의 카드를 눌러 온 경우)
  //   - 그 외(주소 직접 입력·즐겨찾기·검색/외부 링크) → true
  function shouldEnterLanding(landingPage) {
    if (window.top !== window.self) return false;

    var section = landingPage && landingPage.sections && landingPage.sections[0];
    if (!section || section.enabled !== true) return false;

    return !isFromSameSite() && !isFromLinkedProperty(section);
  }

  function getReferrerUrl() {
    try {
      return document.referrer ? new URL(document.referrer) : null;
    } catch (e) {
      return null;
    }
  }

  function isFromSameSite() {
    var ref = getReferrerUrl();
    return !!ref && ref.origin === window.location.origin;
  }

  // 크로스 도메인 referrer 는 브라우저 기본 정책상 origin 만 오므로 호스트로만 비교한다 (www. 유무는 무시).
  function isFromLinkedProperty(section) {
    var ref = getReferrerUrl();
    if (!ref) return false;

    var refHost = normalizeHost(ref.host);
    return ((section && section.about) || []).some(function (card) {
      var domain = card && typeof card.domain === 'string' ? card.domain.trim() : '';
      if (!domain) return false;
      try {
        var url = new URL(/^https?:\/\//i.test(domain) ? domain : 'https://' + domain);
        return normalizeHost(url.host) === refHost;
      } catch (e) {
        return false;
      }
    });
  }

  // 랜딩으로 이동을 시작했으면 true. location.replace 는 즉시 페이지를 떠나지 않으므로,
  // 그 사이 다른 매핑(헤더 등)이 끝나며 부르는 __tplReveal 이 index 를 잠깐 드러내지 않게 막는 데 쓴다.
  var leavingToLanding = false;

  function goToLanding() {
    leavingToLanding = true;
    window.location.replace('landing.html');
  }

  function normalizeHost(host) {
    return String(host || '').toLowerCase().replace(/^www\./, '');
  }

  function IndexMapper() {
    BaseDataMapper.call(this);
  }
  IndexMapper.prototype = Object.create(BaseDataMapper.prototype);
  IndexMapper.prototype.constructor = IndexMapper;

  IndexMapper.prototype.mapPage = function () {
    if (this.maybeRedirectToLanding()) return;

    this.mapPropertyNames();
    this.mapHero();
    this.mapRooms();
    this.mapSpecial();
    this.mapClosing();
    this.mapLook();

    if (typeof window.initIndexSwipers === 'function') window.initIndexSwipers();
  };

  // 루트 가드: 랜딩 진입 대상이면 index.html 진입을 landing.html 로 되돌린다 (판단은 shouldEnterLanding).
  IndexMapper.prototype.maybeRedirectToLanding = function () {
    if (!shouldEnterLanding(this.getPages().landing)) return false;

    goToLanding();
    return true;
  };

  // 섹션 배정 — pages.index.sections[0] 의 블록 5개를 전부 쓴다.
  //
  //   hero      → .main_visual     (히어로 슬라이더 + 숙소명 + 영문 리드)
  //   essence   → .main_room       (객실 미리보기 리드 한 줄)
  //   signature → .main_special    (스페셜 포인트 리드 한 줄)
  //   closing   → .main_wide_bg    (예약 CTA 배너 — 배경 + 2줄)
  //   gallery   → .main_look       (숙소 둘러보기 — 리드 + 사진 5칸)
  //
  // .main_room / .main_special 의 본체는 customFields.roomtypes[] 와
  // property.facilities[] 가 채운다. essence / signature 는 그 위의
  // 리드 한 줄만 담당한다.
  IndexMapper.prototype.getSection = function () {
    var page = this.getPages().index;
    return (page && page.sections && page.sections[0]) || {};
  };

  IndexMapper.prototype.mapPropertyNames = function () {
    setAllText('[data-property-name-en]', this.getPropertyNameEn());
    setAllText('[data-property-name]', this.getPropertyName());
    this.applyPropertyCaptions();
  };

  // 블록의 isSelected 이미지 목록
  IndexMapper.prototype.blockImages = function (key) {
    var block = this.getSection()[key] || {};
    return this.getSelectedImages(block.images || []);
  };

  // 여러 블록에서 순서대로 첫 이미지를 찾는다 (앞 블록이 비면 다음으로)
  IndexMapper.prototype.pickImage = function () {
    for (var i = 0; i < arguments.length; i++) {
      var list = this.blockImages(arguments[i]);
      if (list.length && list[0].url) return list[0].url;
    }
    return '';
  };

  // 값이 없으면 요소째 숨긴다. 빈 <p> 를 남기면 원본 margin 때문에 빈 줄이 생긴다.
  IndexMapper.prototype.setCopySlot = function (selector, value, asHtml) {
    var self = this;
    document.querySelectorAll(selector).forEach(function (el) {
      if (!value) {
        el.textContent = '';
        el.style.display = 'none';
        return;
      }
      el.style.display = '';
      if (asHtml) el.innerHTML = self.nl2br(value);
      else el.textContent = value;
    });
  };

  // 원본의 영문 리드는 `Welcome To {영문 숙소명}` 형태다. 영문명이 없으면
  // 한글 숙소명을 붙여도 어색하므로 문구 자체를 내보내지 않는다.
  IndexMapper.prototype.welcomeLine = function () {
    var nameEn = this.getPropertyNameEn();
    return nameEn ? 'Welcome To ' + nameEn : '';
  };

  // MAPPER: hero → .main_visual
  //
  // .visual_txt 는 strong(숙소명) + p(영문 리드) 2줄이다.
  // 원본 두 사이트 모두 strong 이 한글 숙소명, p 가 `Welcome To {영문명}` 이다.
  //
  // ⚠️ 다른 슬롯과 달리 **비어도 요소를 숨기지 않는다.** .visual_txt 는
  //    bottom 기준 정렬이라 줄이 사라지면 제목이 아래로 내려앉는다.
  IndexMapper.prototype.mapHero = function () {
    var self = this;
    var hero = this.getSection().hero || {};
    var images = this.blockImages('hero');

    setAllText('[data-index-hero-title]', this.firstText(hero.title, this.getPropertyName()));

    document.querySelectorAll('[data-index-hero-description]').forEach(function (el) {
      el.innerHTML = self.nl2br(self.firstText(hero.description, self.welcomeLine()));
    });

    var wrapper = document.querySelector('[data-index-hero-slides]');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    // hero 블록이 비면 숙소 대표 사진으로 폴백한다. 히어로가 통째로
    // 빈 화면이 되는 것보다 낫다.
    var urls = images
      .map(function (img) {
        return img.url;
      })
      .filter(Boolean);

    if (!urls.length) {
      urls = this.getPropertyImagesByCategory('thumbnail')
        .concat(this.getPropertyImagesByCategory('exterior'))
        .map(function (img) {
          return img.url;
        })
        .filter(Boolean);
    }

    // 원본 슬라이드는 내용 없는 배경 <div> 다. 한 장도 없으면
    // 매핑 위치 안내용 placeholder 슬라이드를 한 장 세운다.
    if (!urls.length) {
      var empty = document.createElement('div');
      empty.className = 'swiper-slide';
      ImageHelpers.applyBackgroundPlaceholder(empty, 'Hero Image');
      wrapper.appendChild(empty);
      return;
    }

    urls.forEach(function (url) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';
      self.setBackground(slide, url, 'Hero Image');
      wrapper.appendChild(slide);
    });
  };

  // MAPPER: customFields.roomtypes[] → .main_room .room_list
  // 리드 한 줄은 essence 블록, 카드는 base-mapper 의 공용 렌더러가 만든다.
  IndexMapper.prototype.mapRooms = function () {
    var essence = this.getSection().essence || {};
    var name = this.getPropertyName();

    this.setCopySlot(
      '[data-index-room-description]',
      this.firstText(
        essence.description,
        essence.title,
        name ? name + '의 객실을 소개합니다.' : ''
      ),
      true
    );

    this.renderRoomSlides('[data-index-room-list]');
  };

  // MAPPER: property.facilities[] → .main_special .special_list
  //
  // ⚠️ 시설을 하나도 등록하지 않으면 섹션째 숨긴다. 부대시설은
  //    property.facilities[] 가 유일한 소스라(크롤링으로 채워지지 않는다)
  //    비어 있는 숙소가 실제로 있다. 그대로 두면 제목과 장식 문구만 남은
  //    빈 띠가 화면 한가운데에 들어간다. (.main_look 과 같은 처리)
  IndexMapper.prototype.mapSpecial = function () {
    var signature = this.getSection().signature || {};
    var name = this.getPropertyName();
    var hasFacilities = this.getFacilities().length > 0;

    document.querySelectorAll('[data-index-special-section]').forEach(function (el) {
      el.style.display = hasFacilities ? '' : 'none';
    });
    if (!hasFacilities) return;

    this.setCopySlot(
      '[data-index-special-description]',
      this.firstText(
        signature.description,
        signature.title,
        name ? name + '의 스페셜 포인트를 소개합니다.' : ''
      ),
      true
    );

    this.renderSpecialCards('[data-index-special-list]');
  };

  // MAPPER: closing → .main_wide_bg (예약 CTA 배너)
  //
  // strong 은 Alex Brush 필기체로 크게 깔리는 영문 장식 문구다.
  // 두 원본이 `Make your Stay Even Better` 로 완전히 같아 폴백 기본값으로 둔다.
  IndexMapper.prototype.CLOSING_FALLBACK_TITLE = 'Make your Stay Even Better';

  IndexMapper.prototype.mapClosing = function () {
    var self = this;
    var closing = this.getSection().closing || {};

    this.setCopySlot(
      '[data-index-closing-description]',
      this.firstText(closing.description, this.welcomeLine())
    );
    this.setCopySlot(
      '[data-index-closing-title]',
      this.firstText(closing.title, this.CLOSING_FALLBACK_TITLE)
    );

    var url = this.pickImage('closing', 'gallery', 'hero');
    if (!url) {
      var fallback = this.pickPropertyImage(['exterior', 'surrounding', 'thumbnail']);
      url = fallback ? fallback.url : '';
    }
    document.querySelectorAll('[data-index-closing-bg]').forEach(function (el) {
      self.setBackground(el, url, '');
    });
  };

  // MAPPER: gallery → .main_look (숙소 둘러보기)
  //
  // ⚠️ 원본 CSS 가 1번째 칸만 50%/600px 로 두고 나머지를 25%/295px 로 깔아
  //    5칸을 전제로 짜여 있다. 더 들어오면 잘라 낸다.
  //    한 장도 없으면 섹션째 숨긴다(빈 그리드가 남으면 여백만 크게 뜬다).
  //
  // 칸 라벨은 이미지의 description 이다. 원본은 `외경 / 카라반 / 야외수영장 …`
  // 처럼 사람이 붙인 설명이라 값이 없으면 라벨 없이 사진만 둔다.
  IndexMapper.prototype.LOOK_MAX = 5;

  IndexMapper.prototype.mapLook = function () {
    var self = this;
    var gallery = this.getSection().gallery || {};
    var name = this.getPropertyName();

    this.setCopySlot(
      '[data-index-look-description]',
      this.firstText(gallery.description, gallery.title, name ? name + ' 내·외부 둘러보기' : ''),
      true
    );

    var images = this.blockImages('gallery');

    // gallery 블록이 비면 숙소 사진 카테고리를 순서대로 긁어 채운다.
    if (!images.length) {
      images = this.getPropertyImagesByCategory('exterior')
        .concat(this.getPropertyImagesByCategory('commonArea'))
        .concat(this.getPropertyImagesByCategory('surrounding'));
    }

    // 그래도 없으면 부대시설 대표 사진으로 채운다(원본도 special 사진을 섞어 썼다)
    if (!images.length) {
      this.getFacilities().forEach(function (f) {
        var url = self.getFirstSelectedImage(f.images || []);
        if (url) images.push({ url: url, description: f.name });
      });
    }

    images = images
      .filter(function (img) {
        return img && img.url;
      })
      .slice(0, this.LOOK_MAX);

    var list = document.querySelector('[data-index-look-list]');
    var section = document.querySelector('[data-index-look-section]');
    if (!list) return;

    list.innerHTML = '';
    if (section) section.style.display = images.length ? '' : 'none';
    if (!images.length) return;

    images.forEach(function (img) {
      var li = document.createElement('li');

      var imgBox = document.createElement('div');
      imgBox.className = 'img';
      self.setBackground(imgBox, img.url, '');
      li.appendChild(imgBox);

      // 라벨이 없으면 hover 오버레이 자체를 만들지 않는다 (빈 판만 덮인다)
      var label = self.cleanText(img.description);
      if (label) {
        var txt = document.createElement('div');
        txt.className = 'txt';
        var p = document.createElement('p');
        p.textContent = label;
        txt.appendChild(p);
        li.appendChild(txt);
      }

      list.appendChild(li);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new IndexMapper().initialize();
  });

  // 조기 랜딩 가드 — 매핑을 기다리지 않고 이 스크립트가 로드되자마자 랜딩 여부부터 판단한다.
  //   standalone 에서는 preview-handler 가 어드민 데이터를 2초 기다린 뒤에야 index 를 매핑하는데,
  //   그 사이 헤더 매핑이 렌더 게이트를 먼저 풀어 매핑 전 index(히어로 < > 화살표 등)가 보였다가
  //   랜딩으로 넘어갔다. 판단이 끝날 때까지 __tplReveal 을 붙잡아 둔다.
  //   - 랜딩 진입 대상(shouldEnterLanding) → 화면을 풀지 않고 곧장 landing.html. 이동 판단 뒤에 헤더 매핑이
  //     끝나며 노출을 요청해도 무시한다 (판단 = 노출 허용으로 보면 페이지를 떠나기 직전 index 가 비친다)
  //   - 그 외 → 붙잡아 둔 노출을 그대로 진행 (기존과 같은 화면. JSON 한 번 더 읽는 시간만큼 늦게 뜰 수 있다)
  //   - 네트워크 실패/지연 대비 3초 뒤에는 무조건 판단을 끝낸다 (head 의 렌더 게이트 타임아웃과 같은 값)
  //   iframe(어드민 프리뷰)·내부 이동은 JSON 을 읽기 전에 바로 건너뛴다 (어차피 랜딩으로 안 보낸다).
  (function earlyLandingGate() {
    if (window.top !== window.self) return;
    if (isFromSameSite()) return;

    var reveal = window.__tplReveal;
    var decided = false;
    var pending = false;

    function finish() {
      if (decided) return;
      decided = true;
      if (pending && reveal) reveal();
    }

    window.__tplReveal = function () {
      if (leavingToLanding) return; // 랜딩으로 떠나는 중 — 노출하지 않는다
      if (decided) {
        if (reveal) reveal();
      } else {
        pending = true;
      }
    };

    setTimeout(function () {
      pending = true;
      finish();
    }, 3000);

    fetch('standard-template-data.json?t=' + Date.now())
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var customFields = (data && data.homepage && data.homepage.customFields) || (data && data.customFields) || {};
        var landing = customFields.pages && customFields.pages.landing;
        if (!decided && shouldEnterLanding(landing)) {
          decided = true;
          goToLanding(); // 노출하지 않고 이동한다 (이후 들어오는 노출 요청은 무시)
          return;
        }
        finish();
      })
      .catch(finish);
  })();

  global.IndexMapper = IndexMapper;
})(window);
