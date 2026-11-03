(function (global) {
  'use strict';

  var YBS_BASE_URL = 'https://www.yapen.co.kr/external?ypIdx=';

  // 상담하기 — 뒤에 property.tripPropertyId 가 붙는다
  var CONSULT_BASE_URL = 'https://www.bookingplay.co.kr/api/cti_eicn/kakao_happy_talk?tid=';

  // 파트너 타입 — 원천은 백오피스 DB `public.contract_info.partner_type` 이고
  // BFF 가 코드 문자열을 그대로 내려준다. **분기는 템플릿이 한다**(PC/모바일은 템플릿만 안다).
  //
  //   distributor_a  총판A     PC 상담하기 / 모바일 상담하기 + 예약하기
  //   distributor_b  총판B     PC 없음     / 모바일 예약하기
  //   sales_agency   판매대행  PC 없음     / 모바일 예약하기
  //
  // ⚠️ 예약하기는 **파트너 타입과 무관**하다 — 세 타입 모두 모바일에서만 뜬다.
  //    그건 기존 `.ft_btn_reserve.for_m` 의 미디어쿼리가 이미 하고 있어 손대지 않는다.
  //    타입으로 갈리는 것은 상담하기 하나뿐이다.
  var CONSULT_PARTNER_TYPES = ['distributor_a'];

  // ⚠️ base-mapper 에 `cleanText` 가 없는 템플릿이 있어 의존하지 않는다.
  function consultText(v) {
    return v === undefined || v === null ? '' : String(v).trim();
  }



  function HeaderFooterMapper() {
    BaseDataMapper.call(this);
  }
  HeaderFooterMapper.prototype = Object.create(BaseDataMapper.prototype);
  HeaderFooterMapper.prototype.constructor = HeaderFooterMapper;

  HeaderFooterMapper.prototype.mapPage = function () {
    this.mapPropertyNames();
    this.mapFavicon();
    this.mapBookingLinks();
    this.mapYbs();
    this.mapConsult();
    this.mapSocialLinks();
    this.mapRoomMenu();
    this.mapSpecialMenu();
    this.mapPageToggles();
    this.mapFooter();
    // SEO: homepage.seo → title + description/keywords + 네이버/구글 사이트 인증 (전 페이지 공통)
    this.updateMetaTags();
  };

  // 페이지 enabled 여부 (sections[0].enabled === false 이면 비활성)
  HeaderFooterMapper.prototype.isPageEnabled = function (pageKey) {
    var page = this.getPages()[pageKey];
    var section = page && page.sections && page.sections[0];
    return !(section && section.enabled === false);
  };

  // 로고 이미지 / 텍스트 폴백.
  // 템플릿에 고정 로고 파일을 두지 않으므로 3단으로 떨어뜨린다.
  //   homepage.images[0].logo[isSelected] → 숙소명 텍스트 → placeholder
  //
  // 원본(용천수카라반/개울가)의 로고 자리는 이미지 3곳이다.
  //   .logo .logo1 = 흰 로고 (히어로 위 투명 헤더)
  //   .logo .logo2 = 검정 로고 (.header.on / 1023px 이하 흰 헤더)
  //   .foot_logo   = 흰 로고 (푸터)
  // 셋 다 같은 파일을 쓰고 CSS 로만 갈아끼운다. 템플릿은 로고 파일을 고정
  // 저장하지 않으므로 세 자리 모두 같은 폴백 체인으로 채운다.
  HeaderFooterMapper.prototype.applyLogo = function (host, logoUrl, name, nameEn) {
    if (!host) return;
    var img = host.querySelector('[data-logo-image]');
    var textEl = host.querySelector('.logo_text');
    var subEl = host.querySelector('.logo_sub');
    if (!img) return;

    var showText = function (visible) {
      if (textEl) textEl.style.display = visible ? '' : 'none';
      // 부제(한글 숙소명)는 영문명과 값이 같으면 같은 줄이 두 번 나오므로 숨긴다
      if (subEl) {
        var dup = !name || name === (nameEn || '');
        subEl.style.display = visible && !dup ? '' : 'none';
      }
    };

    if (logoUrl) {
      // 로고 URL 이 죽어 있으면 깨진 아이콘 대신 숙소명 텍스트로 떨어뜨린다
      ImageHelpers.setImage(img, logoUrl, name || nameEn || 'logo', function () {
        img.style.display = 'none';
        img.removeAttribute('src');
        if (textEl) textEl.textContent = nameEn || name;
        if (subEl) subEl.textContent = name;
        showText(!!(name || nameEn));
      });
      img.style.display = '';
      showText(false);
      return;
    }

    if (name || nameEn) {
      img.style.display = 'none';
      img.removeAttribute('src');
      if (textEl) textEl.textContent = nameEn || name;
      if (subEl) subEl.textContent = name;
      showText(true);
      return;
    }

    // 로고도 숙소명도 없으면(데이터 미입력) 영역이 사라지지 않도록
    // 매핑 위치 안내용 placeholder 를 세운다.
    ImageHelpers.applyPlaceholder(img, '로고');
    img.style.display = '';
    showText(false);
  };

  // MAPPER: homepage.images[0].logo / property name → 헤더 로고(.logo / .logo2)
  HeaderFooterMapper.prototype.mapPropertyNames = function () {
    var self = this;
    var nameEn = this.getPropertyNameEn();
    var name = this.getPropertyName();
    var logoUrl = this.getLogo();

    document.querySelectorAll('[data-property-name-en]').forEach(function (el) {
      // 로고 슬롯의 텍스트는 applyLogo 가 값·표시 여부를 함께 정한다
      if (el.classList.contains('logo_text')) return;
      el.textContent = nameEn;
    });
    document.querySelectorAll('[data-property-name]').forEach(function (el) {
      if (el.classList.contains('logo_sub')) return;
      el.textContent = name;
    });

    document.querySelectorAll('.logo .logo1, .logo .logo2, .foot_logo').forEach(function (host) {
      self.applyLogo(host, logoUrl, name, nameEn);
    });
  };

  // MAPPER: favicon ← homepage.images[0].logo[isSelected].url
  HeaderFooterMapper.prototype.mapFavicon = function () {
    var logoUrl = this.getLogo();
    if (!logoUrl) return;
    var link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logoUrl;
  };

  // MAPPER: property.realtimeBookingId → [data-booking-link] (href 직접 주입)
  HeaderFooterMapper.prototype.mapBookingLinks = function () {
    var bookingUrl = this.getBookingUrl();
    document.querySelectorAll('[data-booking-link]').forEach(function (el) {
      if (bookingUrl && bookingUrl !== '#!') {
        el.href = bookingUrl;
        el.setAttribute('target', '_blank');
      }
    });
  };

  // MAPPER: property.ybsId → [data-ybs-button] (없으면 감싸는 줄째 숨김)
  // 원본은 이 링크가 헤더가 아니라 푸터 사업자정보 줄에 있다.
  HeaderFooterMapper.prototype.mapYbs = function () {
    var ybsId = this.getProperty().ybsId;
    document.querySelectorAll('[data-ybs-button]').forEach(function (el) {
      var host = el.closest('[data-ybs-wrap]') || el;
      if (!ybsId) {
        host.style.display = 'none';
        return;
      }
      host.style.display = '';
      var target = el.tagName === 'A' ? el : el.querySelector('a');
      if (target) {
        target.href = YBS_BASE_URL + ybsId;
        target.setAttribute('target', '_blank');
      }
    });
  };

  // MAPPER: homepage.socialLinks.{facebook|instagram|blog|youtube} → [data-homepage-socialLinks-{platform}]
  //
  // 값이 있으면 href + 노출, 없으면(null·빈 문자열·키 없음) 숨긴다.
  // 마크업은 매핑 전 깜빡임이 없도록 `.hidden-social-link`(숨김) 상태로 시작한다.
  // 헤더 네이버 N 로고 버튼은 blog 값을 쓴다(어드민 blog 칸에 네이버 플레이스 주소를 넣는다).
  // 인스타그램 버튼은 instagram 값. facebook / youtube 는 J형 헤더에 마크업이 없어 매칭 요소가 0개다.
  // 헤더에 버튼이 하나라도 보이면 루트에 data-social="on" 을 찍는다 — 좁은 화면에서 헤더가 두 줄로
  // 넘어가지 않게 CSS 가 메뉴 여백·아이콘 크기를 줄이는 기준이다 (:has 대신 — 일부 브라우저에서 스타일 미반영).
  HeaderFooterMapper.prototype.mapSocialLinks = function () {
    var socialLinks = this.getHomepage().socialLinks || {};
    var headerOn = false;
    ['facebook', 'instagram', 'blog', 'youtube'].forEach(function (platform) {
      var raw = socialLinks[platform];
      var url = raw === undefined || raw === null ? '' : String(raw).trim();
      var selector = '[data-homepage-socialLinks-' + platform + ']';
      document.querySelectorAll(selector).forEach(function (el) {
        if (!url) {
          el.classList.add('hidden-social-link');
          el.setAttribute('href', '#!');
          return;
        }
        el.setAttribute('href', url);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
        el.classList.remove('hidden-social-link');
        if (el.closest('.header')) headerOn = true;
      });
    });
    document.documentElement.setAttribute('data-social', headerOn ? 'on' : 'off');
  };

  // 상담 URL 에 쓸 tripPropertyId. 없거나 형식이 아니면 빈 문자열.
  HeaderFooterMapper.prototype.getConsultId = function () {
    var raw = consultText(this.getProperty().tripPropertyId);
    // ⚠️ URL 쿼리에 그대로 붙는 값이라 토큰 형태만 통과시킨다. 플레이스홀더
    //    문자열(`숙소 ID` 같은 한글·공백)이 들어와도 링크가 깨지지 않는다.
    return /^[A-Za-z0-9_-]+$/.test(raw) ? raw : '';
  };

  // 상담하기 노출 대상인가 — 파트너 타입 + tripPropertyId 둘 다 있어야 한다.
  HeaderFooterMapper.prototype.isConsultVisible = function () {
    var partnerType = consultText(this.getProperty().partnerType);
    return Boolean(this.getConsultId()) && CONSULT_PARTNER_TYPES.indexOf(partnerType) !== -1;
  };

  // MAPPER: property.tripPropertyId + partnerType → [data-consult-button] (우측 하단 상담하기)
  //
  // 총판A 만 노출하고, `tripPropertyId` 가 비면 타입과 무관하게 숨긴다.
  // 값이 없으면 `[data-consult-wrap]` 째 숨긴다 — 버튼만 숨기면 빈 박스가 남는다.
  HeaderFooterMapper.prototype.mapConsult = function () {
    var tripPropertyId = this.getConsultId();
    var visible = this.isConsultVisible();

    // 상담하기가 빠지면 예약하기 아래가 비어 버린다.
    // CSS 가 위치를 되돌릴 수 있도록 상태를 루트에 찍는다.
    document.documentElement.setAttribute('data-consult', visible ? 'on' : 'off');

    document.querySelectorAll('[data-consult-button]').forEach(function (el) {
      var host = el.closest('[data-consult-wrap]') || el;
      if (!visible) {
        host.style.display = 'none';
        return;
      }
      host.style.display = '';
      var target = el.tagName === 'A' ? el : el.querySelector('a');
      if (target) {
        target.href = CONSULT_BASE_URL + tripPropertyId;
        target.setAttribute('target', '_blank');
      }
    });
  };

  // MAPPER: roomtypes[].name → [data-rooms-submenu] (미리보기 li 뒤에 동적 생성, PC + 모바일 aside)
  HeaderFooterMapper.prototype.mapRoomMenu = function () {
    var self = this;
    var roomItems = this.getRoomMenuItems();
    document.querySelectorAll('[data-rooms-submenu]').forEach(function (container) {
      // 이전 생성분 제거 (preview 재렌더 대비)
      container.querySelectorAll('[data-generated="room"]').forEach(function (li) {
        li.remove();
      });
      roomItems.forEach(function (item) {
        var name = self.getRoomMenuLabel(item);
        // 이름이 없으면 빈 메뉴 항목(여백)이 되므로 건너뜀
        if (!String(name).trim()) return;
        var li = document.createElement('li');
        li.setAttribute('data-generated', 'room');
        var a = document.createElement('a');
        a.href = self.getRoomMenuLink(item);
        a.textContent = name;
        a.title = name; // 메뉴 폭이 좁으면 줄바꿈되므로 전체 문구를 툴팁으로 남긴다
        li.appendChild(a);
        container.appendChild(li);
      });
    });
  };

  // MAPPER: property.facilities[].name → [data-special-submenu] (컨테이너 비우고 동적 생성)
  //
  // ⚠️ 시설을 하나도 등록하지 않으면 SPECIAL 메뉴째 숨긴다.
  //    부대시설은 property.facilities[] 가 유일한 소스라(크롤링으로 채워지지 않는다)
  //    비어 있는 숙소가 실제로 있다. 그대로 두면 서브 0개짜리 메뉴가 남고
  //    누르면 facility.html 이 404 로 튕긴다.
  HeaderFooterMapper.prototype.mapSpecialMenu = function () {
    // getFacilities() 는 displayOrder 로 정렬한다 — index 카드 / facility 탭과 같은 순서
    var facilities = this.getFacilities();

    document.querySelectorAll('[data-special-menu]').forEach(function (el) {
      el.style.display = facilities.length ? '' : 'none';
    });

    document.querySelectorAll('[data-special-submenu]').forEach(function (container) {
      container.innerHTML = '';
      facilities.forEach(function (f) {
        if (!f.name || !f.name.trim()) return;
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = './facility.html?id=' + f.id;
        a.textContent = f.name;
        a.title = f.name; // 메뉴 폭이 좁으면 줄바꿈되므로 전체 문구를 툴팁으로 남긴다
        li.appendChild(a);
        container.appendChild(li);
      });
    });
  };

  // MAPPER: pages.layoutMap / nearbyAttractions enabled → 메뉴 표시/숨김
  //
  // 미리보기가 꺼지면 "미리보기" li 를 숨기고, 대메뉴 ROOMS([data-rooms-link])는
  // 첫 번째 객실 상세로 보낸다 — 그대로 두면 layout-map.html 이 404 로 튕긴다.
  // 판정은 layout-map.html 의 404 기준과 같은 isLayoutMapEnabled() 를 쓴다.
  HeaderFooterMapper.prototype.mapPageToggles = function () {
    var layoutMapEnabled = this.isLayoutMapEnabled();
    document.querySelectorAll('[data-menu-id="layout-map"]').forEach(function (el) {
      var li = el.closest('li') || el;
      li.style.display = layoutMapEnabled ? '' : 'none';
    });

    var roomsLink = this.getRoomsEntryLink();
    if (roomsLink) {
      document.querySelectorAll('[data-rooms-link]').forEach(function (el) {
        el.setAttribute('href', roomsLink);
      });
    }

    var nearbyEnabled = this.isPageEnabled('nearbyAttractions');
    document.querySelectorAll('[data-travel-menu]').forEach(function (el) {
      el.style.display = nearbyEnabled ? '' : 'none';
    });
  };

  // 전화번호 링크(<a data-footer-phone-link>)를 번호 개수만큼 복제해 " | " 로 구분 노출.
  HeaderFooterMapper.prototype.renderFooterPhones = function (phones) {
    if (!phones.length) return;
    var tel0 = 'tel:' + String(phones[0]).replace(/[^0-9+]/g, '');

    document.querySelectorAll('[data-footer-phone-link]').forEach(function (link) {
      // 번호 텍스트 슬롯이 없는 링크(아이콘 버튼 등)는 첫 번째 번호로 href 만 연결
      if (!link.querySelector('[data-footer-phone]')) {
        link.setAttribute('href', tel0);
        return;
      }

      var parent = link.parentNode;
      if (!parent) return;

      // 멱등: 이전 렌더로 만든 복제 링크/구분자를 정리하고 원본 링크 하나만 남긴다
      parent.querySelectorAll('[data-footer-phone-link]').forEach(function (el, i) {
        if (i > 0) parent.removeChild(el);
      });
      parent.querySelectorAll('[data-footer-phone-sep]').forEach(function (el) {
        parent.removeChild(el);
      });

      phones.forEach(function (phone, idx) {
        var el = idx === 0 ? link : link.cloneNode(true);
        var span = el.querySelector('[data-footer-phone]');
        if (span) span.textContent = phone;
        el.setAttribute('href', 'tel:' + String(phone).replace(/[^0-9+]/g, ''));

        if (idx > 0) {
          var sep = document.createElement('span');
          sep.setAttribute('data-footer-phone-sep', '');
          sep.textContent = ' | ';
          parent.appendChild(sep);
          parent.appendChild(el);
        }
      });
    });
  };

  // MAPPER: property.address / property.contactPhone / property.businessInfo → 푸터
  // 원본 푸터의 주소는 사업장 주소가 아니라 숙소 주소다(Reservation 블록).
  // 전화번호도 businessInfo.businessPhone 이 아니라 노출용 contactPhone 배열을 쓴다.
  // MAPPER: property.tripProviderName → [data-copyright]
  // 공급사명이 있으면 data-copyright 의 템플릿 문자열에서 {provider} 를 치환한다.
  // 값이 없으면(백오피스 미입력 → "") HTML 의 기존 트립일레븐 문구를 그대로 둔다.
  HeaderFooterMapper.prototype.mapCopyright = function () {
    var provider = String(this.getProperty().tripProviderName || '').trim();
    if (!provider) return;
    document.querySelectorAll('[data-copyright]').forEach(function (el) {
      var tpl = el.getAttribute('data-copyright') || '';
      el.textContent = tpl.replace(/\{provider\}/g, provider);
    });
  };

  // MAPPER: customFields.footer.ruralStayMark → [data-footer-rural-stay-mark] (푸터 가운데 텍스트 칸 맨 위, 숙소명 위)
  // 농어촌민박사업자 이미지가 있을 때만 노출하고, 없으면 숨겨 기존 푸터와 같다.
  // 프리뷰는 같은 페이지에서 다시 매핑하므로 매번 표시 상태를 되돌린다.
  HeaderFooterMapper.prototype.mapRuralStayMark = function () {
    var footer = this.getCustomFields().footer || {};
    var mark = footer.ruralStayMark;
    var markUrl = mark && mark.url ? String(mark.url) : '';

    document.querySelectorAll('[data-footer-rural-stay-mark-wrap]').forEach(function (wrap) {
      wrap.style.display = markUrl ? '' : 'none';
    });
    document.querySelectorAll('[data-footer-rural-stay-mark]').forEach(function (img) {
      if (!markUrl) {
        img.removeAttribute('src');
        return;
      }
      img.src = markUrl;
      img.alt = (mark.description && String(mark.description).trim()) || '농어촌민박사업자';
    });
  };

  HeaderFooterMapper.prototype.mapFooter = function () {
    this.mapCopyright();
    this.mapRuralStayMark();
    var prop = this.getProperty();
    var biz = prop.businessInfo || {};
    var phones = this.toPhoneList(prop.contactPhone);

    var fields = {
      '[data-footer-property-name]': this.getPropertyName(),
      '[data-footer-address]': this.firstText(prop.address, biz.businessAddress),
      '[data-footer-representative]': biz.representativeName,
      '[data-footer-business-number]': biz.businessNumber
    };
    Object.keys(fields).forEach(function (selector) {
      var value = fields[selector];
      document.querySelectorAll(selector).forEach(function (el) {
        if (value === undefined || value === null || value === '') {
          // 값이 없으면 줄째로 숨긴다 ("대표자 :" 만 남는 빈 줄 방지)
          (el.closest('p') || el).style.display = 'none';
          return;
        }
        (el.closest('p') || el).style.display = '';
        el.textContent = value;
      });
    });

    this.renderFooterPhones(phones);
  };

  document.addEventListener('headerFooterLoaded', function () {
    var mapper = new HeaderFooterMapper();
    mapper.initialize();
    global.headerFooterMapperInstance = mapper;
  });

  global.HeaderFooterMapper = HeaderFooterMapper;
})(window);
