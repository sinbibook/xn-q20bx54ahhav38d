(function (global) {
  'use strict';

  function setAllText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  function DirectionsMapper() {
    BaseDataMapper.call(this);
  }
  DirectionsMapper.prototype = Object.create(BaseDataMapper.prototype);
  DirectionsMapper.prototype.constructor = DirectionsMapper;

  // 섹션 배정 — pages.directions.sections[0]
  //
  //   hero.images       → .sub_visual 배경
  //   hero.title        → .title_box h3   (폴백 `오시는 길`)
  //   hero.description  → .title_box p    (폴백 원본 문장 + 숙소명)
  //   notice            → .location_info 의 **두 번째** dt/dd 쌍
  //
  // 첫 번째 쌍(`자가용 이용시`)은 property.address 로 만든다.
  // 지도 좌표도 property 에서 온다.
  DirectionsMapper.prototype.getSection = function () {
    var page = this.getPages().directions;
    return (page && page.sections && page.sections[0]) || {};
  };

  DirectionsMapper.prototype.mapPage = function () {
    this.mapPropertyNames();
    this.mapHero();
    this.mapLead();
    this.mapInfo();
    this.mapKakaoMap();
  };

  DirectionsMapper.prototype.mapPropertyNames = function () {
    setAllText('[data-property-name-en]', this.getPropertyNameEn());
    setAllText('[data-property-name]', this.getPropertyName());
    this.applyPropertyCaptions();
  };

  // 값이 없으면 요소째 숨긴다. 빈 <p> 를 남기면 원본 margin 때문에 빈 줄이 생긴다.
  DirectionsMapper.prototype.setCopySlot = function (selector, value, asHtml) {
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
  // 제목(LOCATION)은 페이지 이름이라 HTML 에 고정이고, 아래 한 줄만 채운다.
  // 원본 문구는 `{숙소명} 찾아오시는 길` 로 두 사이트가 같다.
  DirectionsMapper.prototype.mapHero = function () {
    var self = this;
    var hero = this.getSection().hero || {};
    var name = this.getPropertyName();

    this.setCopySlot('[data-directions-visual-description]', name ? name + ' 찾아오시는 길' : '');

    var url =
      this.getFirstSelectedImage(hero.images || []) ||
      (this.pickPropertyImage(['surrounding', 'exterior', 'thumbnail']) || {}).url ||
      '';

    document.querySelectorAll('[data-directions-hero]').forEach(function (el) {
      self.setBackground(el, url, '오시는길 이미지');
    });
  };

  // MAPPER: hero.title / hero.description → .title_box
  DirectionsMapper.prototype.LEAD_FALLBACK_TITLE = '오시는 길';

  DirectionsMapper.prototype.mapLead = function () {
    var hero = this.getSection().hero || {};
    var name = this.getPropertyName();

    setAllText('[data-directions-title]', this.firstText(hero.title, this.LEAD_FALLBACK_TITLE));

    this.setCopySlot(
      '[data-directions-description]',
      this.firstText(
        hero.description,
        (name ? name + '에 ' : '') + '찾아오시는 길을 안내해 드립니다.'
      ),
      true
    );
  };

  // ── 교통 안내 ────────────────────────────────────────────
  // 원본 `.location_info` 는 dt/dd 두 쌍이다.
  //
  //   자가용 이용시   — 네비 안내 + 도로명/지번 주소
  //   대중교통 이용시 — 정류장·도보 경로 안내
  //
  // 앞 쌍은 property.address 로 만든다. 원본은 도로명·지번 두 줄이었지만
  // 데이터에 지번이 없어 도로명 한 줄만 쓴다.
  // 뒤 쌍만 notice 블록이 채운다 — notice 는 { title, description } 하나뿐이다.
  //
  // 쌍이 하나도 만들어지지 않으면 dl 째 숨긴다. dt 만 남으면 빈 항목이 된다.
  DirectionsMapper.prototype.CAR_TITLE = '자가용 이용시';
  DirectionsMapper.prototype.CAR_LEAD = '네비게이션에 주소를 검색해주세요.';
  DirectionsMapper.prototype.TRANSIT_TITLE = '대중교통 이용시';

  DirectionsMapper.prototype.mapInfo = function () {
    var self = this;
    var notice = this.getSection().notice || {};
    var address = this.cleanText(this.getProperty().address);

    var items = [];

    if (address) {
      items.push({
        title: this.CAR_TITLE,
        body: this.CAR_LEAD + '\n\n도로명 주소 : ' + address
      });
    }

    var transitBody = this.cleanText(notice.description);
    if (transitBody) {
      items.push({
        title: this.firstText(notice.title, this.TRANSIT_TITLE),
        body: transitBody
      });
    }

    document.querySelectorAll('[data-directions-info]').forEach(function (dl) {
      dl.innerHTML = '';
      if (!items.length) {
        dl.style.display = 'none';
        return;
      }
      dl.style.display = '';

      items.forEach(function (item) {
        var dt = document.createElement('dt');
        dt.textContent = item.title;
        var dd = document.createElement('dd');
        dd.innerHTML = self.nl2br(item.body);
        dl.appendChild(dt);
        dl.appendChild(dd);
      });
    });
  };

  // ── 지도 ────────────────────────────────────────────────
  // 원본은 daum roughmap 퍼가기 스크립트를 썼다. 업체 고유 key 가 필요해
  // 재현할 수 없으므로 Kakao Maps SDK(js/kakao-maps-sdk.js)로 대체했다.
  //
  // preview 는 데이터가 바뀔 때마다 매핑을 다시 돌린다. 그때마다 new Map() 을
  // 만들면 인스턴스가 쌓이므로, 이미 있으면 중심만 옮긴다.
  DirectionsMapper.prototype.mapKakaoMap = function () {
    var self = this;
    var container = document.getElementById('kakao-map');
    if (!container) return;

    var prop = this.getProperty();
    var lat = Number(prop.latitude);
    var lng = Number(prop.longitude);

    // 좌표가 없어도 영역은 유지한다. 안을 비우면 테두리만 남은 빈 띠가 되어
    // 페이지가 무너진 것처럼 보인다.
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      ImageHelpers.applyBackgroundPlaceholder(container, '지도');
      return;
    }
    container.classList.remove('empty-image-placeholder');
    container.style.backgroundImage = '';

    function createMap() {
      try {
        var position = new kakao.maps.LatLng(lat, lng);

        if (self._kakaoMap) {
          self._kakaoMap.setCenter(position);
          self._kakaoMap.relayout();
          if (self._kakaoMarker) self._kakaoMarker.setPosition(position);
          return;
        }

        self._kakaoMap = new kakao.maps.Map(container, { center: position, level: 4 });
        self._kakaoMarker = new kakao.maps.Marker({ position: position });
        self._kakaoMarker.setMap(self._kakaoMap);

        // 지도가 숨겨진 상태로 생성되면 크기를 0 으로 잡는다. 노출 후 다시 계산한다.
        window.addEventListener('resize', function () {
          if (!self._kakaoMap) return;
          self._kakaoMap.relayout();
          self._kakaoMap.setCenter(position);
        });
      } catch (e) {
        console.error('[directions] kakao map init failed:', e);
      }
    }

    if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
      window.kakao.maps.load(createMap);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new DirectionsMapper().initialize();
  });

  global.DirectionsMapper = DirectionsMapper;
})(window);
