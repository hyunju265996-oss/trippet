(function () {
  'use strict';
  var I = window.I18N;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ data */
  var CAROUSEL = [
    { id: 'c1', bg: 'var(--color-light-primary-10)', icon: 'assets/card-ic-1.svg' },
    { id: 'c2', bg: 'var(--color-light-point-10)', icon: 'assets/card-ic-2.svg' },
    { id: 'c3', bg: 'var(--color-light-danger-10)', icon: 'assets/card-ic-3.svg' },
    { id: 'c4', bg: 'var(--color-light-secondary-10)', icon: 'assets/card-ic-4.svg' },
    { id: 'c5', bg: 'var(--color-light-success-10)', icon: 'assets/card-ic-5.svg' },
    { id: 'c6', bg: 'var(--color-light-information-10)', icon: 'assets/card-ic-6.svg' },
    { id: 'c7', bg: 'var(--color-light-warning-10)', icon: 'assets/card-ic-7.svg', href: '#/list' }
  ];

  // Contact numbers are placeholders (원본의 실제 번호는 예시 번호로 교체).
  var COURSES = [
    { id: 'c1', status: 'open', start: '2026-11-19', end: '2026-12-18', round: 86, days: 30, hours: 15, mode: 'online', phone: '070-0000-0001', fee: 181500, self: 18150 },
    { id: 'c2', status: 'open', start: '2026-11-19', end: '2027-04-18', round: 86, days: 120, hours: 160, mode: 'online', phone: '070-0000-0002', fee: 14568000, self: 400000 },
    { id: 'c3', status: 'closing', start: '2026-11-19', end: '2026-12-18', round: 99, days: 30, hours: 49, mode: 'online', phone: '053-000-0003', fee: 460000, self: 46000 },
    { id: 'c4', status: 'open', start: '2026-11-19', end: '2026-12-18', round: 86, days: 30, hours: 15, mode: 'online', phone: '070-0000-0004', fee: 335000, self: 33500 },
    { id: 'c5', status: 'open', start: '2026-11-19', end: '2026-12-18', round: 86, days: 30, hours: 15, mode: 'online', phone: '070-0000-0005', fee: 200000, self: 20000 },
    { id: 'c6', status: 'open', start: '2026-11-19', end: '2026-12-18', round: 86, days: 30, hours: 15, mode: 'online', phone: '070-0000-0006', fee: 181500, self: 18150 }
  ];
  var FILTERS = [['all', 424], ['offline', 375], ['smart', 7], ['online', 49], ['blended', 0]];
  var DETAIL = { start: '2026-12-17', end: '2027-04-16', round: 7, days: 80, hours: 640, orig: 11616000, sale: 400000, confirmed: 0, applied: 0, capacity: 30, reviews: 18, applyDate: '2026-11-19' };

  var state = { wish: [], filter: 'all', page: 1, interest: false };

  /* ------------------------------------------------------------------ toast */
  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2400);
  }

  /* ------------------------------------------------------------------ language switcher */
  var langBtn = $('#langBtn');
  var langList = $('#langList');
  function buildLangList() {
    I.languageNames().then(function (langs) {
      langList.innerHTML = '';
      langs.forEach(function (l) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('lang', l.code === 'zh' ? 'zh-Hans' : l.code);
        li.dataset.lang = l.code;
        li.tabIndex = -1;
        li.textContent = l.name;
        langList.appendChild(li);
      });
      markLang();
    });
  }
  function markLang() {
    $$('li', langList).forEach(function (li) {
      li.setAttribute('aria-selected', String(li.dataset.lang === I.lang));
    });
  }
  function openLang(open) {
    langList.hidden = !open;
    langBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      var sel = $('[aria-selected="true"]', langList) || langList.firstElementChild;
      if (sel) sel.focus();
    }
  }
  langBtn.addEventListener('click', function (e) { e.stopPropagation(); openLang(langList.hidden); });
  langList.addEventListener('click', function (e) {
    var li = e.target.closest('li[data-lang]');
    if (!li) return;
    chooseLang(li.dataset.lang);
  });
  langList.addEventListener('keydown', function (e) {
    var items = $$('li', langList);
    var i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (items[i]) chooseLang(items[i].dataset.lang); }
    else if (e.key === 'Escape') { openLang(false); langBtn.focus(); }
    else if (e.key === 'Tab') { openLang(false); }
  });
  document.addEventListener('click', function (e) {
    if (!langList.hidden && !e.target.closest('.lang')) openLang(false);
  });
  function chooseLang(code) {
    openLang(false);
    langBtn.focus();
    if (code === I.lang) return;
    I.setLang(code).then(function () { toast(I.t('toast.languageChanged')); });
  }

  /* ------------------------------------------------------------------ demo links */
  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-demo]');
    if (!d) return;
    e.preventDefault();
    toast(I.t('toast.demo'));
  });

  /* ------------------------------------------------------------------ scroll to top (Figma: SCROLL_ANIMATE 0.74s, QUICK) */
  function scrollTop() {
    var startY = window.scrollY, dur = reduceMotion ? 0 : 744, t0 = performance.now();
    if (!dur) { window.scrollTo(0, 0); return; }
    function ease(t) { return 1 - Math.pow(1 - t, 4); }
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, startY * (1 - ease(p)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
    $('#main').focus({ preventScroll: true });
  }
  $$('[data-scrolltop]').forEach(function (b) { b.addEventListener('click', scrollTop); });

  /* ------------------------------------------------------------------ home tabs (CHANGE_TO, no transition) */
  function tabGroup(selector) {
    $$(selector).forEach(function (tab, _, all) {
      tab.addEventListener('click', function () {
        all.forEach(function (o) { o.classList.toggle('is-on', o === tab); o.setAttribute('aria-selected', String(o === tab)); });
      });
    });
  }
  tabGroup('.htab');
  tabGroup('.dtab');

  /* ------------------------------------------------------------------ 카드뉴스 캐러셀 */
  // Slot geometry from the Figma variants (1200×420 stage, perspective 1400).
  var SLOTS = {
    0: { x: 0, z: 0, ry: 0, s: 1, o: 1 },
    1: { x: 300, z: -100, ry: -32, s: 0.82, o: 1 },
    2: { x: 500, z: -200, ry: -50, s: 0.66, o: 0.75 },
    3: { x: 570, z: -300, ry: -60, s: 0.5, o: 0 }
  };
  var stage = $('#stage');
  var dotsEl = $('#carDots');
  var active = 0;
  var playing = !reduceMotion;
  var autoTimer;

  function buildCarousel() {
    stage.innerHTML = '';
    dotsEl.innerHTML = '';
    CAROUSEL.forEach(function (c, i) {
      var el = document.createElement(c.href ? 'a' : 'div');
      el.className = 'ccard';
      if (c.href) el.href = c.href;
      el.style.background = c.bg;
      el.dataset.index = i;
      el.innerHTML =
        '<span class="ccard__tag" data-i18n="home.carousel.' + c.id + '.tag"></span>' +
        '<span class="ccard__ic"><img src="' + c.icon + '" width="72" height="72" alt=""></span>' +
        '<span class="ccard__sp"></span>' +
        '<strong class="ccard__title" data-i18n="home.carousel.' + c.id + '.title"></strong>' +
        '<span class="ccard__desc" data-i18n="home.carousel.' + c.id + '.desc"></span>' +
        '<span class="ccard__cta" data-i18n="home.carousel.cta"></span>';
      stage.appendChild(el);
      var dot = document.createElement('span');
      dot.className = 'dot';
      dotsEl.appendChild(dot);
    });
    I.apply(stage);
    layoutCarousel(false);
  }

  function layoutCarousel(animate, dur) {
    var n = CAROUSEL.length;
    stage.style.setProperty('--car-dur', (dur || 0.6) + 's');
    stage.classList.toggle('is-anim', !!animate && !reduceMotion);
    $$('.ccard', stage).forEach(function (el, i) {
      var d = ((i - active) % n + n) % n;
      if (d > 3) d -= n;               // -3..3
      var slot = SLOTS[Math.abs(d)];
      var sign = d < 0 ? -1 : 1;
      el.style.transform =
        'translateX(' + (slot.x * sign) + 'px) translateZ(' + slot.z + 'px) rotateY(' + (slot.ry * sign) + 'deg) scale(' + slot.s + ')';
      el.style.opacity = slot.o;
      el.style.zIndex = 10 - Math.abs(d);
      el.classList.toggle('is-center', d === 0);
      var hidden = Math.abs(d) === 3;
      el.setAttribute('aria-hidden', String(hidden));
      el.tabIndex = hidden ? -1 : 0;
    });
    $$('.dot', dotsEl).forEach(function (dot, i) { dot.classList.toggle('is-on', i === active); });
    var center = $('.ccard.is-center', stage);
    if (center) center.setAttribute('aria-label', I.t('a11y.slide', { index: active + 1, total: n }) + ' · ' + center.querySelector('.ccard__title').textContent);
  }

  function go(delta, dur) {
    active = (active + delta + CAROUSEL.length) % CAROUSEL.length;
    layoutCarousel(true, dur);
  }
  function schedule() {
    clearTimeout(autoTimer);
    if (!playing) return;
    autoTimer = setTimeout(function () { go(1, 0.8); schedule(); }, 3000);
  }
  function setPlaying(p) {
    playing = p;
    var btn = $('#carPause');
    btn.classList.toggle('is-paused', !p);
    btn.setAttribute('data-i18n-attr', 'aria-label:' + (p ? 'a11y.pause' : 'a11y.play'));
    btn.setAttribute('aria-label', I.t(p ? 'a11y.pause' : 'a11y.play'));
    schedule();
  }
  $('#carPrev').addEventListener('click', function () { go(-1, 0.6); schedule(); });
  $('#carNext').addEventListener('click', function () { go(1, 0.6); schedule(); });
  $('#carPause').addEventListener('click', function () { setPlaying(!playing); });
  stage.addEventListener('click', function (e) {
    var card = e.target.closest('.ccard');
    if (!card) return;
    var i = +card.dataset.index;
    if (CAROUSEL[i].href) return; // K-디지털 훈련 → 목록으로 이동
    e.preventDefault();
    if (i !== active) {
      var n = CAROUSEL.length, d = ((i - active) % n + n) % n;
      if (d > 3) d -= n;
      go(d, 0.6); schedule();
    } else {
      toast(I.t('toast.demo'));
    }
  });
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { go(1, 0.6); schedule(); }
    if (e.key === 'ArrowLeft') { go(-1, 0.6); schedule(); }
  });

  // Fit the 1200px carousel (rendered at 0.934 in the design) into the available width.
  function fitCarousel() {
    var wrap = $('.carousel');
    if (!wrap) return;
    var avail = wrap.clientWidth;
    // Desktop: whole 1200px stage (0.934 like the design). Narrow screens: keep the centre card readable, clip the sides.
    var scale = avail >= 760 ? Math.min(1121.25, avail) / 1200 : Math.min(1, avail / 520);
    wrap.style.setProperty('--car-scale', scale.toFixed(4));
  }
  window.addEventListener('resize', fitCarousel);

  /* ------------------------------------------------------------------ list page */
  function courseTitle(id) { return I.t('course.' + id + '.title'); }

  function renderFilters() {
    var el = $('#filters');
    el.innerHTML = '';
    FILTERS.forEach(function (f) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (state.filter === f[0] ? ' is-on' : '');
      b.setAttribute('aria-pressed', String(state.filter === f[0]));
      b.innerHTML = '<img src="assets/ic-check-chip.svg" width="16" height="16" alt="">';
      b.appendChild(document.createTextNode(I.t('list.filter.' + f[0], { count: f[1] })));
      b.addEventListener('click', function () { state.filter = f[0]; renderFilters(); });
      el.appendChild(b);
    });
    $('#totalLabel').textContent = I.t('list.total', { count: 424 });
  }

  function renderCourses() {
    var ul = $('#courses');
    ul.innerHTML = '';
    COURSES.forEach(function (c) {
      var wished = state.wish.indexOf(c.id) > -1;
      var li = document.createElement('li');
      li.innerHTML =
        '<article class="ccourse" tabindex="0" data-id="' + c.id + '" aria-labelledby="ct-' + c.id + '">' +
          '<div class="ccourse__top"><span class="ccourse__field"></span>' +
          '<span class="badge badge--' + c.status + '"></span></div>' +
          '<h3 class="ccourse__title" id="ct-' + c.id + '"></h3>' +
          '<p class="ccourse__org"></p>' +
          '<div class="ccourse__info"><p class="i1"></p><p class="i2"></p><p class="i3"></p></div>' +
          '<div class="ccourse__fee"><p class="f1"></p><p class="f2"></p></div>' +
          '<p class="ccourse__meta"></p>' +
          '<div class="ccourse__act">' +
            '<a class="btn btn--sec btn--m" href="#/detail"></a>' +
            '<button type="button" class="btn btn--tertiary btn--m btn--wish" aria-pressed="' + wished + '"><img src="assets/ic-heart-16.svg" width="16" height="16" alt=""><span></span></button>' +
            '<button type="button" class="btn btn--tertiary btn--m btn--cmp" data-demo></button>' +
          '</div>' +
          '<button type="button" class="btn btn--tertiary btn--s btn--rounds" data-demo></button>' +
        '</article>';
      var a = li.firstChild;
      $('.ccourse__field', a).textContent = I.t('course.' + c.id + '.field');
      $('.badge', a).textContent = I.t('list.status.' + c.status);
      $('.ccourse__title', a).textContent = courseTitle(c.id);
      $('.ccourse__org', a).textContent = I.t('course.' + c.id + '.org');
      $('.i1', a).textContent = I.t('list.card.period', { start: I.date(c.start), end: I.date(c.end), round: c.round });
      $('.i2', a).textContent = I.t('list.card.duration', { days: I.count('days', c.days), hours: I.count('hours', c.hours), mode: I.t('list.mode.' + c.mode) });
      $('.i3', a).textContent = I.t('list.card.location', { area: I.t('course.' + c.id + '.area'), phone: c.phone });
      $('.f1', a).textContent = I.t('list.card.fee', { amount: I.currency(c.fee) });
      $('.f2', a).textContent = I.t('list.card.selfPay', { amount: I.currency(c.self) });
      $('.ccourse__meta', a).textContent = I.t('list.card.type') + '\n' + I.t('list.card.employment');
      $('.btn--sec', a).textContent = I.t('list.card.detail');
      $('.btn--wish span', a).textContent = I.t(wished ? 'list.card.wished' : 'list.card.wish');
      $('.btn--cmp', a).textContent = I.t('list.card.compare');
      $('.btn--rounds', a).textContent = I.t('list.card.rounds');
      ul.appendChild(li);
    });
  }

  function renderWish() {
    $('#wishCount').textContent = I.number(state.wish.length);
    var body = $('#wishBody');
    body.innerHTML = '';
    if (!state.wish.length) {
      body.innerHTML = '<p class="wish__empty"></p><p class="wish__hint"></p>';
      $('.wish__empty', body).textContent = I.t('list.wish.empty');
      $('.wish__hint', body).textContent = I.t('list.wish.hint');
      return;
    }
    var p = document.createElement('p');
    p.className = 'wish__empty';
    p.textContent = I.t('list.wish.summary', { count: state.wish.length });
    body.appendChild(p);
    var ul = document.createElement('ul');
    ul.className = 'wish__list';
    state.wish.forEach(function (id) {
      var li = document.createElement('li');
      var title = document.createElement('a');
      title.href = '#/detail';
      title.textContent = courseTitle(id);
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn btn--tertiary btn--s';
      rm.textContent = I.t('list.wish.remove');
      rm.addEventListener('click', function () { toggleWish(id); });
      li.appendChild(title); li.appendChild(rm);
      ul.appendChild(li);
    });
    body.appendChild(ul);
  }

  function toggleWish(id) {
    var i = state.wish.indexOf(id);
    if (i > -1) { state.wish.splice(i, 1); toast(I.t('toast.wishRemoved', { title: courseTitle(id) })); }
    else { state.wish.push(id); toast(I.t('toast.wishAdded', { title: courseTitle(id) })); }
    renderWish(); renderCourses();
  }

  $('#courses').addEventListener('click', function (e) {
    var wish = e.target.closest('.btn--wish');
    if (wish) { e.stopPropagation(); toggleWish(wish.closest('.ccourse').dataset.id); return; }
    if (e.target.closest('button, a')) return;
    var card = e.target.closest('.ccourse');
    if (card) navigate('#/detail');
  });
  $('#courses').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.classList.contains('ccourse')) navigate('#/detail');
  });

  function renderPaging() {
    var nav = $('#paging');
    nav.innerHTML = '';
    function btn(label, page, aria) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--m ' + (page === state.page ? 'btn--primary' : 'btn--tertiary');
      b.textContent = label;
      if (aria) b.setAttribute('aria-label', aria);
      if (page === state.page) b.setAttribute('aria-current', 'page');
      b.addEventListener('click', function () { state.page = Math.max(1, Math.min(5, page)); renderPaging(); });
      nav.appendChild(b);
    }
    btn(I.t('list.pagination.prev'), state.page - 1);
    for (var p = 1; p <= 5; p++) btn(I.number(p), p, I.t('list.pagination.page', { page: p }));
    btn(I.t('list.pagination.next'), state.page + 1);
  }

  $$('.btn--sort').forEach(function (b, _, all) {
    b.addEventListener('click', function () {
      all.forEach(function (o) { o.classList.toggle('is-on', o === b); o.setAttribute('aria-checked', String(o === b)); });
    });
  });
  $$('.kw .chip').forEach(function (chip) {
    chip.addEventListener('click', function () { $('#lsInput').value = chip.textContent; $('#lsInput').focus(); });
  });

  /* ------------------------------------------------------------------ detail page */
  function renderDetail() {
    var pc = function (n) { return I.count('people', n); };
    var hc = $('#headcount');
    hc.innerHTML = '';
    [['confirmed', DETAIL.confirmed, 'c-orange'], ['applied', DETAIL.applied, 'c-blue'], ['capacity', DETAIL.capacity, '']].forEach(function (row, idx) {
      if (idx) hc.appendChild(document.createTextNode(' / '));
      var s = document.createElement('span');
      s.textContent = I.t('detail.headcount.' + row[0]) + ' ';
      var b = document.createElement('b');
      b.className = row[2];
      b.textContent = pc(row[1]);
      s.appendChild(b);
      hc.appendChild(s);
    });
    var badge = document.createElement('span');
    badge.className = 'pill';
    badge.textContent = I.t('detail.status');
    hc.appendChild(badge);

    $('#feeOrig').textContent = I.currency(DETAIL.orig);
    $('#feeSale').textContent = I.currency(DETAIL.sale);
    $('#reviews').textContent = I.t('detail.reviews', { count: DETAIL.reviews });
    $('#dPeriod').textContent = I.t('detail.basic.periodValue', { start: I.date(DETAIL.start), end: I.date(DETAIL.end), round: DETAIL.round });
    $('#dHours').textContent = I.t('detail.basic.hoursValue', { days: I.count('days', DETAIL.days), hours: I.count('hours', DETAIL.hours) });
    $('#interestBtn span').textContent = I.t(state.interest ? 'detail.cta.interestOn' : 'detail.cta.interest');
    var more = $('#dguideMore');
    $('span', more).textContent = I.t(more.getAttribute('aria-expanded') === 'true' ? 'detail.guide.less' : 'detail.guide.more');

    var period = I.t('apply.periodValue', { start: I.date(DETAIL.start), end: I.date(DETAIL.end), days: I.count('days', DETAIL.days), hours: I.count('hours', DETAIL.hours) });
    $('#mPeriod').textContent = period;
    $('#mRecruit').textContent = I.t('apply.recruitValue', { capacity: pc(DETAIL.capacity), applied: pc(DETAIL.applied) });
    $('#doPeriod').textContent = period;
    $('#doDate').textContent = I.date(DETAIL.applyDate);
  }

  $('#interestBtn').addEventListener('click', function () {
    state.interest = !state.interest;
    this.setAttribute('aria-pressed', String(state.interest));
    $('span', this).textContent = I.t(state.interest ? 'detail.cta.interestOn' : 'detail.cta.interest');
    toast(I.t(state.interest ? 'toast.interestOn' : 'toast.interestOff'));
  });

  $('#dguideMore').addEventListener('click', function () {
    var open = this.getAttribute('aria-expanded') !== 'true';
    this.setAttribute('aria-expanded', String(open));
    $('#dguide').classList.toggle('is-open', open);
    $('span', this).textContent = I.t(open ? 'detail.guide.less' : 'detail.guide.more');
  });

  /* ------------------------------------------------------------------ 수강신청 modal (OVERLAY · DISSOLVE 0.3s ease-in) */
  var modal = $('#applyModal');
  var lastFocus;
  function openModal() {
    lastFocus = document.activeElement;
    clearErrors();
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add('is-on'); });
    document.body.classList.add('no-scroll');
    setTimeout(function () { $('#mPhone').focus(); }, 50);
  }
  function closeModal() {
    modal.classList.remove('is-on');
    document.body.classList.remove('no-scroll');
    setTimeout(function () { modal.hidden = true; }, reduceMotion ? 0 : 300);
    if (lastFocus) lastFocus.focus();
  }
  function clearErrors() {
    ['#mPhoneErr', '#mAgreeErr'].forEach(function (s) { $(s).hidden = true; });
    $('#mPhone').removeAttribute('aria-invalid');
  }
  $('#applyBtn').addEventListener('click', openModal);
  $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', closeModal); });
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      var f = $$('button, input, a[href]', $('.modal__box', modal)).filter(function (x) { return !x.disabled && x.offsetParent; });
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $('#mSubmit').addEventListener('click', function () {
    clearErrors();
    var ok = true;
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test($('#mPhone').value.trim())) {
      ok = false;
      $('#mPhoneErr').textContent = I.t('apply.error.phone');
      $('#mPhoneErr').hidden = false;
      $('#mPhone').setAttribute('aria-invalid', 'true');
      $('#mPhone').focus();
    }
    if (!$('#mAgree').checked) {
      $('#mAgreeErr').textContent = I.t('apply.error.agree');
      $('#mAgreeErr').hidden = false;
      if (ok) $('#mAgree').focus();
      ok = false;
    }
    if (!ok) return;
    modal.classList.remove('is-on');
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
    navigate('#/done', 'dissolve');
  });

  /* ------------------------------------------------------------------ router */
  var ROUTES = { '': 'home', '/': 'home', '/list': 'list', '/detail': 'detail', '/done': 'done' };
  var pendingTransition = null;
  var current = null;

  function navigate(hash, transition) {
    pendingTransition = transition || null;
    if (location.hash === hash) route(); else location.hash = hash;
  }

  function route() {
    var key = location.hash.replace(/^#/, '');
    var page = ROUTES[key] || 'home';
    var from = current;
    var transition = pendingTransition;
    if (!transition && from === 'list' && page === 'detail') transition = 'move-in-bottom';
    pendingTransition = null;

    var animate = transition && !reduceMotion && from && from !== page;
    $$('.page').forEach(function (p) {
      var on = p.dataset.page === page;
      var leaving = animate && p.dataset.page === from;
      p.classList.remove('t-move-in-bottom', 't-dissolve', 'is-leaving');
      p.hidden = !on && !leaving;
      if (leaving) {
        // Figma MOVE_IN / DISSOLVE keep the previous screen underneath while the new one comes in.
        p.classList.add('is-leaving');
        p.style.top = (-window.scrollY) + 'px';
        setTimeout(function () {
          p.classList.remove('is-leaving');
          p.style.top = '';
          if (current !== p.dataset.page) p.hidden = true;
        }, 320);
      }
      if (on && animate) {
        void p.offsetWidth; // restart animation
        p.classList.add('t-' + transition);
      }
    });
    $('#familyBar').hidden = page === 'home';
    document.body.dataset.page = page;
    current = page;
    window.scrollTo(0, 0);
    if (from) $('#main').focus({ preventScroll: true });
    if (page === 'home') { fitCarousel(); schedule(); } else { clearTimeout(autoTimer); }
    updateTitle();
  }
  window.addEventListener('hashchange', route);

  function updateTitle() {
    var map = { home: 'header.logoText', list: 'list.title', detail: 'detail.pageTitle', done: 'done.title' };
    document.title = I.t(map[current] || 'header.logoText') + ' · KRDS';
  }

  /* ------------------------------------------------------------------ footer family toggles */
  $$('.family__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      toast(I.t('toast.demo'));
    });
  });

  /* ------------------------------------------------------------------ number formatting for static stats */
  function renderNumbers() {
    $$('[data-num]').forEach(function (el) { el.textContent = I.number(+el.dataset.num); });
  }

  /* ------------------------------------------------------------------ boot */
  function renderAll() {
    renderNumbers();
    renderFilters();
    renderCourses();
    renderWish();
    renderPaging();
    renderDetail();
    layoutCarousel(false);
    setPlaying(playing);
    markLang();
    updateTitle();
  }
  I.onChange(renderAll);

  I.setLang(I.detect()).then(function () {
    buildCarousel();
    buildLangList();
    renderAll();
    route();
    fitCarousel();
  });
})();
