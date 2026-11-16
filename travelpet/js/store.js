/* 상태 저장소 (브라우저 localStorage) · 코인 얻기 · 레벨 업 */
(function (global) {
  'use strict';
  var KEY = 'travelpet:v1';
  var state = null;
  var listeners = [];
  var levelUpHandlers = [];

  /* ---------- 코인을 얻는 방법 (하루 한도 포함) ---------- */
  var EARN = {
    attend:  { name: '매일 출석', icon: 'calendar-check', amount: 30, perDay: 1, desc: '하루 한 번 앱을 열면' },
    passive: { name: '펫이 모은 코인', icon: 'clock', amount: 10, desc: '1시간마다 🪙10 (최대 12시간치)' },
    record:  { name: '여행 기록 남기기', icon: 'pencil', amount: 100, desc: '기록 1건 🪙100 · 처음 간 곳 +🪙50' },
    plan:    { name: '여행 계획 만들기', icon: 'calendar', amount: 50, perDay: 3, desc: '새 여행 계획 1개마다' },
    place:   { name: '일정에 장소 담기', icon: 'map-pin', amount: 10, perDay: 10, desc: '장소 1곳마다' },
    explore: { name: '여행지 구경하기', icon: 'compass', amount: 5, perDay: 10, desc: '지도에서 지역·명소를 볼 때마다' },
    visit:   { name: '친구 방 놀러가기', icon: 'home', amount: 20, perDay: 5, desc: '친구 1명마다 하루 한 번' },
    social:  { name: '친구와 소통하기', icon: 'heart', amount: 5, perDay: 6, desc: '하트·방명록·댓글' }
  };
  var PASSIVE_MAX_H = 12;

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { state = null; }
    if (state) migrate(state);
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { global.TPUI && global.TPUI.toast('저장 공간이 부족해요. 사진 몇 장을 지워주세요.'); }
    listeners.forEach(function (fn) { fn(state); });
  }
  function set(s) { migrate(s); state = s; save(); }
  function get() { return state; }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} state = null; }
  function onChange(fn) { listeners.push(fn); }
  function onLevelUp(fn) { levelUpHandlers.push(fn); }

  /* 예전 저장 데이터를 새 구조로 맞춘다 */
  function migrate(s) {
    var p = s.pet;
    if (!p.level) p.level = Math.max(1, Math.floor((p.exp || 0) / 100) + 1);
    s.coupons = s.coupons || [];
    s.earn = s.earn || { day: '', counts: {}, seen: {} };
    s.earn.lastPassive = s.earn.lastPassive || Date.now();
    s.friends = s.friends || (global.TPData ? global.TPData.sampleFriends() : []);
    s.guestbook = s.guestbook || {};
    s.likes = s.likes || {};
    s.comments = s.comments || {};
    s.room.owned = s.room.owned || [];
    // 특별·광역시는 도시 하나로 합쳐졌으므로 예전 구 단위 기록을 옮긴다 (예: 26:해운대구 → 26:부산광역시)
    var METRO = { '11': '서울특별시', '26': '부산광역시', '27': '대구광역시', '28': '인천광역시', '29': '광주광역시', '30': '대전광역시', '31': '울산광역시', '36': '세종특별자치시' };
    (s.records || []).forEach(function (r) {
      if (r.scope !== 'kr') return;
      var code = String(r.region).split(':')[0];
      if (METRO[code] && r.region !== code + ':' + METRO[code]) { r.region = code + ':' + METRO[code]; r.regionName = METRO[code]; }
    });
  }

  /* 시간이 지나면 배고프고 심심해진다 (시간당 포만 -4, 행복 -3, 최소 5) */
  function tick() {
    if (!state) return;
    var p = state.pet, now = Date.now();
    var h = (now - (p.last || now)) / 3600000;
    if (h > 0.02) {
      p.full = Math.max(5, p.full - h * 4);
      p.happy = Math.max(5, p.happy - h * 3);
      p.last = now;
    }
  }

  function level() { return state.pet.level || 1; }
  function clamp(v) { return Math.max(0, Math.min(100, v)); }

  /* 행복도와 포만감이 모두 100%가 되면 레벨 업 → 보상 지급, 상태는 70%로 */
  function checkLevel() {
    var p = state.pet;
    if (p.full < 100 || p.happy < 100) return null;
    p.level = (p.level || 1) + 1;
    p.full = 70; p.happy = 70;
    var reward = (global.TPData.LEVELS.filter(function (l) { return l.lv === p.level; })[0]) ||
      { lv: p.level, coins: 50 * p.level };
    state.coins += reward.coins;
    if (reward.coupon) state.coupons.unshift({ id: 'c' + Date.now().toString(36), lv: p.level, title: reward.coupon.title, desc: reward.coupon.desc, got: today(), used: false });
    var info = { level: p.level, reward: reward };
    setTimeout(function () { levelUpHandlers.forEach(function (fn) { fn(info); }); }, 900);
    return info;
  }

  // 펫 상태 변경 (포만/행복). 레벨 업이면 정보를 돌려준다
  function care(full, happy) {
    var p = state.pet;
    p.full = clamp(p.full + (full || 0));
    p.happy = clamp(p.happy + (happy || 0));
    var up = checkLevel();
    save();
    return up;
  }

  function rollDay() {
    var e = state.earn, d = today();
    if (e.day !== d) { e.day = d; e.counts = {}; e.seen = {}; }
    return e;
  }
  function earnedToday(kind) { var e = rollDay(); return e.counts[kind] || 0; }

  /* 코인 얻기. key가 있으면 같은 대상은 하루 한 번만. 받은 코인 수를 돌려준다 */
  function earn(kind, key, opts) {
    opts = opts || {};
    var rule = EARN[kind]; if (!rule || !state) return 0;
    var e = rollDay();
    if (key) { var k = kind + ':' + key; if (e.seen[k]) return 0; e.seen[k] = 1; }
    if (rule.perDay && (e.counts[kind] || 0) >= rule.perDay) { save(); return 0; }
    var amount = opts.amount || rule.amount;
    e.counts[kind] = (e.counts[kind] || 0) + 1;
    state.coins += amount;
    save();
    if (!opts.silent && global.TPUI) global.TPUI.coinToast(amount, rule.name);
    return amount;
  }

  /* 매일 출석 (앱을 열 때 한 번) */
  function attend() {
    if (!state) return 0;
    return earnedToday('attend') ? 0 : earn('attend');
  }

  /* 펫이 시간이 지나며 모은 코인 */
  function passiveAvailable() {
    if (!state) return 0;
    var h = Math.min(PASSIVE_MAX_H, (Date.now() - state.earn.lastPassive) / 3600000);
    return Math.floor(h) * EARN.passive.amount;
  }
  function collectPassive() {
    var n = passiveAvailable();
    if (!n) return 0;
    state.earn.lastPassive = Date.now();
    state.coins += n;
    save();
    return n;
  }

  /* 여행 기록 보상: 기록 1건 +100코인, 처음 가 본 지역이면 +50 추가 */
  function addRecord(rec) {
    var first = !state.records.some(function (r) { return r.region === rec.region; });
    rec.id = 'r' + Date.now().toString(36);
    state.records.unshift(rec);
    var reward = 100 + (first ? 50 : 0);
    state.coins += reward;
    state.pet.happy = clamp(state.pet.happy + 15);
    var up = checkLevel();
    save();
    return { reward: reward, first: first, levelUp: up };
  }

  function spend(n) {
    if (state.coins < n) return false;
    state.coins -= n;
    return true;
  }

  global.TPStore = {
    EARN: EARN, load: load, save: save, set: set, get: get, reset: reset, onChange: onChange, onLevelUp: onLevelUp,
    tick: tick, level: level, care: care, addRecord: addRecord, spend: spend,
    earn: earn, earnedToday: earnedToday, attend: attend, passiveAvailable: passiveAvailable, collectPassive: collectPassive, today: today
  };
})(window);
