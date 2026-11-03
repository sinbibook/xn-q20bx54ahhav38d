(function (global) {
  'use strict';

  // 1평 = 3.305785㎡
  var SQM_PER_PYEONG = 3.305785;

  function setAllText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  function RoomMapper() {
    BaseDataMapper.call(this);
  }
  RoomMapper.prototype = Object.create(BaseDataMapper.prototype);
  RoomMapper.prototype.constructor = RoomMapper;

  // 섹션 배정 — pages.room[] 은 객실별 배열이다 (id 로 찾는다).
  //
  //   hero.images    → .main_visual 슬라이드
  //   gallery.images → .room_detail_img (객실 사진 묶음)
  //
  // 객실명 / 구조 / 인원 / 평형 / 집기품목은 전부 roomtypes[] + rooms[] 에서 온다.
  //
  // ⚠️ 객실 목록의 단일 소스는 customFields.roomtypes 다. 최상위 rooms[] 는
  //    같은 id 매칭으로 **상세값을 조회할 때만** 쓴다.
  RoomMapper.prototype.getRoomId = function () {
    var params = new URLSearchParams(window.location.search);
    return params.get('room_id') || params.get('roomId') || '';
  };

  // 현재 객실. room_id 가 없거나 못 찾으면 첫 번째 객실로 떨어진다.
  RoomMapper.prototype.getCurrentRoomtype = function () {
    var roomtypes = this.getRoomtypes();
    if (!roomtypes.length) return null;

    var id = this.getRoomId();
    if (id) {
      for (var i = 0; i < roomtypes.length; i++) {
        if (String(roomtypes[i].id) === String(id)) return roomtypes[i];
      }
    }
    return roomtypes[0];
  };

  RoomMapper.prototype.getSection = function (roomtype) {
    var pages = this.getPages().room;
    if (!Array.isArray(pages) || !roomtype) return {};
    for (var i = 0; i < pages.length; i++) {
      if (String(pages[i].id) === String(roomtype.id)) {
        return (pages[i].sections && pages[i].sections[0]) || {};
      }
    }
    return {};
  };

  RoomMapper.prototype.mapPage = function () {
    var roomtype = this.getCurrentRoomtype();

    this.mapPropertyNames();
    this.mapHeroSlides(roomtype);
    // ⚠️ 여기만 currentId 를 넘긴다. 그룹 안이면 탭이 그 그룹의 객실로 펼쳐진다.
    //    (헤더 메뉴 / layout-map 은 항상 그룹명으로 접힌 목록이다)
    this.renderRoomNav('[data-room-nav]', roomtype ? roomtype.id : null);
    this.mapRoomHeading(roomtype);
    this.mapNotice(roomtype);
    this.mapTable(roomtype);
    this.mapDetailImages(roomtype);
    this.mapFloorplan(roomtype);
    this.mapRoomListIntro();
    this.renderRoomSlides('[data-room-list-slides]');

    if (typeof window.initRoomSwipers === 'function') window.initRoomSwipers();
  };

  RoomMapper.prototype.mapPropertyNames = function () {
    setAllText('[data-property-name-en]', this.getPropertyNameEn());
    setAllText('[data-property-name]', this.getPropertyName());
    this.applyPropertyCaptions();
  };

  RoomMapper.prototype.setCopySlot = function (selector, value, asHtml) {
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

  // 객실 사진 — 인테리어 우선, 없으면 썸네일.
  // 평면도는 섞이지 않는다 (getRoomtypeImages 가 category 로 거른다).
  RoomMapper.prototype.getRoomPhotos = function (roomtype) {
    var interiors = this.getRoomtypeImages(roomtype, 'roomtype_interior');
    var thumbs = this.getRoomtypeImages(roomtype, 'roomtype_thumbnail');
    var list = interiors.length ? interiors : thumbs;
    return list.filter(function (img) {
      return img && img.url;
    });
  };

  // MAPPER: hero.images / 객실 사진 → .main_visual 슬라이드
  RoomMapper.prototype.mapHeroSlides = function (roomtype) {
    var self = this;
    var section = this.getSection(roomtype);
    var hero = section.hero || {};

    var images = this.getSelectedImages(hero.images || []).filter(function (img) {
      return img && img.url;
    });
    if (!images.length) images = this.getRoomPhotos(roomtype);

    var wrapper = document.querySelector('[data-room-hero-slides]');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    if (!images.length) {
      var empty = document.createElement('div');
      empty.className = 'swiper-slide';
      ImageHelpers.applyBackgroundPlaceholder(empty, '객실 이미지');
      wrapper.appendChild(empty);
      return;
    }

    images.forEach(function (img) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';
      self.setBackground(slide, img.url, '객실 이미지');
      wrapper.appendChild(slide);
    });
  };

  // MAPPER: 객실명 + 구조 문자열 → .room_title / 표
  //
  // ⚠️ document.title 은 여기서 건드리지 않는다.
  //    HeaderFooterMapper.updateMetaTags() 가 homepage.seo.title 로 <title> 을 채우는데,
  //    preview-handler 는 페이지 매퍼 → 헤더푸터 매퍼 순으로 돌리고 standalone 은
  //    DOMContentLoaded / headerFooterLoaded 순서가 확정적이지 않다.
  //    여기서 객실명을 넣으면 실행 순서에 따라 제목이 오락가락한다.
  RoomMapper.prototype.mapRoomHeading = function (roomtype) {
    var room = this.findRoomById(roomtype && roomtype.id) || {};

    // 상세 페이지의 제목은 **객실명**이다. 그룹명이 아니다
    // (그룹명은 헤더 메뉴 / 미리보기 카드에서만 쓴다).
    setAllText('[data-room-name]', this.getRoomtypeName(roomtype));
    setAllText('[data-room-structure]', this.formatRoomStructure(room));
  };

  // MAPPER: rooms[].roomInfo / usageGuide → .notice_li
  // 원본은 `자세한 내용은 이용안내 페이지 확인 부탁드립니다.` 한 줄이다.
  // 줄바꿈이 있으면 줄마다 li 를 만든다.
  RoomMapper.prototype.NOTICE_FALLBACK = '자세한 내용은 이용안내 페이지 확인 부탁드립니다.';

  RoomMapper.prototype.mapNotice = function (roomtype) {
    var room = this.findRoomById(roomtype && roomtype.id) || {};
    var body = this.firstText(room.roomInfo, room.usageGuide, this.NOTICE_FALLBACK);

    var lines = body.split('\n').filter(function (line) {
      return line.trim();
    });

    document.querySelectorAll('[data-room-notice]').forEach(function (ul) {
      ul.innerHTML = '';
      if (!lines.length) {
        ul.style.display = 'none';
        return;
      }
      ul.style.display = '';
      lines.forEach(function (line) {
        var li = document.createElement('li');
        li.textContent = line.trim();
        ul.appendChild(li);
      });
    });
  };

  // MAPPER: rooms[] → 객실 정보 표 + 집기품목
  //
  // 원본 표는 `객실명 / 기준 / 최대 / 유형 / 평형` 5열이다.
  // 값이 없는 칸은 `-` 로 둔다 — 비우면 표의 행 높이가 무너진다.
  RoomMapper.prototype.mapTable = function (roomtype) {
    var room = this.findRoomById(roomtype && roomtype.id) || {};

    var base = Number(room.baseOccupancy);
    var max = Number(room.maxOccupancy);
    setAllText('[data-room-base-occupancy]', base ? String(base) : '-');
    setAllText('[data-room-max-occupancy]', max ? String(max) : '-');

    // 평형은 항상 `평` 으로 낸다. ㎡ 는 노출하지 않는다.
    // sizePyeong 이 없으면 size(㎡)에서 환산한다.
    //
    // ⚠️ base-mapper 의 toPyeong() 은 '4평' 같은 **문자열**을 돌려준다.
    //    여기서는 소수점 2자리(원본 표기 `4.00평`)로 맞춰야 해서 직접 환산한다.
    var pyeong = Number(room.sizePyeong);
    if (!pyeong && Number(room.size)) pyeong = Number(room.size) / SQM_PER_PYEONG;
    setAllText('[data-room-size]', pyeong ? pyeong.toFixed(2) + '평' : '-');

    // 집기품목. 배열이 비면 줄째 숨긴다 ("집기품목 :" 만 남는 빈 줄 방지)
    var amenities = (room.amenities || []).filter(function (a) {
      return a && String(a).trim();
    });
    document.querySelectorAll('[data-room-amenities]').forEach(function (ul) {
      ul.innerHTML = '';
      if (!amenities.length) {
        ul.style.display = 'none';
        return;
      }
      ul.style.display = '';
      var li = document.createElement('li');
      var strong = document.createElement('strong');
      strong.textContent = '집기품목';
      li.appendChild(strong);
      li.appendChild(document.createTextNode(' : ' + amenities.join(', ')));
      ul.appendChild(li);
    });
  };

  // ── 객실 사진 묶음 ───────────────────────────────────────
  // 원본 `.room_detail_img` 는 **6장 고정**이다.
  //
  //   ul:nth-of-type(1) — 2칸 (49% × 420px)
  //   div               — 1칸 (100% × 550px)
  //   ul:nth-of-type(2) — 3칸 (32% × 250px)
  //
  // ⚠️ 두 원본의 객실 12개(용천수 9 + 개울가 3)가 **예외 없이 6장**이다.
  //    객실마다 사진이 13~26장씩 있는데도 여기엔 6장만 골라 넣고 나머지는
  //    히어로 슬라이더가 보여준다. 넘치는 만큼 덩어리를 반복하면 원본에 없는
  //    길이가 되므로(18장이면 세로 4000px) 앞에서부터 6장만 쓴다.
  //
  // 6장이 안 될 때는 빈 칸이 생기지 않도록 아래처럼 줄인다.
  //   5,4,3장 → 2 + 1 + 나머지
  //   2장     → 2 (큰 사진 없음)
  //   1장     → 큰 사진 1장
  RoomMapper.prototype.DETAIL_MAX = 6;

  RoomMapper.prototype.buildPhotoBlock = function (images) {
    var self = this;
    var block = document.createElement('div');
    block.className = 'room_detail_img inner';

    var rest = images.slice();

    function addRow(count) {
      var picked = rest.splice(0, count);
      if (!picked.length) return;
      var ul = document.createElement('ul');
      picked.forEach(function (img) {
        var li = document.createElement('li');
        self.setBackground(li, img.url, '');
        ul.appendChild(li);
      });
      block.appendChild(ul);
    }

    function addWide() {
      var picked = rest.splice(0, 1);
      if (!picked.length) return;
      var div = document.createElement('div');
      self.setBackground(div, picked[0].url, '');
      block.appendChild(div);
    }

    if (rest.length === 1) {
      addWide();
    } else {
      addRow(2);
      addWide();
      addRow(3);
    }

    return block;
  };

  // MAPPER: gallery.images / 객실 사진 → .room_detail_img
  RoomMapper.prototype.mapDetailImages = function (roomtype) {
    var section = this.getSection(roomtype);
    var gallery = section.gallery || {};

    var images = this.getSelectedImages(gallery.images || []).filter(function (img) {
      return img && img.url;
    });
    if (!images.length) images = this.getRoomPhotos(roomtype);

    var host = document.querySelector('[data-room-detail-images]');
    if (!host) return;
    host.innerHTML = '';

    // 사진이 하나도 없으면 영역째 비운다. 원본이 배경 <div> 뿐이라
    // placeholder 를 세우면 안내 문구만 6칸 깔린다.
    if (!images.length) return;

    host.appendChild(this.buildPhotoBlock(images.slice(0, this.DETAIL_MAX)));
  };

  // MAPPER: 이미지 카테고리 `floor_plan` → 객실 평면도
  //
  // 크롤러가 객실 상세의 평면도 영역에서 찾았을 때만 채워지는 값이다.
  // **없으면 제목까지 영역째 숨긴다.** 평면도는 부가 정보라 placeholder 를 세우면
  // 안내 문구만 덩그러니 남는다. (layout-map 의 배치도는 그 페이지의 본 목적이라 반대다)
  //
  // ⚠️ 일반 객실 사진으로 폴백하지 않는다. 평면도 자리에 인테리어 사진이
  //    들어가면 잘못된 정보다.
  RoomMapper.prototype.mapFloorplan = function (roomtype) {
    var self = this;
    var images = this.getRoomFloorplanImages(roomtype).filter(function (img) {
      return img && img.url;
    });
    var wrap = document.querySelector('[data-room-floorplan]');
    var host = document.querySelector('[data-room-floorplan-images]');

    if (!images.length) {
      if (wrap) wrap.style.display = 'none';
      return;
    }
    if (wrap) wrap.style.display = '';
    if (!host) return;

    var name = this.getRoomtypeName(roomtype);
    host.innerHTML = '';
    images.forEach(function (image) {
      var img = document.createElement('img');
      var label = self.cleanText(image.description) || (name ? name + ' 평면도' : '평면도');
      ImageHelpers.setImage(img, image.url, label);
      host.appendChild(img);
    });
  };

  // MAPPER: .main_room .title_box — 배정할 블록이 없어 원본 문구 + 숙소명이다.
  // index / layout-map 의 같은 자리와 문구를 맞춘다.
  RoomMapper.prototype.mapRoomListIntro = function () {
    var name = this.getPropertyName();
    this.setCopySlot('[data-room-list-description]', name ? name + '의 객실을 소개합니다.' : '');
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new RoomMapper().initialize();
  });

  global.RoomMapper = RoomMapper;
})(window);
