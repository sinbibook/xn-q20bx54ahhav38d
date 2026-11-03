(function (global) {
  'use strict';

  function setAllText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  function FacilityMapper() {
    BaseDataMapper.call(this);
  }
  FacilityMapper.prototype = Object.create(BaseDataMapper.prototype);
  FacilityMapper.prototype.constructor = FacilityMapper;

  // 데이터 소스 — pages.facility[] 는 비어 있는 응답이 흔하다.
  // 내용은 전부 property.facilities[] 에서 온다.
  //
  // 원본 special1~9.html 을 facility.html?id= 한 파일로 합쳤다.
  // 시설 순서는 getFacilities() 가 displayOrder 로 정렬한다 —
  // 헤더 서브메뉴 / index 카드 / 이 페이지 탭이 모두 같은 순서를 쓴다.
  FacilityMapper.prototype.getCurrentId = function () {
    var id = new URLSearchParams(window.location.search).get('id');
    if (id) return id;
    // ?id= 없이 들어오면 첫 시설을 보여준다.
    var list = this.getFacilities();
    return list.length ? String(list[0].id) : '';
  };

  FacilityMapper.prototype.mapPage = function () {
    var facility = this.findFacilityById(this.getCurrentId());

    // 시설이 없거나 잘못된 id → 404.
    // 백오피스 preview 에서는 리다이렉트하지 않는다(다른 페이지와 같은 규칙).
    if (!facility) {
      if (!this.isPreviewMode()) {
        window.location.href = '404.html';
        return;
      }
    }

    this.mapPropertyNames();
    this.mapHeading(facility);
    this.mapHeroSlides(facility);
    this.renderFacilityNav(facility);
    this.mapIntro(facility);
    this.mapBottomImages(facility);

    if (typeof window.initFacilitySwipers === 'function') window.initFacilitySwipers();
  };

  FacilityMapper.prototype.mapPropertyNames = function () {
    setAllText('[data-property-name-en]', this.getPropertyNameEn());
    setAllText('[data-property-name]', this.getPropertyName());
    this.applyPropertyCaptions();
  };

  FacilityMapper.prototype.getPhotos = function (facility) {
    return this.getSelectedImages((facility && facility.images) || []).filter(function (img) {
      return img && img.url;
    });
  };

  // MAPPER: facilities[i].name / nameEn → .title_box
  //
  // 원본은 h3 가 한글명, p 가 영문명이다(`야외 수영장` / `Swimming Pool`).
  // 한글명이 없으면 h3 에 영문명을 올리고 p 는 숨긴다 — 같은 문구가 두 줄
  // 반복되면 제목이 두 번 찍힌 것처럼 보인다. (index 카드와 같은 규칙)
  FacilityMapper.prototype.mapHeading = function (facility) {
    var name = this.cleanText(facility && facility.name);
    var nameEn = this.cleanText(facility && facility.nameEn);

    setAllText('[data-facility-name]', name || nameEn);

    var caption = name && nameEn !== name ? nameEn : '';
    document.querySelectorAll('[data-facility-caption]').forEach(function (el) {
      el.textContent = caption;
      el.style.display = caption ? '' : 'none';
    });
  };

  // MAPPER: facilities[i].images → .main_visual 슬라이드
  FacilityMapper.prototype.mapHeroSlides = function (facility) {
    var self = this;
    var images = this.getPhotos(facility);

    var wrapper = document.querySelector('[data-facility-hero-slides]');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    if (!images.length) {
      var empty = document.createElement('div');
      empty.className = 'swiper-slide';
      ImageHelpers.applyBackgroundPlaceholder(empty, '부대시설 이미지');
      wrapper.appendChild(empty);
      return;
    }

    images.forEach(function (img) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';
      self.setBackground(slide, img.url, '부대시설 이미지');
      wrapper.appendChild(slide);
    });
  };

  // MAPPER: property.facilities[] → .sub_cate_wrap ul (시설 탭)
  FacilityMapper.prototype.renderFacilityNav = function (facility) {
    var currentId = facility && facility.id;
    var facilities = this.getFacilities();

    document.querySelectorAll('[data-facility-nav]').forEach(function (ul) {
      ul.innerHTML = '';
      facilities.forEach(function (f) {
        var label = String(f.name || f.nameEn || '').trim();
        if (!label) return;
        var li = document.createElement('li');
        if (String(f.id) === String(currentId)) li.className = 'on';
        var a = document.createElement('a');
        a.href = './facility.html?id=' + f.id;
        a.textContent = label;
        // 탭이 화면을 넘치면 가로 스크롤로 밀어서 봐야 한다.
        // 스크롤 없이도 전체 이름을 확인할 수 있게 툴팁으로 남긴다.
        a.title = label;
        li.appendChild(a);
        ul.appendChild(li);
      });
    });
  };

  // MAPPER: facilities[i].description / usageGuide / images[0] → .special_top
  //
  // 원본 `.sp_detail` 은 소개문 한 덩어리다. 소제목이 없다.
  // usageGuide(이용 기간 / 이용 요금 등)는 소개문 아래 한 줄 띄고 이어 붙인다 —
  // 원본이 이 정보를 담던 `.special_info` 는 두 사이트 전부 주석 처리돼 있어
  // 가져오지 않았다.
  //
  // 소개 사진은 첫 장이다. 없으면 placeholder 를 세운다
  // (이 블록은 페이지의 본문이라 비었다고 숨기지 않는다).
  FacilityMapper.prototype.mapIntro = function (facility) {
    var self = this;
    var description = this.cleanText(facility && facility.description);
    var usageGuide = this.cleanText(facility && facility.usageGuide);

    var html = description ? this.nl2br(description) : '';
    if (usageGuide) {
      html += (html ? '<br /><br />' : '') + this.nl2br(usageGuide);
    }

    document.querySelectorAll('[data-facility-description]').forEach(function (el) {
      el.innerHTML = html;
      el.style.display = html ? '' : 'none';
    });

    var photos = this.getPhotos(facility);
    document.querySelectorAll('[data-facility-image]').forEach(function (el) {
      self.setBackground(el, photos.length ? photos[0].url : '', '부대시설 이미지');
    });
  };

  // MAPPER: facilities[i].images[1..] → .special_btm 사진 2칸
  //
  // ⚠️ 원본 CSS 가 `li {width:49%}` + `li+li {margin-left:2%}` 로 2칸을 전제한다.
  //    소개 블록이 첫 장을 쓰므로 **두 번째 장부터** 가져간다.
  //    사진이 모자라면 앞에서부터 순환해 채운다 — 한 칸만 남으면 오른쪽이 빈다.
  //    사진이 아예 없으면 <ul> 째 숨긴다.
  FacilityMapper.prototype.BOTTOM_COUNT = 2;

  FacilityMapper.prototype.mapBottomImages = function (facility) {
    var self = this;
    var photos = this.getPhotos(facility);

    document.querySelectorAll('[data-facility-bottom-images]').forEach(function (ul) {
      ul.innerHTML = '';
      if (!photos.length) {
        ul.style.display = 'none';
        return;
      }
      ul.style.display = '';

      for (var i = 0; i < self.BOTTOM_COUNT; i++) {
        // 첫 장은 소개 블록이 쓰므로 1번부터 세고, 모자라면 순환한다
        var photo = photos[(i + 1) % photos.length];
        var li = document.createElement('li');
        self.setBackground(li, photo.url, '');
        ul.appendChild(li);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new FacilityMapper().initialize();
  });

  global.FacilityMapper = FacilityMapper;
})(window);
