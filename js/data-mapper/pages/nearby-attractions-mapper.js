(function (global) {
  'use strict';

  // 출처 / 거리 판정 (C2 · D2 · E2 · G · H · I · L 과 같은 규칙)
  var SOURCE_RE = /^(자료출처|출처)/;
  var DISTANCE_RE = /^(펜션에서|숙소에서)|거리$/;

  function setAllText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  function NearbyAttractionsMapper() {
    BaseDataMapper.call(this);
  }
  NearbyAttractionsMapper.prototype = Object.create(BaseDataMapper.prototype);
  NearbyAttractionsMapper.prototype.constructor = NearbyAttractionsMapper;

  // 섹션 배정 — pages.nearbyAttractions.sections[0]
  //
  //   hero.images[0]            → .sub_visual 배경
  //   hero.title / description  → .title_box
  //   about[]                   → .travel_list 항목
  //
  // ⚠️ 이 섹션의 `about` 은 **여행지 항목 배열**이다.
  //    layout-map / reservation 의 `about` 은 단일 객체라 헷갈리기 쉽다.
  //    (main 의 about 만 여기와 같은 배열이다)
  NearbyAttractionsMapper.prototype.getSection = function () {
    var page = this.getPages().nearbyAttractions;
    return (page && page.sections && page.sections[0]) || null;
  };

  NearbyAttractionsMapper.prototype.mapPage = function () {
    var section = this.getSection();

    // enabled=false (또는 섹션 자체가 없음) → 404 리다이렉트.
    // 헤더 TRAVEL 메뉴도 header-footer-mapper 가 같은 기준으로 숨긴다.
    // 백오피스 preview 에서는 리다이렉트하지 않는다 (layout-map 과 같은 규칙).
    if (!section || section.enabled === false) {
      window.location.href = '404.html';
      return;
    }

    this.mapPropertyNames();
    this.mapHero();
    this.mapLead();
    this.mapList();
  };

  NearbyAttractionsMapper.prototype.mapPropertyNames = function () {
    setAllText('[data-property-name-en]', this.getPropertyNameEn());
    setAllText('[data-property-name]', this.getPropertyName());
    this.applyPropertyCaptions();
  };

  NearbyAttractionsMapper.prototype.setCopySlot = function (selector, value, asHtml) {
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

  // MAPPER: hero.images → .sub_visual 배경
  //
  // 제목(TRAVEL)은 페이지 이름이라 HTML 에 고정이고, 아래 한 줄만 채운다.
  // 원본 문구는 `{숙소명} 주변여행지` 로 두 사이트가 같다.
  // 사진은 hero → 첫 여행지 사진 → 숙소 주변/외경 순으로 떨어진다.
  NearbyAttractionsMapper.prototype.mapHero = function () {
    var self = this;
    var hero = (this.getSection() || {}).hero || {};
    var name = this.getPropertyName();

    this.setCopySlot('[data-nearby-visual-description]', name ? name + ' 주변여행지' : '');

    var url =
      this.getFirstSelectedImage(hero.images || []) ||
      this.firstItemImageUrl() ||
      (this.pickPropertyImage(['surrounding', 'exterior', 'thumbnail']) || {}).url ||
      '';

    document.querySelectorAll('[data-nearby-hero]').forEach(function (el) {
      self.setBackground(el, url, '주변 여행지 이미지');
    });
  };

  NearbyAttractionsMapper.prototype.firstItemImageUrl = function () {
    var items = this.getItems();
    for (var i = 0; i < items.length; i++) {
      var url = this.getFirstSelectedImage((items[i] && items[i].images) || []);
      if (url) return url;
    }
    return '';
  };

  // MAPPER: hero.title / hero.description → .title_box
  // 흰 지면 위 제목이라 업주 문구를 그대로 받아도 레이아웃이 무너지지 않는다.
  NearbyAttractionsMapper.prototype.LEAD_FALLBACK_TITLE = '주변여행지';

  NearbyAttractionsMapper.prototype.mapLead = function () {
    var hero = (this.getSection() || {}).hero || {};

    setAllText('[data-nearby-title]', this.firstText(hero.title, this.LEAD_FALLBACK_TITLE));
    this.setCopySlot(
      '[data-nearby-description]',
      this.firstText(hero.description, '펜션 근처의 주요 관광지 정보를 확인해보세요.'),
      true
    );
  };

  NearbyAttractionsMapper.prototype.getItems = function () {
    var section = this.getSection() || {};
    var about = section.about;
    if (Array.isArray(about) && about.length) return about;

    // 폴백: property.nearbyAttractions[] 는 문자열 태그 배열이다(이름만 있다)
    var fallback = this.getProperty().nearbyAttractions || [];
    return fallback
      .map(function (v) {
        return typeof v === 'string' ? { title: v } : v;
      })
      .filter(Boolean);
  };

  // MAPPER: 여행지 목록 → .travel_list ul
  //
  // 원본 li 는 `.img > img` + `.txt > strong + p` 구조다.
  // 홀수/짝수 li 의 사진 위치가 좌우로 교차한다(원본 CSS 의 nth-of-type).
  //
  // 항목이 하나도 없으면 목록을 비운 채 둔다. float 교차 그리드라
  // 빈 li 를 넣으면 다음 항목의 좌우가 뒤집힌다.
  NearbyAttractionsMapper.prototype.mapList = function () {
    var self = this;
    var ul = document.querySelector('[data-nearby-list]');
    if (!ul) return;
    ul.innerHTML = '';

    this.getItems().forEach(function (item) {
      var title = self.cleanText(item && item.title);
      if (!title) return;
      ul.appendChild(self.buildItem(item, title));
    });
  };

  NearbyAttractionsMapper.prototype.buildItem = function (item, title) {
    var li = document.createElement('li');
    var images = this.getSelectedImages(item.images || []);
    var first = images[0] || null;

    var imgBox = document.createElement('div');
    imgBox.className = 'img';
    var img = document.createElement('img');
    ImageHelpers.setImage(img, first && first.url, title || '여행지 이미지');
    imgBox.appendChild(img);
    li.appendChild(imgBox);

    var txt = document.createElement('div');
    txt.className = 'txt';

    var strong = document.createElement('strong');
    strong.textContent = title;
    txt.appendChild(strong);

    var parsed = this.splitDescription(item.description, first);
    // 본문·출처·거리가 모두 없으면 <p> 를 만들지 않는다
    // (property.nearbyAttractions[] 문자열 폴백은 이름만 있다)
    if (parsed.body || parsed.source || parsed.distance) {
      var p = document.createElement('p');
      if (parsed.body) p.innerHTML = this.nl2br(parsed.body);

      // ⚠️ 원본은 출처와 거리를 **하나의 span 안에** <br> 로 이어 둔다.
      //    (I 계열은 span + em 두 요소로 나뉘어 있어 여기와 다르다)
      if (parsed.source || parsed.distance) {
        if (parsed.body) {
          p.appendChild(document.createElement('br'));
          p.appendChild(document.createElement('br'));
        }
        var span = document.createElement('span');
        if (parsed.source) span.appendChild(document.createTextNode(parsed.source));
        if (parsed.distance) {
          if (parsed.source) span.appendChild(document.createElement('br'));
          span.appendChild(document.createTextNode(parsed.distance));
        }
        p.appendChild(span);
      }
      txt.appendChild(p);
    }

    li.appendChild(txt);
    return li;
  };

  // 본문 / 자료출처 / 거리 세 덩어리로 나눈다.
  //
  //   거리는 images[0].description 이 정본이다.
  //   출처는 전용 필드가 없어 description 안에서 가려낸다.
  //
  // 출처·거리는 **각각 첫 번째로 매칭된 줄 하나만** 쓰고 나머지는 본문으로 남는다.
  // 줄 순서는 상관없다.
  NearbyAttractionsMapper.prototype.splitDescription = function (description, firstImage) {
    var distance = this.cleanText(firstImage && firstImage.description);
    var source = '';
    var body = [];

    this.cleanText(description)
      .split('\n')
      .forEach(function (raw) {
        var line = raw.trim();
        if (!line) return;
        if (!source && SOURCE_RE.test(line)) {
          source = line;
          return;
        }
        if (!distance && DISTANCE_RE.test(line)) {
          distance = line;
          return;
        }
        body.push(line);
      });

    return { body: body.join('\n'), source: source, distance: distance };
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new NearbyAttractionsMapper().initialize();
  });

  global.NearbyAttractionsMapper = NearbyAttractionsMapper;
})(window);
