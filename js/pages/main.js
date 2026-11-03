/* ============================================================
   main.js — 펜션소개 페이지 슬라이더 초기화
   히어로는 index 와 같은 풀높이 `.main_visual.visual` 슬라이더다.

   매퍼가 슬라이드를 동적으로 만든 뒤 호출되므로 window.initMainSwipers 로
   내보내고, 매퍼가 없는 상황(데이터 로드 실패)에 대비해 스스로도 한 번 돈다.
   ============================================================ */

(function (global) {
  'use strict';

  function initMainSwipers() {
    TplSwiper.initVisual('main-hero');
  }

  global.initMainSwipers = initMainSwipers;

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!TplSwiper.instances['main-hero']) initMainSwipers();
    }, 3000);
  });
})(window);
