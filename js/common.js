/* ============================================================
   common.js — 전 페이지 공통 스크립트
   원본 gyeongjucaravan.co.kr /js/custom.js 의 UI 동작을 옮긴 것.
   (대조: 개울가풀빌라.kr — 두 파일은 `roundLengths: true` 6줄만 다르다)

   - PC LNB hover 서브메뉴(.depth_box)
   - 모바일 aside 패널 + aside 아코디언
   - 스크롤 시 헤더 반전(.header.on) — 로고 교체는 CSS 가 한다

   헤더·푸터는 header-footer-loader.js 가 fetch 로 주입하고, 객실·시설 메뉴는
   매퍼가 나중에 만든다. 그래서 바인딩은 window.loaderReady 이후에 하고
   동적으로 생기는 요소는 전부 이벤트 위임으로 잡는다.

   ⚠️ 원본에서 `.header.on` 은 "스크롤됨"이다. 배경이 흰색으로 바뀌고
      `.logo1`(흰 로고) → `.logo2`(검정 로고)로 갈아끼우는 상태를 뜻한다.
      전환은 전부 CSS 가 하므로 JS 는 클래스만 붙인다.

   ⚠️ Swiper 초기화는 원본처럼 여기서 하지 않는다. 매퍼가 슬라이드를 생성한 뒤
      js/pages/*.js 가 아래 TplSwiper 로 초기화한다.

   ⚠️ 원본 custom.js 의 `.btn_top` / `.btn_toggle` / `.btn_lnb_close` 핸들러는
      가져오지 않았다. 두 원본 어느 페이지에도 해당 요소가 없는 죽은 코드다.
   ============================================================ */

$(function () {
  (window.loaderReady || Promise.resolve()).then(function () {
    // ── PC LNB hover 서브메뉴 ──────────────────────────────
    // 원본은 `.depth1` 에 mouseenter/leave 를 걸고 `$('.depth_box')` **전체**를
    // 한꺼번에 slideDown 한다. 메뉴 하나에 올려도 5개 서브가 동시에 내려오는
    // 것이 이 디자인의 의도다(헤더 반투명 판이 통째로 내려온다).
    //
    // 다만 원본은 `.depth1` 이 aside 에도 같은 클래스로 존재해 모바일 패널의
    // 항목에 마우스를 올려도 PC 서브가 열린다. `#hd_lnb` 안으로 범위를 좁히고,
    // 버블링하지 않는 mouseenter/leave 를 써서 자식 간 이동 시의 깜빡임도 없앤다.
    $(document).on('mouseenter', '#hd_lnb', function () {
      clampDepthBoxes();
      $('#hd_lnb .depth_box').stop(true, true).slideDown(400);
    });
    $(document).on('mouseleave', '#hd_lnb', function () {
      $('#hd_lnb .depth_box').stop(true, true).slideUp(400);
    });

    // ── 서브메뉴 높이 상한 ─────────────────────────────────
    // ⚠️ 원본 `.depth_box` 는 static 블록이라 항목 수만큼 헤더가 늘어난다.
    //    객실이 9실인 정본(용천수)에서는 서브메뉴가 화면 밖으로 흘러내린다.
    //    화면에 남는 높이에 맞춰 자르고 그 목록만 스크롤시킨다.
    var LNB_BOTTOM_GAP = 20; // 화면 아래 남길 여백

    function clampDepthBoxes() {
      $('#hd_lnb .depth_box').each(function () {
        var el = this;
        var $box = $(this);
        $box.css({ 'max-height': '', 'overflow-y': '' });

        // display:none 이면 높이를 잴 수 없다. 보이지 않게 펼쳐 실측한 뒤 되돌린다.
        var hidden = $box.css('display') === 'none';
        if (hidden) $box.css({ display: 'block', visibility: 'hidden' });

        var room = $(window).height() - el.getBoundingClientRect().top - LNB_BOTTOM_GAP;
        var overflow = el.scrollHeight > room;

        if (hidden) $box.css({ display: '', visibility: '' });
        if (overflow) $box.css({ 'max-height': Math.max(120, room) + 'px', 'overflow-y': 'auto' });
      });
    }

    // 열려 있는 동안 창 크기가 바뀌면 다시 계산한다
    $(window).on('resize', function () {
      if ($('#hd_lnb .depth_box:visible').length) clampDepthBoxes();
    });

    // ── 모바일 aside 토글 ──────────────────────────────────
    // 원본과 동일하게 열릴 때 html/body 스크롤을 잠근다.
    $(document).on('click', '.btn_menu, .aside .btn_close', function (e) {
      e.preventDefault();
      if ($('.aside').hasClass('on')) {
        closeAside();
      } else {
        $('.aside, .aside_bg').addClass('on');
        $('html, body').css({ height: '100%', overflow: 'hidden' });
      }
    });
    $(document).on('click', '.aside_bg', closeAside);

    function closeAside() {
      $('.aside, .aside_bg').removeClass('on');
      $('html, body').css({ height: 'inherit', overflow: 'inherit' });
    }

    // ── aside 아코디언 ─────────────────────────────────────
    // ⚠️ `.aside .depth1` 로 좁힌다. PC LNB 의 li.depth1 과 클래스명이 겹친다.
    $(document).on('click', '.aside .depth1', function () {
      $('.aside .depth_list').not($(this).next()).slideUp();
      $(this).next().slideToggle();
    });

    // ── 스크롤 상단 on (헤더 반전) ─────────────────────────
    // 원본은 매 스크롤마다 addClass/removeClass 를 다시 호출한다.
    // 상태가 실제로 바뀔 때만 건드린다.
    var scrolled = null;

    function syncHeader() {
      var next = $(window).scrollTop() > 0;
      if (next === scrolled) return;
      scrolled = next;
      $('#header').toggleClass('on', next);
    }

    $(window).on('scroll', syncHeader);
    syncHeader();
  });
});

/* ============================================================
   Swiper 공용 헬퍼 (G / H / I 공통본)
   매퍼가 슬라이드를 동적 생성한 뒤 호출되므로, 같은 컨테이너에
   이미 인스턴스가 있으면 destroy 후 재생성한다.
   ============================================================ */
window.TplSwiper = (function () {
  var instances = {};

  function init(key, selector, options) {
    var el = document.querySelector(selector);
    if (!el) return null;

    // 슬라이드가 하나도 없으면 초기화하지 않는다 (매핑 전/데이터 없음)
    var slideCount = el.querySelectorAll('.swiper-slide').length;
    if (!slideCount) return null;

    if (instances[key]) {
      try {
        instances[key].destroy(true, true);
      } catch (e) {
        /* 이미 파괴된 인스턴스 무시 */
      }
      delete instances[key];
    }

    var opts = options || {};

    // loop 는 화면에 보이는 수보다 슬라이드가 많아야 정상 동작한다.
    // 부족한 상태로 켜면 Swiper 가 레이아웃을 못 잡거나 예외를 던진다.
    var perView = Number(opts.slidesPerView) || 1;
    if (opts.loop && slideCount <= perView) {
      var relaxed = {};
      Object.keys(opts).forEach(function (k) {
        relaxed[k] = opts[k];
      });
      relaxed.loop = false;
      opts = relaxed;
    }

    // 넘길 슬라이드가 없을 때 화살표를 숨길 대상 (Swiper 옵션이 아니므로 분리해 둔다)
    var lockHide = opts.lockHide;
    if (lockHide) {
      var cleaned = {};
      Object.keys(opts).forEach(function (k) {
        if (k !== 'lockHide') cleaned[k] = opts[k];
      });
      opts = cleaned;
    }

    // 한 슬라이더가 실패해도 같은 페이지의 나머지 초기화까지 멈추면 안 된다.
    try {
      instances[key] = new Swiper(selector, opts);
    } catch (e) {
      console.error('[TplSwiper] init failed:', key, selector, e);
      return null;
    }

    if (lockHide) bindLockHide(instances[key], lockHide);
    return instances[key];
  }

  // 슬라이드가 화면에 다 들어와 넘길 게 없으면 화살표 영역을 숨긴다.
  // Swiper 의 watchOverflow(기본 on)가 그 상태를 isLocked / lock·unlock 이벤트로 알려준다.
  // 브레이크포인트마다 slidesPerView 가 달라 잠김 여부가 바뀌므로 resize 에도 다시 본다.
  function bindLockHide(swiper, selector) {
    var target = document.querySelector(selector);
    if (!target || !swiper) return;

    function sync() {
      target.style.display = swiper.isLocked ? 'none' : '';
    }

    swiper.on('lock', sync);
    swiper.on('unlock', sync);
    swiper.on('resize', sync);
    sync();
  }

  // 풀높이 히어로 슬라이더 공용 초기화 — `.main_visual.visual`.
  // 원본 custom.js 의 첫 번째 `new Swiper('.main_visual .swiper-container', …)` 그대로다.
  // index 뿐 아니라 원본의 서브 페이지(room 상세 / special)도 같은 마크업·같은 옵션을 쓴다.
  //
  // ⚠️ 원본에는 `pagination: { el: '.main_visual .swiper-pagination', type: 'fraction' }`
  //    가 있지만 두 사이트 어느 페이지에도 그 요소가 없다. 죽은 옵션이라 뺐다.
  function initVisual(key) {
    return init(key || 'visual', '.main_visual .swiper-container', {
      loop: true,
      roundLengths: true,
      spaceBetween: 0,
      navigation: {
        nextEl: '.main_visual .swiper-button-next',
        prevEl: '.main_visual .swiper-button-prev'
      },
      autoplay: { delay: 4000, disableOnInteraction: false },
      // 사진이 1장이면 넘길 게 없으므로 화살표를 숨긴다
      lockHide: '.main_visual .visual_control'
    });
  }

  // 객실 카드 목록 공용 초기화 — index / layout-map / room 하단이 같은 규격을 쓴다.
  // 원본 custom.js 의 `.room_list .swiper-container` breakpoints 를 그대로 따른다
  // (280/479/861/1201 → 1/2/2/3열, spaceBetween 0/10/15/20).
  // 객실이 열 수보다 적으면 빈 칸이 생기므로 개수만큼만 배치한다.
  var ROOM_MAX_COLS = 3;

  function initRoomList(key, selector, extra) {
    var el = document.querySelector(selector);
    if (!el) return null;

    var count = el.querySelectorAll('.swiper-slide').length;
    if (!count) return null;

    var cap = function (n) {
      return Math.min(n, count);
    };
    var perView = cap(ROOM_MAX_COLS);

    var opts = {
      loop: count > perView,
      slidesPerView: perView,
      spaceBetween: 20,
      roundLengths: true,
      grabCursor: true,
      autoplay: { delay: 4000, disableOnInteraction: false },
      breakpoints: {
        280: { slidesPerView: 1, spaceBetween: 0 },
        479: { slidesPerView: cap(2), spaceBetween: 10 },
        861: { slidesPerView: cap(2), spaceBetween: 15 },
        1201: { slidesPerView: perView, spaceBetween: 20 }
      }
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        opts[k] = extra[k];
      });
    }

    return init(key, selector, opts);
  }

  return {
    init: init,
    initVisual: initVisual,
    initRoomList: initRoomList,
    instances: instances
  };
})();
