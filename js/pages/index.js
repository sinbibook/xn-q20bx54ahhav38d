/* ============================================================
   index.js — 메인 페이지 슬라이더 초기화
   원본 gyeongjucaravan.co.kr /js/custom.js 의 Swiper 3개를 옮긴 것.

   매퍼가 슬라이드를 동적으로 만든 뒤 호출되므로 window.initIndexSwipers 로
   내보내고, 매퍼가 없는 상황(데이터 로드 실패)에 대비해 스스로도 한 번 돈다.
   ============================================================ */

(function (global) {
  'use strict';

  function initIndexSwipers() {
    // ── 히어로 (원본: swiper) ───────────────────────────────
    // main.html 과 같은 풀높이 슬라이더다. TplSwiper 공용본을 쓴다.
    TplSwiper.initVisual('index-hero');

    // ── 객실 미리보기 (원본: swiper2) ───────────────────────
    // 3열 카드. breakpoints 는 TplSwiper.initRoomList 가 원본 값을 그대로 쓴다.
    TplSwiper.initRoomList('index-room', '.main_room .room_list .swiper-container', {
      navigation: {
        nextEl: '.main_room .swiper-button-next',
        prevEl: '.main_room .swiper-button-prev'
      },
      lockHide: '.main_room .arw'
    });

    // ── 스페셜 포인트 (원본: swiper4) ───────────────────────
    // 1장씩. 좌측 텍스트 + 우측 사진(63%)이 한 카드다.
    TplSwiper.init('index-special', '.main_special .swiper-container', {
      loop: true,
      slidesPerView: 1,
      spaceBetween: 0,
      roundLengths: true,
      navigation: {
        nextEl: '.main_special .swiper-button-next',
        prevEl: '.main_special .swiper-button-prev'
      },
      pagination: {
        el: '.main_special .swiper-pagination',
        clickable: true
      },
      lockHide: '.main_special .arw'
    });
  }

  global.initIndexSwipers = initIndexSwipers;

  // 매퍼가 돌지 않는 경우(데이터 로드 실패 등)에도 원본 마크업이 있으면 초기화한다
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!TplSwiper.instances['index-hero']) initIndexSwipers();
    }, 3000);
  });
})(window);
