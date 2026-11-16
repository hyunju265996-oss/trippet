/* 화면 공통 도구: 토스트, 바텀시트, 이스케이프, 사진 축소 */
(function (global) {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var tt;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  var onClose = null, lastFocus = null;
  function openSheet(title, html, opts) {
    opts = opts || {};
    lastFocus = document.activeElement;
    $('#sheet-title').textContent = title;
    var body = $('#sheet-body');
    if (typeof html === 'string') body.innerHTML = html; else { body.innerHTML = ''; body.appendChild(html); }
    $('#sheet').hidden = false;
    $('#sheet-dim').hidden = false;
    onClose = opts.onClose || null;
    setTimeout(function () {
      var f = body.querySelector('[autofocus]') || $('#sheet-close');
      f && f.focus();
    }, 60);
    return body;
  }
  function closeSheet() {
    if ($('#sheet').hidden) return;
    $('#sheet').hidden = true;
    $('#sheet-dim').hidden = true;
    var cb = onClose; onClose = null;
    if (cb) cb();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('DOMContentLoaded', function () {
    $('#sheet-close').addEventListener('click', closeSheet);
    $('#sheet-dim').addEventListener('click', closeSheet);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  });

  // 확인 창. html 옵션으로 미리보기 등을 넣을 수 있고, 취소하면 onCancel이 불린다
  function confirmSheet(title, msg, okText, onOk, opts) {
    opts = opts || {};
    var done = false;
    var b = openSheet(title, (opts.html || '') + '<p class="muted" style="font-size:17px;text-align:' + (opts.html ? 'center' : 'left') + '">' + esc(msg) + '</p>' +
      '<div class="grid2"><button class="btn ghost" data-no>' + esc(opts.cancelText || '취소') + '</button><button class="btn" data-ok>' + esc(okText || '확인') + '</button></div>',
      { onClose: function () { if (!done && opts.onCancel) opts.onCancel(); } });
    b.querySelector('[data-no]').onclick = function () { closeSheet(); };
    b.querySelector('[data-ok]').onclick = function () { done = true; closeSheet(); onOk(); };
  }

  function coinToast(n, why) { toast('🪙 +' + n + ' 코인' + (why ? ' · ' + why : '')); }

  /* 단순한 선 아이콘 (Lucide 아이콘 모양, ISC 라이선스) */
  var ICONS = {
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    'calendar-check': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    map: '<path d="M14.1 5.6a2 2 0 0 0 1.8 0l3.7-1.9A1 1 0 0 1 21 4.6v12.8a1 1 0 0 1-.6.9l-4.5 2.3a2 2 0 0 1-1.8 0l-4.2-2.1a2 2 0 0 0-1.8 0l-3.7 1.8A1 1 0 0 1 3 19.4V6.6a1 1 0 0 1 .6-.9l4.5-2.3a2 2 0 0 1 1.8 0z"/><path d="M15 5.8v15M9 3.2v15"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pencil: '<path d="M21.2 6.8a2.8 2.8 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5z"/>',
    'map-pin': '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.4-6.4 2.1 2.1-6.4z"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C9 3 11 4.5 12 8c1-3.5 3-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
    'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    sparkles: '<path d="M9.9 15.5a2 2 0 0 0-1.4-1.4L2.4 12.5a.5.5 0 0 1 0-1l6.1-1.6a2 2 0 0 0 1.4-1.4l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z"/>'
  };
  function icon(name, size) {
    return '<svg class="ic-svg" width="' + (size || 24) + '" height="' + (size || 24) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  // 사진 → 긴 변 720px JPEG data URL (저장 공간 절약)
  function shrinkImage(file, max) {
    max = max || 720;
    return new Promise(function (resolve) {
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var s = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = function () { resolve(null); };
        img.src = r.result;
      };
      r.onerror = function () { resolve(null); };
      r.readAsDataURL(file);
    });
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p[0] + '.' + p[1] + '.' + p[2];
  }
  function dday(iso) {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var d = new Date(iso + 'T00:00:00');
    var n = Math.round((d - t) / 86400000);
    return n > 0 ? 'D-' + n : n === 0 ? 'D-DAY' : '다녀옴';
  }
  function petMini(animal, color) {
    return global.TPPets.petSVG(animal, { color: color });
  }

  global.TPUI = { $: $, $$: $$, esc: esc, toast: toast, coinToast: coinToast, icon: icon, openSheet: openSheet, closeSheet: closeSheet, confirm: confirmSheet, shrinkImage: shrinkImage, fmtDate: fmtDate, dday: dday, petMini: petMini };
})(window);
