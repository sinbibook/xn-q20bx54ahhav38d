(function (global) {
  'use strict';

  function setAllText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  function LayoutMapMapper() {
    BaseDataMapper.call(this);
  }
  LayoutMapMapper.prototype = Object.create(BaseDataMapper.prototype);
  LayoutMapMapper.prototype.constructor = LayoutMapMapper;

  // 섹션 배정 — pages.layoutMap.sections[0]
  //
  //   hero.images            → .sub_visual 배경
  //   hero.title/description → .main_room .title_box (객실 목록 위 제목·설명)
  //   about.images           → .layout_img (배치도)
  //
  // ⚠️ 히어로 안에는 매핑할 문구 슬롯이 없다. 원본은 `h3 ROOMS PREVIEW` +
  //    `{숙소명} 객실 미리보기` 두 줄 고정이다. hero 블록의 문구는 흰 지면 위
  //    `.main_room .title_box` 가 받는다.
  //
  // 객실 목록(.room_list)은 customFields.roomtypes[] 가 소스라 블록을 배정하지 않는다.
  // about.title / about.description 은 쓰지 않는다 — 배치도 옆에 붙일 자리가 없다.
  //
  // main 의 about[] 은 배열이지만 여기 about 은 **단일 객체**다.
  LayoutMapMapper.prototype.getSection = function () {
    var page = this.getPages().layoutMap;
    return (page && page.sections && page.sections[0]) || null;
  };

  LayoutMapMapper.prototype.mapPage = function () {
    // enabled=false (또는 섹션 자체가 없음) → 404 리다이렉트.
    // 헤더의 '미리보기' li 숨김과 대메뉴 ROOMS 이동처(첫 객실 상세)도
    // header-footer-mapper 가 같은 기준(isLayoutMapEnabled)으로 정한다.
    if (!this.isLayoutMapEnabled()) {
      window.location.href = '404.html';
      return;
    }

    this.mapPropertyNames();
    this.mapHero();
    // 목록 페이지라 currentId 가 없다 — 탭은 항상 그룹명으로 접힌 목록이다.
    this.renderRoomNav('[data-layoutmap-room-nav]', null);
    this.mapIntro();
    this.renderRoomSlides('[data-layoutmap-room-slides]');
    this.mapLayoutImages();

    if (typeof window.initLayoutMapSwipers === 'function') window.initLayoutMapSwipers();
  };

  LayoutMapMapper.prototype.mapPropertyNames = function () {
    setAllText('[data-property-name-en]', this.getPropertyNameEn());
    setAllText('[data-property-name]', this.getPropertyName());
    this.applyPropertyCaptions();
  };

  // 값이 없으면 요소째 숨긴다. 빈 <p> 를 남기면 원본 margin 때문에 빈 줄이 생긴다.
  LayoutMapMapper.prototype.setCopySlot = function (selector, value, asHtml) {
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

  // 객실 썸네일 중 첫 번째로 찾은 URL (히어로 배경 폴백용)
  LayoutMapMapper.prototype.firstRoomThumbUrl = function () {
    var roomtypes = this.getRoomtypes();
    for (var i = 0; i < roomtypes.length; i++) {
      var url = this.getRoomThumbUrl(roomtypes[i]);
      if (url) return url;
    }
    return '';
  };

  // MAPPER: hero.images → .sub_visual 배경
  //
  // 이 페이지는 객실 미리보기라 객실 사진이 exterior 보다 앞선다.
  // (원본도 객실 사진 한 장을 깔았다 — 용천수는 room/33731/1.webp)
  LayoutMapMapper.prototype.mapHero = function () {
    var self = this;
    var hero = (this.getSection() || {}).hero || {};
    var name = this.getPropertyName();

    this.setCopySlot('[data-layoutmap-visual-description]', name ? name + ' 객실 미리보기' : '');

    var url =
      this.getFirstSelectedImage(hero.images || []) ||
      this.firstRoomThumbUrl() ||
      (this.pickPropertyImage(['exterior', 'thumbnail']) || {}).url ||
      '';

    document.querySelectorAll('[data-layoutmap-hero]').forEach(function (el) {
      self.setBackground(el, url, '객실 이미지');
    });
  };

  // MAPPER: hero.title / hero.description → .main_room .title_box
  //
  // 사진 위가 아니라 흰 지면 위라 업주가 넣은 문구를 그대로 받아도
  // 레이아웃이 무너지지 않는다.
  LayoutMapMapper.prototype.INTRO_FALLBACK_TITLE = '객실 미리보기';

  LayoutMapMapper.prototype.mapIntro = function () {
    var hero = (this.getSection() || {}).hero || {};
    var name = this.getPropertyName();

    setAllText('[data-layoutmap-title]', this.firstText(hero.title, this.INTRO_FALLBACK_TITLE));

    this.setCopySlot(
      '[data-layoutmap-description]',
      this.firstText(hero.description, name ? name + '의 객실을 소개합니다.' : ''),
      true
    );
  };

  // MAPPER: about.images → .layout_img 배치도
  //
  // 원본은 배치도 이미지가 한 장이지만(`<img src="room/layout.webp">`) 숙소에 따라
  // 동/층별로 여러 장을 올린다. isSelected 순서대로 **전부** 세로로 쌓는다.
  //
  // ⚠️ 이미지가 없어도 영역을 유지하고 placeholder 를 세운다.
  //    배치도는 이 페이지 이름이 가리키는 본 목적이라, 비었다고 숨기면
  //    객실 목록만 남아 layout-map 이 아니게 된다.
  //    (room.html 의 평면도는 부가 정보라 반대로 영역째 숨긴다)
  LayoutMapMapper.prototype.mapLayoutImages = function () {
    var self = this;
    var section = this.getSection() || {};
    var about = section.about || {};
    var images = this.getSelectedImages(about.images || []).filter(function (img) {
      return img && img.url;
    });

    var host = document.querySelector('[data-layoutmap-images]');
    if (!host) return;
    host.innerHTML = '';

    if (!images.length) {
      ImageHelpers.applyBackgroundPlaceholder(host, '배치도');
      host.style.minHeight = '320px';
      return;
    }
    host.classList.remove('empty-image-placeholder');
    host.style.backgroundImage = '';
    host.style.minHeight = '';

    var name = this.getPropertyName();
    images.forEach(function (image) {
      var img = document.createElement('img');
      var label = self.cleanText(image.description) || (name ? name + ' 배치도' : '배치도');
      // URL 이 죽어 있으면(크롤링 당시 경로가 사라진 숙소가 있다) placeholder 로 떨어뜨린다
      ImageHelpers.setImage(img, image.url, label);
      host.appendChild(img);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new LayoutMapMapper().initialize();
  });

  global.LayoutMapMapper = LayoutMapMapper;
})(window);
