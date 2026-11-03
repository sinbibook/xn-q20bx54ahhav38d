(function (global) {
  'use strict';

  function setAllText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  function MainMapper() {
    BaseDataMapper.call(this);
  }
  MainMapper.prototype = Object.create(BaseDataMapper.prototype);
  MainMapper.prototype.constructor = MainMapper;

  MainMapper.prototype.mapPage = function () {
    this.mapPropertyNames();
    this.mapVisual();
    this.mapHero();
    this.mapAboutBlocks();
    this.mapClosing();

    if (typeof window.initMainSwipers === 'function') window.initMainSwipers();
  };

  // 섹션 배정 — pages.main.sections[0]
  //
  //   hero     → .sub_cont .title_box   (대제목 + 설명 + 히어로 배경)
  //   about[]  → 소개 블록 N개           (큰 사진 1 + 글 + 작은 사진 3)
  //   (없음)   → .main_wide_bg          (배정할 블록이 없어 하드코딩 + 외경 사진)
  //
  // 원본 두 페이지를 블록 하나씩으로 받는다.
  //   about[0] = 펜션소개 페이지 (사진 왼쪽 / 회색 판 오프셋)
  //   about[1] = 외경보기 페이지 (사진 오른쪽 / 테두리 오프셋)
  MainMapper.prototype.getSection = function () {
    var page = this.getPages().main;
    return (page && page.sections && page.sections[0]) || {};
  };

  MainMapper.prototype.mapPropertyNames = function () {
    setAllText('[data-property-name-en]', this.getPropertyNameEn());
    setAllText('[data-property-name]', this.getPropertyName());
    this.applyPropertyCaptions();
  };

  // 값이 없으면 요소째 숨긴다. 빈 <p> 를 남기면 원본 margin 때문에 빈 줄이 생긴다.
  MainMapper.prototype.setCopySlot = function (selector, value, asHtml) {
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

  MainMapper.prototype.welcomeLine = function () {
    var nameEn = this.getPropertyNameEn();
    return nameEn ? 'Welcome To ' + nameEn : '';
  };

  // 숙소 사진 폴백 — 외경 우선. 히어로 / 소개 블록 / 클로징이 모두 이 순서를 본다.
  MainMapper.prototype.propertyPhotos = function () {
    return this.getPropertyImagesByCategory('exterior')
      .concat(this.getPropertyImagesByCategory('surrounding'))
      .concat(this.getPropertyImagesByCategory('commonArea'))
      .concat(this.getPropertyImagesByCategory('thumbnail'))
      .filter(function (img) {
        return img && img.url;
      });
  };

  // MAPPER: hero.images / property.images → .main_visual 슬라이드 + 둘째 줄
  //
  // 제목(ABOUT)은 페이지 이름이라 HTML 에 고정이고, 아래 한 줄만 채운다.
  // 원본 about.html 히어로의 `{숙소명}을 소개합니다.` 를 그대로 쓴다.
  // 숙소명은 백오피스 입력값이라 받침을 알 수 없으므로 을/를을 골라 붙인다.
  MainMapper.prototype.mapVisual = function () {
    var self = this;
    var hero = this.getSection().hero || {};
    var name = this.getPropertyName();

    this.setCopySlot(
      '[data-main-visual-description]',
      name ? this.withJosa(name, '을/를') + ' 소개합니다.' : ''
    );

    var wrapper = document.querySelector('[data-main-hero-slides]');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    var images = this.getSelectedImages(hero.images || []).filter(function (img) {
      return img && img.url;
    });
    // hero 블록이 비면 숙소 외경 사진으로 폴백한다
    if (!images.length) images = this.propertyPhotos();

    // 원본 슬라이드는 내용 없는 배경 <div> 다. 한 장도 없으면
    // 매핑 위치 안내용 placeholder 슬라이드를 한 장 세운다.
    if (!images.length) {
      var empty = document.createElement('div');
      empty.className = 'swiper-slide';
      ImageHelpers.applyBackgroundPlaceholder(empty, 'ABOUT');
      wrapper.appendChild(empty);
      return;
    }

    images.forEach(function (img) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';
      self.setBackground(slide, img.url, 'ABOUT');
      wrapper.appendChild(slide);
    });
  };

  // MAPPER: hero.title / hero.description → .sub_cont .title_box
  //
  // 원본 h3 는 숙소 유형을 탄 이름이었다(`카라반소개` / `풀빌라소개`).
  // 데이터로 뺄 수 없는 값이라 중립적인 `펜션소개` 를 폴백으로 둔다.
  MainMapper.prototype.HERO_FALLBACK_TITLE = '펜션소개';

  MainMapper.prototype.mapHero = function () {
    var hero = this.getSection().hero || {};
    var name = this.getPropertyName();

    setAllText('[data-main-hero-title]', this.firstText(hero.title, this.HERO_FALLBACK_TITLE));
    this.setCopySlot(
      '[data-main-hero-description]',
      this.firstText(hero.description, name ? name + '에 오신 것을 환영합니다.' : ''),
      true
    );
  };

  // ── 소개 블록 ────────────────────────────────────────────
  // 블록 하나가 `.{k}_top`(큰 사진 1장 + 영문 리드 + 본문) + `.{k}_bnr`(작은 사진 3칸)
  // 두 덩어리다. 원본의 두 벌을 번갈아 쓴다 — about 은 사진 왼쪽/회색 판,
  // view 는 사진 오른쪽/테두리라 연달아 놓으면 좌우가 교차한다.
  //
  // ⚠️ `.{k}_bnr` 은 3칸(32% × 3) 전제 CSS 다. 큰 사진까지 합쳐 4장이 안 되면
  //    <ul> 을 만들지 않는다 — 두 칸만 남으면 오른쪽이 비어 레이아웃이 어긋난다.
  MainMapper.prototype.BLOCK_KINDS = ['about', 'view'];
  MainMapper.prototype.BNR_COUNT = 3;

  // 영문 리드(Alex Brush 필기체) 폴백. 원본이 두 페이지에서 다른 문구를 썼다.
  MainMapper.prototype.eyebrowFallback = function (kind) {
    var nameEn = this.getPropertyNameEn();
    if (!nameEn) return '';
    return kind === 'view' ? 'Welcome To ' + nameEn : 'About ' + nameEn;
  };

  MainMapper.prototype.buildBlock = function (block, kind) {
    var self = this;
    var frag = document.createDocumentFragment();

    var images = this.getSelectedImages((block && block.images) || []).filter(function (img) {
      return img && img.url;
    });
    // 블록에 사진이 없으면 숙소 사진으로 채운다(빈 회색 판만 남는 것을 막는다)
    if (!images.length) images = this.propertyPhotos();

    var top = document.createElement('div');
    top.className = kind + '_top inner';

    var imgBox = document.createElement('div');
    imgBox.className = 'img_box';
    var img = document.createElement('div');
    img.className = 'img';
    this.setBackground(img, images.length ? images[0].url : '', '소개 이미지');
    imgBox.appendChild(img);

    var txt = document.createElement('div');
    txt.className = 'txt';

    var eyebrow = document.createElement('p');
    eyebrow.className = kind + '_pension';
    eyebrow.textContent = this.firstText(block && block.title, this.eyebrowFallback(kind));
    if (!eyebrow.textContent) eyebrow.style.display = 'none';

    var detail = document.createElement('div');
    detail.className = kind + '_detail';
    var body = this.firstText(block && block.description, this.getProperty().description);
    detail.innerHTML = this.nl2br(body);
    if (!body) detail.style.display = 'none';

    txt.appendChild(eyebrow);
    txt.appendChild(detail);
    top.appendChild(imgBox);
    top.appendChild(txt);
    frag.appendChild(top);

    var bnrImages = images.slice(1, 1 + this.BNR_COUNT);
    if (bnrImages.length === this.BNR_COUNT) {
      var ul = document.createElement('ul');
      ul.className = kind + '_bnr inner';
      bnrImages.forEach(function (item) {
        var li = document.createElement('li');
        self.setBackground(li, item.url, '');
        ul.appendChild(li);
      });
      frag.appendChild(ul);
    }

    return frag;
  };

  // MAPPER: about[] → .about_top/.about_bnr + .view_top/.view_bnr (교대)
  MainMapper.prototype.mapAboutBlocks = function () {
    var self = this;
    var host = document.querySelector('[data-main-about-blocks]');
    if (!host) return;
    host.innerHTML = '';

    var section = this.getSection();
    var blocks = Array.isArray(section.about) ? section.about : [];

    // 블록이 하나도 없어도 페이지가 비지 않도록 빈 블록 한 개로 그린다.
    // (buildBlock 이 property.description + 숙소 사진으로 채운다)
    if (!blocks.length) blocks = [{}];

    blocks.forEach(function (block, i) {
      var kind = self.BLOCK_KINDS[i % self.BLOCK_KINDS.length];
      host.appendChild(self.buildBlock(block, kind));
    });
  };

  // MAPPER: property.images → .main_wide_bg 배경 (문구는 하드코딩)
  //
  // 소개 블록이 쓰고 남은 사진을 우선 고른다. 바로 위 블록의 사진이 배너로
  // 다시 깔리면 같은 화면에 같은 사진이 두 번 나온다.
  //
  // ⚠️ 히어로 슬라이드는 이 판정에서 뺀다. 히어로는 외경 사진을 통째로 쓰는 일이
  //    흔해(원본 view.html 도 15장 전부다) 포함시키면 남는 사진이 없어 로직이
  //    무력해진다. 맨 위 히어로와 맨 아래 배너는 한 화면에 같이 잡히지도 않는다.
  MainMapper.prototype.mapClosing = function () {
    var self = this;

    this.setCopySlot('[data-main-closing-description]', this.welcomeLine());

    var used = {};
    document
      .querySelectorAll('[data-main-about-blocks] .img, [data-main-about-blocks] li')
      .forEach(function (el) {
        var m = /url\(["']?(.*?)["']?\)/.exec(el.style.backgroundImage || '');
        if (m) used[m[1]] = true;
      });

    var photos = this.propertyPhotos();
    var pick = photos.filter(function (img) {
      return !used[img.url];
    });
    var url = (pick[0] || photos[0] || {}).url || '';

    document.querySelectorAll('[data-main-closing-bg]').forEach(function (el) {
      self.setBackground(el, url, '');
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new MainMapper().initialize();
  });

  global.MainMapper = MainMapper;
})(window);
