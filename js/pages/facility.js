/* ============================================================
   facility.js — 부대시설 페이지 슬라이더 초기화
   히어로(풀높이 `.main_visual.visual`) 하나뿐이다.
   원본 special 페이지에는 하단 카드 목록이 없다 — 이동은 탭으로 한다.
   ============================================================ */

(function (global) {
  'use strict';

  function initFacilitySwipers() {
    TplSwiper.initVisual('facility-hero');
  }

  global.initFacilitySwipers = initFacilitySwipers;

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!TplSwiper.instances['facility-hero']) initFacilitySwipers();
    }, 3000);
  });
})(window);
