(function (global) {
  'use strict';

  function setAllText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  function ReservationMapper() {
    BaseDataMapper.call(this);
  }
  ReservationMapper.prototype = Object.create(BaseDataMapper.prototype);
  ReservationMapper.prototype.constructor = ReservationMapper;

  // 섹션 배정 — pages.reservation.sections[0]
  //
  //   hero.images            → .sub_visual 배경
  //   hero.title/description → .title_box
  //   이용안내               → property.address + usageGuide
  //   환불정보               → property.refundPolicies + refundSettings
  //
  // ⚠️ 여기 `about` 은 단일 객체다(nearbyAttractions / main 의 배열과 다르다).
  //    dt/dd 두 쌍이 `이용안내` / `환불정보` 고정 라벨이라 내려놓을 자리가
  //    없어 쓰지 않는다. 사진 폴백으로만 본다.
  ReservationMapper.prototype.getSection = function () {
    var page = this.getPages().reservation;
    return (page && page.sections && page.sections[0]) || {};
  };

  ReservationMapper.prototype.mapPage = function () {
    this.mapPropertyNames();
    this.mapHero();
    this.mapLead();
    this.mapInfo();
    this.mapRefund();
  };

  ReservationMapper.prototype.mapPropertyNames = function () {
    setAllText('[data-property-name-en]', this.getPropertyNameEn());
    setAllText('[data-property-name]', this.getPropertyName());
    this.applyPropertyCaptions();
  };

  ReservationMapper.prototype.setCopySlot = function (selector, value, asHtml) {
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
  // 제목(RESERVATION)은 페이지 이름이라 HTML 에 고정이고, 아래 한 줄만 채운다.
  // 원본 문구는 `{숙소명} 이용안내` 로 두 사이트가 같다.
  ReservationMapper.prototype.mapHero = function () {
    var self = this;
    var section = this.getSection();
    var name = this.getPropertyName();

    this.setCopySlot('[data-reservation-visual-description]', name ? name + ' 이용안내' : '');

    var url =
      this.getFirstSelectedImage((section.hero || {}).images || []) ||
      this.getFirstSelectedImage((section.about || {}).images || []) ||
      (this.pickPropertyImage(['exterior', 'thumbnail', 'commonArea']) || {}).url ||
      '';

    document.querySelectorAll('[data-reservation-hero]').forEach(function (el) {
      self.setBackground(el, url, '이용안내 이미지');
    });
  };

  // MAPPER: hero.title / hero.description → .title_box
  ReservationMapper.prototype.LEAD_FALLBACK_TITLE = '이용안내';

  ReservationMapper.prototype.mapLead = function () {
    var hero = this.getSection().hero || {};

    setAllText('[data-reservation-title]', this.firstText(hero.title, this.LEAD_FALLBACK_TITLE));
    this.setCopySlot(
      '[data-reservation-description]',
      this.firstText(hero.description, '예약시 참고하실 사항을 안내해 드립니다.'),
      true
    );
  };

  // MAPPER: property.address + usageGuide → `이용안내` dd
  //
  // 원본은 `[입퇴실안내] [인원추가정보] [개별바베큐] [공용수영장] …` 을
  // 이어 붙인 긴 글이다. 그 덩어리가 통째로 property.usageGuide 다.
  //
  // ⚠️ checkInOutInfo 를 함께 붙이면 안 된다. usageGuide 안에 이미 [입퇴실안내]
  //    절이 들어 있어 같은 내용이 두 번 나온다. usageGuide 가 비었을 때만
  //    checkInOutInfo + reservationGuide 로 대신한다.
  ReservationMapper.prototype.mapInfo = function () {
    var self = this;
    var prop = this.getProperty();
    var address = this.cleanText(prop.address);

    var guide = this.cleanText(prop.usageGuide);
    if (!guide) {
      guide = [this.cleanText(prop.checkInOutInfo), this.cleanText(prop.reservationGuide)]
        .filter(Boolean)
        .join('\n\n');
    }

    var parts = [];
    if (address) parts.push('주소 : ' + address);
    if (guide) parts.push(guide);

    var html = parts.join('\n\n');
    document.querySelectorAll('[data-reservation-info-body]').forEach(function (el) {
      el.innerHTML = html ? self.nl2br(html) : '';
    });
  };

  // 환불 규정 한 줄 만들기.
  //   가장 이른 날짜   → "이용일 N일 이전 취소 시"  (그보다 전은 모두 같은 조건)
  //   당일(0일)        → "이용일 당일 취소 시"
  //   그 사이          → "이용일 N일 전 취소 시"
  //   비율 100 / 0     → "전액 환불" / "환불 불가"
  ReservationMapper.prototype.formatRefundPolicies = function () {
    var list = (this.getProperty().refundPolicies || [])
      .filter(function (p) {
        return p && p.refundProcessingDays !== undefined && p.refundProcessingDays !== null;
      })
      .slice()
      .sort(function (a, b) {
        return Number(b.refundProcessingDays) - Number(a.refundProcessingDays);
      });

    if (!list.length) return '';

    var maxDays = Number(list[0].refundProcessingDays);

    return list
      .map(function (policy) {
        var days = Number(policy.refundProcessingDays);
        var rate = Number(policy.refundRate);

        var when;
        if (days === 0) when = '이용일 당일';
        else if (days === maxDays) when = '이용일 ' + days + '일 이전';
        else when = '이용일 ' + days + '일 전';

        var what;
        if (isNaN(rate)) what = '문의';
        else if (rate >= 100) what = '전액 환불';
        else if (rate <= 0) what = '환불 불가';
        else what = rate + '% 환불';

        return '* ' + when + ' 취소 시 ' + what;
      })
      .join('\n');
  };

  // MAPPER: property.refundPolicies / refundSettings → `환불정보` dd
  //
  // 규정도 안내문도 없으면 dt/dd 두 줄을 함께 숨긴다. dt 만 남으면 빈 항목이 된다.
  ReservationMapper.prototype.mapRefund = function () {
    var self = this;
    var settings = this.getProperty().refundSettings || {};

    var parts = [];
    var policies = this.formatRefundPolicies();
    if (policies) parts.push(policies);

    var notice = this.cleanText(settings.customerRefundNotice);
    if (notice) parts.push(notice);

    var html = parts.join('\n\n');

    document.querySelectorAll('[data-reservation-refund-body]').forEach(function (el) {
      el.innerHTML = html ? self.nl2br(html) : '';
      el.style.display = html ? '' : 'none';
    });
    document.querySelectorAll('[data-reservation-refund-title]').forEach(function (el) {
      el.style.display = html ? '' : 'none';
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    // 초기화 주체는 preview-handler 다. 중복 실행을 막는다.
    if (window.previewHandler) return;
    new ReservationMapper().initialize();
  });

  global.ReservationMapper = ReservationMapper;
})(window);
