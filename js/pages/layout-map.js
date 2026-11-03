/* ============================================================
   layout-map.js — 객실 미리보기 페이지 슬라이더 초기화
   히어로는 `.sub_visual`(단일 배경)이라 슬라이더가 없다. 객실 카드만 돌린다.
   ============================================================ */

(function (global) {
  'use strict';

  function initLayoutMapSwipers() {
    TplSwiper.initRoomList('layoutmap-room', '.main_room .room_list .swiper-container', {
      navigation: {
        nextEl: '.main_room .swiper-button-next',
        prevEl: '.main_room .swiper-button-prev'
      },
      lockHide: '.main_room .arw'
    });
  }

  global.initLayoutMapSwipers = initLayoutMapSwipers;

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!TplSwiper.instances['layoutmap-room']) initLayoutMapSwipers();
    }, 3000);
  });
})(window);
