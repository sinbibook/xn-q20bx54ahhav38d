/* ============================================================
   room.js — 객실 상세 페이지 슬라이더 초기화
   히어로(풀높이 `.main_visual.visual`) + 하단 객실 미리보기 카드 2개다.
   ============================================================ */

(function (global) {
  'use strict';

  function initRoomSwipers() {
    TplSwiper.initVisual('room-hero');

    TplSwiper.initRoomList('room-list', '.main_room .room_list .swiper-container', {
      navigation: {
        nextEl: '.main_room .swiper-button-next',
        prevEl: '.main_room .swiper-button-prev'
      },
      lockHide: '.main_room .arw'
    });
  }

  global.initRoomSwipers = initRoomSwipers;

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!TplSwiper.instances['room-hero']) initRoomSwipers();
    }, 3000);
  });
})(window);
