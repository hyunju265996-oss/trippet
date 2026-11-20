/*
 * Tiny i18n runtime for the KRDS prototype.
 * - Strings live in locales/<lang>.json (ko, en, zh, ja). Keys describe role + location, e.g. "list.card.wish".
 * - {name} placeholders are interpolated as whole sentences (no string concatenation across words).
 * - Plurals: if vars.count is given and "<key>.<category>" exists (Intl.PluralRules), that variant is used.
 * - Dates / numbers / currency follow the locale's "format.*" patterns + Intl.NumberFormat.
 * - When opened from file:// (fetch blocked), falls back to locales/bundle.js generated from the same JSON.
 */
(function () {
  'use strict';

  var SUPPORTED = ['ko', 'en', 'zh', 'ja'];
  var STORAGE_KEY = 'krds.lang';
  var cache = {};
  var dict = {};
  var current = 'ko';
  var listeners = [];

  function flatten(obj, prefix, out) {
    out = out || {};
    Object.keys(obj).forEach(function (k) {
      var key = prefix ? prefix + '.' + k : k;
      var v = obj[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
      else out[key] = v;
    });
    return out;
  }

  function loadBundle() {
    if (window.__KRDS_LOCALES__) return Promise.resolve(window.__KRDS_LOCALES__);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'locales/bundle.js';
      s.onload = function () { resolve(window.__KRDS_LOCALES__ || {}); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function load(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);
    var viaFetch = location.protocol === 'file:'
      ? Promise.reject(new Error('file protocol'))
      : fetch('locales/' + lang + '.json', { cache: 'no-cache' }).then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.json();
        });
    return viaFetch
      .catch(function () { return loadBundle().then(function (b) { return b[lang]; }); })
      .then(function (json) {
        cache[lang] = flatten(json || {});
        return cache[lang];
      });
  }

  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (m, name) {
      return Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : m;
    });
  }

  function t(key, vars) {
    var str;
    if (vars && typeof vars.count === 'number') {
      var cat = new Intl.PluralRules(dict['meta.locale'] || 'ko-KR').select(vars.count);
      str = dict[key + '.' + cat];
      if (str == null) str = dict[key + '.other'];
    }
    if (str == null) str = dict[key];
    if (str == null) {
      if (window.console) console.warn('[i18n] missing key:', key, '(' + current + ')');
      return key;
    }
    var v = vars;
    if (vars && typeof vars.count === 'number' && vars.countText == null) {
      v = Object.assign({}, vars, { count: number(vars.count) });
    }
    return interpolate(str, v);
  }

  function number(n) {
    return new Intl.NumberFormat(dict['meta.locale'] || 'ko-KR').format(n);
  }

  function currency(n) {
    return t('format.currency', { amount: number(n) });
  }

  // date: ISO "YYYY-MM-DD" -> locale pattern from format.date
  function date(iso) {
    var p = String(iso).split('-');
    var pattern = dict['format.date'] || 'YYYY-MM-DD';
    return pattern.replace('YYYY', p[0]).replace('MM', p[1]).replace('DD', p[2]);
  }

  function count(kind, n) { return t('format.count.' + kind, { count: n }); }

  // Only our own locale files feed this; the allow-list keeps it to <em>/<strong>/<br>.
  function safeHtml(str) {
    var esc = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc
      .replace(/&lt;(\/?)(em|strong|b)&gt;/g, '<$1$2>')
      .replace(/\n/g, '<br>');
  }

  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = safeHtml(t(el.getAttribute('data-i18n-html')));
    });
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf(':');
        if (i < 0) return;
        el.setAttribute(pair.slice(0, i).trim(), t(pair.slice(i + 1).trim()));
      });
    });
  }

  function detect() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q && SUPPORTED.indexOf(q) > -1) return q;
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s && SUPPORTED.indexOf(s) > -1) return s;
    } catch (e) { /* storage blocked */ }
    return 'ko';
  }

  var fontLinks = {
    zh: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap',
    ja: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap'
  };
  function ensureFont(lang) {
    if (!fontLinks[lang] || document.getElementById('font-' + lang)) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.id = 'font-' + lang; l.href = fontLinks[lang];
    document.head.appendChild(l);
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) < 0) lang = 'ko';
    return load(lang).then(function (d) {
      dict = d; current = lang;
      var html = document.documentElement;
      html.lang = d['meta.htmlLang'] || lang;
      html.dir = d['meta.dir'] || 'ltr';
      html.setAttribute('data-lang', lang);
      ensureFont(lang);
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
      apply(document);
      listeners.forEach(function (fn) { fn(lang); });
      return lang;
    });
  }

  // Preload all language names for the switcher (each shown in its own language).
  function languageNames() {
    return Promise.all(SUPPORTED.map(function (l) {
      return load(l).then(function (d) { return { code: l, name: d['meta.languageName'] || l }; });
    }));
  }

  window.I18N = {
    SUPPORTED: SUPPORTED,
    t: t, number: number, currency: currency, date: date, count: count,
    apply: apply, setLang: setLang, detect: detect, languageNames: languageNames,
    get lang() { return current; },
    onChange: function (fn) { listeners.push(fn); }
  };
})();
