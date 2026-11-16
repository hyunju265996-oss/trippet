/* 메인: 펫의 방 (먹이주기 · 놀아주기 · 펫 꾸미기 · 방 꾸미기) */
(function (global) {
  'use strict';
  var UI = global.TPUI, P = global.TPPets, Z = global.TPZodiac, S = global.TPStore;

  function zodiac(id) { return Z.ZODIAC.filter(function (z) { return z.id === id; })[0]; }
  function find(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  function petHTML(s) {
    return P.petSVG(s.user.zodiac, { color: s.user.color, equip: s.pet.equip, level: S.level(), label: s.user.petName });
  }

  /* 방 배경 + 가구 (내 방, 친구 방 모두 사용) */
  function roomSceneHTML(room) {
    var wall = find(P.WALLPAPERS, room.wall) || P.WALLPAPERS[0];
    var floor = find(P.FLOORS, room.floor) || P.FLOORS[0];
    var items = Object.keys(room.items || {}).map(function (id) {
      var f = find(P.FURNITURE, id); if (!f) return '';
      var pos = room.items[id];
      return '<div class="furn" data-id="' + id + '" aria-label="' + f.name + '" style="left:' + pos.x + '%;top:' + pos.y + '%;width:' + f.w + '%;z-index:' + (f.floor ? 1 : 2) + '">' + f.svg + '</div>';
    }).join('');
    return '<div class="room-wall" style="background:' + wall.css + '"></div><div class="room-floor" style="background:' + floor.css + '"></div><div class="room-items" id="room-items">' + items + '</div>';
  }

  function speech(s) {
    var p = s.pet, z = zodiac(s.user.zodiac);
    if (p.full >= 100 && p.happy < 100) return '배불러요! 이제 같이 놀면 레벨 업할 것 같아요 ⚽';
    if (p.happy >= 100 && p.full < 100) return '너무 행복해요! 맛있는 거 먹으면 레벨 업이에요 🍙';
    if (p.full < 30) return '배고파요… 맛있는 거 주세요 🥺';
    if (p.happy < 30) return '심심해요! 같이 놀아요 ⚽';
    var trip = (s.trips || []).filter(function (t) { return UI.dday(t.start) !== '다녀옴'; })[0];
    if (trip) return trip.title + ' ' + UI.dday(trip.start) + '! 벌써 설레요 ✨';
    var rec = s.records[0];
    if (rec) return rec.regionName.split(' ').pop() + ' 또 가고 싶다~ 다음엔 어디 갈까요?';
    if (!Object.keys(s.room.items).length) return '방이 조금 허전해요. 여행 다녀와서 꾸며줄래요?';
    return z.style + ' 좋아해요! 같이 떠나요 🧳';
  }

  function render(root) {
    var s = S.get();
    S.tick();
    var z = zodiac(s.user.zodiac);
    root.innerHTML =
      '<div class="room" id="room">' + roomSceneHTML(s.room) +
      '<div class="home-top">' +
      '<button class="glass name-card" id="lv-card" aria-label="레벨과 혜택 보기"><div class="n">' + UI.esc(s.user.petName) + ' <span class="badge pink" style="vertical-align:3px">Lv.' + S.level() + '</span></div>' +
      '<div class="s">' + z.ko + '띠 · 행복·포만 100%면 레벨 업</div></button>' +
      '<div class="row" style="gap:8px"><button class="glass coin" id="coin-btn" aria-label="보유 코인, 코인 얻는 법 보기">🪙 <span id="coin">' + s.coins.toLocaleString() + '</span></button>' +
      '<button class="icon-btn glass" id="settings" aria-label="설정">⚙️</button></div></div>' +
      '<div class="home-stats" id="stats">' + stats(s) + '</div>' +
      '<div class="bubble" id="bubble">' + UI.esc(speech(s)) + '</div>' +
      '<button class="collect glass" id="collect" hidden></button>' +
      '<div class="pet-stage" id="pet" role="button" tabindex="0" aria-label="' + UI.esc(s.user.petName) + ' 쓰다듬기">' + petHTML(s) + '</div>' +
      '<div class="home-actions" id="actions">' +
      act('feed', '🍙', '먹이주기', 'var(--butter-soft)') + act('play', '⚽', '놀아주기', 'var(--mint-soft)') +
      act('dress', '🎀', '펫 꾸미기', 'var(--pink-soft)') + act('room', '🛋️', '방 꾸미기', 'var(--sky-soft)') + '</div>' +
      '</div>';
    bind(root);
    showCollect(root);
  }
  function stats(s) { return stat('😊 행복도', s.pet.happy, '') + stat('🍙 포만감', s.pet.full, 'mint'); }
  function stat(label, v, cls) {
    return '<div class="glass stat"><div class="row"><span>' + label + '</span><span>' + Math.floor(v) + '%</span></div><div class="bar ' + cls + '"><i style="width:' + Math.floor(v) + '%"></i></div></div>';
  }
  function act(id, e, label, bg) {
    return '<button class="act" data-act="' + id + '"><span class="e" style="background:' + bg + '">' + e + '</span>' + label + '</button>';
  }

  // 시간이 지나 펫이 모은 코인 받기 버튼
  function showCollect(root) {
    var b = root.querySelector('#collect'); if (!b) return;
    var n = S.passiveAvailable();
    b.hidden = !n;
    b.innerHTML = '🪙 ' + S.get().user.petName + '가 모은 코인 <b>+' + n + '</b> 받기';
  }

  function refresh(root) {
    var s = S.get();
    if (!root.querySelector('#coin')) return;
    root.querySelector('#coin').textContent = s.coins.toLocaleString();
    root.querySelector('#stats').innerHTML = stats(s);
    root.querySelector('#pet').innerHTML = petHTML(s);
    root.querySelector('#bubble').textContent = speech(s);
    root.querySelector('#lv-card .badge').textContent = 'Lv.' + S.level();
    showCollect(root);
    document.dispatchEvent(new CustomEvent('tp:pet-changed'));
  }

  function animate(root, cls, emoji, text) {
    var pet = root.querySelector('#pet'); if (!pet) return;
    pet.classList.remove('hop', 'wiggle', 'sway', 'eat');
    void pet.offsetWidth;
    pet.classList.add(cls);
    setTimeout(function () { pet.classList.remove(cls); }, 1800);
    if (emoji) {
      for (var i = 0; i < 3; i++) {
        var fx = document.createElement('span');
        fx.className = 'fx'; fx.textContent = emoji;
        var r = pet.getBoundingClientRect(), rr = root.querySelector('#room').getBoundingClientRect();
        var sc = rr.width / root.querySelector('#room').offsetWidth || 1;
        fx.style.left = ((r.left - rr.left) / sc + pet.offsetWidth * (0.3 + i * 0.2)) + 'px';
        fx.style.top = ((r.top - rr.top) / sc + pet.offsetHeight * 0.25) + 'px';
        fx.style.animationDelay = (i * 0.18) + 's';
        root.querySelector('#room').appendChild(fx);
        setTimeout(function (el) { el.remove(); }.bind(null, fx), 1700);
      }
    }
    if (text) root.querySelector('#bubble').textContent = text;
  }

  function bind(root) {
    var pet = root.querySelector('#pet');
    var pat = function () { S.care(0, 2); animate(root, 'wiggle', '💗', '히히, 간지러워요!'); setTimeout(function () { refresh(root); }, 1600); };
    pet.onclick = pat;
    pet.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pat(); } };
    root.querySelector('#settings').onclick = function () { global.TPApp.openSettings(); };
    root.querySelector('#coin-btn').onclick = function () { coinSheet(root); };
    root.querySelector('#lv-card').onclick = function () { levelSheet(); };
    root.querySelector('#collect').onclick = function () {
      var n = S.collectPassive();
      if (n) { UI.coinToast(n, S.get().user.petName + '가 모은 코인'); animate(root, 'hop', '🪙'); refresh(root); }
    };
    UI.$$('[data-act]', root).forEach(function (b) {
      b.onclick = function () { ({ feed: feed, play: play, dress: dress, room: decorate })[b.dataset.act](root); };
    });
  }

  /* ---------- 코인 얻는 법 ---------- */
  function coinSheet(root) {
    var s = S.get(), E = S.EARN;
    var rows = Object.keys(E).map(function (k) {
      var r = E[k], done = S.earnedToday(k);
      var status = k === 'passive' ? (S.passiveAvailable() ? '<b style="color:var(--mint-ink)">지금 +' + S.passiveAvailable() + ' 받을 수 있어요</b>' : '모으는 중')
        : k === 'record' ? '횟수 제한 없음'
        : r.perDay ? '오늘 ' + done + '/' + r.perDay : '';
      return '<div class="list-item"><span class="thumb" style="color:var(--pink-ink);background:var(--pink-soft)">' + UI.icon(r.icon) + '</span>' +
        '<span style="flex:1;min-width:0"><span class="t">' + r.name + ' <span style="color:var(--butter-ink)">🪙' + r.amount + '</span></span><br><span class="s">' + r.desc + (status ? ' · ' + status : '') + '</span></span></div>';
    }).join('');
    var b = UI.openSheet('코인 얻는 법', '<div class="card row between" style="padding:14px 18px"><span class="muted">보유 코인</span><strong style="font-size:22px">🪙 ' + s.coins.toLocaleString() + '</strong></div>' +
      '<div class="card list" style="padding:4px 16px">' + rows + '</div>' +
      (S.passiveAvailable() ? '<button class="btn mint block" id="cs-collect">펫이 모은 코인 +' + S.passiveAvailable() + ' 받기</button>' : '') +
      '<p class="hint">하루 한도는 매일 자정에 다시 채워져요</p>');
    var c = b.querySelector('#cs-collect');
    if (c) c.onclick = function () { var n = S.collectPassive(); UI.closeSheet(); if (n) { UI.coinToast(n, '펫이 모은 코인'); refresh(root); } };
  }

  /* ---------- 레벨 & 혜택 ---------- */
  function unlocksAt(lv) {
    var names = [];
    [P.ACCESSORIES, P.FURNITURE, P.WALLPAPERS, P.FLOORS, P.FOODS].forEach(function (list) {
      list.forEach(function (x) { if (x.lv === lv) names.push(x.name); });
    });
    return names;
  }
  function levelSheet() {
    var s = S.get(), lv = S.level();
    var rows = global.TPData.LEVELS.map(function (L) {
      var got = lv >= L.lv, un = unlocksAt(L.lv);
      return '<div class="lv-row' + (got ? ' got' : '') + '"><span class="lv-badge">Lv.' + L.lv + '</span><div style="flex:1;min-width:0">' +
        '<div class="t">🪙 ' + L.coins + (L.coupon ? ' · 🎟️ ' + L.coupon.title : '') + '</div>' +
        (un.length ? '<div class="s">새로 열림: ' + un.join(', ') + '</div>' : '') +
        (L.lv === 3 ? '<div class="s">✨ 펫 주변에 반짝이</div>' : L.lv === 6 ? '<div class="s">✨ 빛나는 오라</div>' : L.lv === 9 ? '<div class="s">✨ 천사 링</div>' : '') +
        '</div><span class="hint">' + (got ? '받음' : '') + '</span></div>';
    }).join('');
    var coupons = s.coupons.length ? s.coupons.map(function (c) {
      return '<div class="coupon"><span class="ci">' + UI.icon('ticket') + '</span><div style="flex:1"><div class="t">' + UI.esc(c.title) + '</div><div class="s">' + UI.esc(c.desc) + ' · Lv.' + c.lv + ' 보상</div></div></div>';
    }).join('') : '<p class="empty" style="padding:12px">레벨 3부터 여행 쿠폰을 받아요</p>';
    UI.openSheet('Lv.' + lv + ' · 레벨 혜택',
      '<div class="card stack" style="gap:8px"><strong>레벨 올리는 법</strong><p class="muted" style="font-size:15px">먹이를 주고 놀아줘서 <b>행복도와 포만감을 둘 다 100%</b>로 채우면 레벨이 올라가요. 레벨이 오를수록 더 예쁜 꾸미기 아이템과 맛있는 먹이가 열리고 여행 쿠폰도 받아요.</p>' +
      '<div class="grid2"><div><div class="row between" style="font-size:14px;font-weight:700"><span>행복도</span><span>' + Math.floor(s.pet.happy) + '%</span></div><div class="bar"><i style="width:' + s.pet.happy + '%"></i></div></div>' +
      '<div><div class="row between" style="font-size:14px;font-weight:700"><span>포만감</span><span>' + Math.floor(s.pet.full) + '%</span></div><div class="bar mint"><i style="width:' + s.pet.full + '%"></i></div></div></div></div>' +
      '<h3 style="font-size:18px;font-weight:800">🎟️ 내 쿠폰함</h3>' + coupons +
      '<p class="hint">쿠폰은 예시 혜택이에요. 실제 사용은 숙소·관광지 제휴가 연결되면 가능해요.</p>' +
      '<h3 style="font-size:18px;font-weight:800">레벨별 보상</h3><div class="stack" style="gap:8px">' + rows + '</div>');
  }

  /* 레벨 업 축하 (app.js에서 전역으로 연결) */
  function levelUpSheet(info) {
    var L = info.reward, un = unlocksAt(info.level);
    UI.openSheet('🎉 레벨 업! Lv.' + info.level,
      '<div class="big-pet" style="width:170px;height:170px">' + petHTML(S.get()) + '</div>' +
      '<p class="muted" style="text-align:center">' + UI.esc(S.get().user.petName) + '가 한 뼘 더 자랐어요!</p>' +
      '<div class="card stack" style="gap:10px"><div class="row"><span class="thumb" style="background:var(--butter-soft)">🪙</span><strong>코인 ' + L.coins + '개</strong></div>' +
      (L.coupon ? '<div class="row"><span class="thumb" style="background:var(--pink-soft)">🎟️</span><div><strong>' + UI.esc(L.coupon.title) + '</strong><div class="hint">쿠폰함에 담았어요 (예시 혜택)</div></div></div>' : '') +
      (un.length ? '<div class="row" style="align-items:flex-start"><span class="thumb" style="background:var(--mint-soft)">🎁</span><div><strong>새로 열린 아이템</strong><div class="muted" style="font-size:15px">' + un.join(', ') + '</div></div></div>' : '') +
      '</div><button class="btn block" id="lu-ok">좋아요!</button>');
    UI.$('#lu-ok').onclick = function () { UI.closeSheet(); };
    document.dispatchEvent(new CustomEvent('tp:pet-changed'));
  }

  /* ---------- 먹이주기 ---------- */
  function lockedTag(x) { return '🔒 Lv.' + x.lv + '부터'; }
  function feed(root) {
    var s = S.get(), today = S.today(), lv = S.level();
    var html = '<p class="muted">포만감 ' + Math.floor(s.pet.full) + '% · 보유 🪙 ' + s.coins.toLocaleString() + '</p><div class="shop-grid">' +
      P.FOODS.map(function (f) {
        var free = f.price === 0, used = free && s.pet.freeFood === today, locked = f.lv > lv;
        return '<button class="shop-item' + (locked ? ' locked' : '') + '" data-food="' + f.id + '" ' + (used ? 'disabled style="opacity:.45"' : '') + '><span class="ic">' + f.emoji + '</span>' + f.name +
          '<span class="p">' + (locked ? lockedTag(f) : free ? (used ? '내일 또 받아요' : '오늘 무료') : '🪙 ' + f.price) + '</span><span class="p">포만 +' + f.full + ' · 행복 +' + f.happy + '</span></button>';
      }).join('') + '</div><p class="hint">레벨이 오르면 더 맛있는 먹이가 열려요</p>';
    var b = UI.openSheet('먹이주기', html);
    UI.$$('[data-food]', b).forEach(function (el) {
      el.onclick = function () {
        var f = find(P.FOODS, el.dataset.food);
        if (f.lv > S.level()) { UI.toast('Lv.' + f.lv + '이 되면 ' + f.name + '을(를) 줄 수 있어요'); return; }
        if (s.pet.full >= 100) { UI.toast(s.user.petName + '는 지금 배불러요! 놀아주면 레벨 업에 가까워져요'); return; }
        if (f.price === 0) s.pet.freeFood = today;
        else if (!S.spend(f.price)) { UI.toast('코인이 부족해요. 🪙를 눌러 코인 얻는 법을 확인해보세요'); return; }
        S.care(f.full, f.happy);
        UI.closeSheet();
        animate(root, 'eat', f.emoji, '냠냠! ' + f.name + ' 최고예요 😋');
        setTimeout(function () { refresh(root); }, 1600);
      };
    });
  }

  /* ---------- 놀아주기 ---------- */
  function play(root) {
    var s = S.get();
    var b = UI.openSheet('놀아주기', '<p class="muted">행복도 ' + Math.floor(s.pet.happy) + '% · 놀면 배가 조금 고파져요</p><div class="shop-grid">' +
      P.TOYS.map(function (t) { return '<button class="shop-item" data-toy="' + t.id + '"><span class="ic">' + t.emoji + '</span>' + t.name + '<span class="p">행복 +' + t.happy + '</span></button>'; }).join('') + '</div>');
    UI.$$('[data-toy]', b).forEach(function (el) {
      el.onclick = function () {
        var t = find(P.TOYS, el.dataset.toy);
        if (s.pet.full < 10) { UI.toast('너무 배고파서 못 놀겠대요. 먹이를 먼저 주세요!'); return; }
        if (s.pet.happy >= 100) { UI.toast('행복도가 가득 찼어요! 먹이를 주면 레벨 업에 가까워져요'); return; }
        S.care(-3, t.happy);
        UI.closeSheet();
        animate(root, t.anim, t.emoji, ['신난다!', '한 번 더!', '최고의 하루예요!'][Math.floor(Math.random() * 3)]);
        setTimeout(function () { refresh(root); }, 1700);
      };
    });
  }

  /* 구매 확인: "OO을(를) 🪙N에 구매할까요?" */
  function confirmBuy(item, previewHTML, onBought, back) {
    var s = S.get();
    if (s.coins < item.price) {
      UI.toast('코인이 ' + (item.price - s.coins) + '개 부족해요. 🪙를 눌러 코인 얻는 법을 확인해보세요');
      return;
    }
    UI.confirm('구매하시겠습니까?', item.name + '을(를) 🪙' + item.price + '에 구매할까요? (구매 후 🪙' + (s.coins - item.price) + ')', '구매하기', function () {
      if (!S.spend(item.price)) return;
      onBought();
      S.save();
      UI.toast(item.name + ' 구매 완료! 🎁');
      back();
    }, { html: '<div class="buy-preview">' + previewHTML + '</div>', onCancel: back });
  }

  /* ---------- 펫 꾸미기 ---------- */
  function dress(root) {
    var s = S.get(), tab = 'color';
    function draw() {
      var lv = S.level();
      var html = '<div class="big-pet" style="width:180px;height:180px">' + petHTML(s) + '</div>' +
        '<div class="chips" role="tablist">' + [['color', '🎨 색상']].concat(P.SLOTS.map(function (x) { return [x.id, x.name]; })).map(function (t) {
          return '<button class="chip" role="tab" data-tab="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>';
        }).join('') + '</div>';
      if (tab === 'color') {
        html += '<div class="colors">' + P.PALETTE.map(function (p) {
          return '<button type="button" class="swatch" data-color="' + p.hex + '" aria-pressed="' + (p.hex === s.user.color) + '" aria-label="' + p.name + '" style="background:' + p.hex + '"></button>';
        }).join('') + '</div><p class="hint">색 변경은 무료예요</p>';
      } else {
        var items = P.ACCESSORIES.filter(function (a) { return a.slot === tab; });
        html += '<div class="shop-grid">' + items.map(function (a) {
          var own = s.pet.owned.indexOf(a.id) !== -1, on = s.pet.equip[tab] === a.id, locked = !own && a.lv > lv;
          return '<button class="shop-item ' + (on ? 'on' : '') + (locked ? ' locked' : '') + '" data-acc="' + a.id + '"><span class="ic"><svg viewBox="20 -10 160 190">' + a.svg + '</svg></span>' + a.name +
            '<span class="p">' + (on ? '착용 중 · 벗기' : own ? '보유 중 · 입기' : locked ? lockedTag(a) : '🪙 ' + a.price) + '</span></button>';
        }).join('') + '</div>';
      }
      html += '<p class="hint">보유 🪙 ' + s.coins.toLocaleString() + ' · 레벨이 오르면 더 예쁜 아이템이 열려요</p>';
      var b = UI.openSheet('펫 꾸미기', html, { onClose: function () { refresh(root); } });
      UI.$$('[data-tab]', b).forEach(function (el) { el.onclick = function () { tab = el.dataset.tab; draw(); }; });
      UI.$$('[data-color]', b).forEach(function (el) { el.onclick = function () { s.user.color = el.dataset.color; S.save(); draw(); }; });
      UI.$$('[data-acc]', b).forEach(function (el) {
        el.onclick = function () {
          var a = find(P.ACCESSORIES, el.dataset.acc);
          if (s.pet.owned.indexOf(a.id) === -1) {
            if (a.lv > S.level()) { UI.toast('Lv.' + a.lv + '이 되면 ' + a.name + '을(를) 살 수 있어요'); return; }
            var preview = P.petSVG(s.user.zodiac, { color: s.user.color, equip: Object.assign({}, s.pet.equip, (function () { var o = {}; o[a.slot] = a.id; return o; })()), level: S.level() });
            confirmBuy(a, preview, function () { s.pet.owned.push(a.id); s.pet.equip[a.slot] = a.id; }, draw);
            return;
          }
          s.pet.equip[a.slot] = s.pet.equip[a.slot] === a.id ? null : a.id;
          S.save(); draw();
        };
      });
    }
    draw();
  }

  /* ---------- 방 꾸미기 ---------- */
  function decorate(root) {
    var s = S.get(), tab = 'furn';
    function draw() {
      var lv = S.level();
      var html = '<div class="chips">' + [['furn', '🪑 가구·소품'], ['wall', '🖼️ 벽지'], ['floor', '🟫 바닥']].map(function (t) {
        return '<button class="chip" data-tab="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>';
      }).join('') + '</div><div class="shop-grid">';
      if (tab === 'furn') {
        html += P.FURNITURE.map(function (f) {
          var own = s.room.owned.indexOf(f.id) !== -1, on = !!s.room.items[f.id], locked = !own && f.lv > lv;
          return '<button class="shop-item ' + (on ? 'on' : '') + (locked ? ' locked' : '') + '" data-furn="' + f.id + '"><span class="ic" style="padding:6px">' + f.svg + '</span>' + f.name +
            '<span class="p">' + (on ? '배치됨 · 빼기' : own ? '보관 중 · 놓기' : locked ? lockedTag(f) : '🪙 ' + f.price) + '</span></button>';
        }).join('');
      } else {
        var list = tab === 'wall' ? P.WALLPAPERS : P.FLOORS, owned = tab === 'wall' ? s.room.ownedWall : s.room.ownedFloor, cur = tab === 'wall' ? s.room.wall : s.room.floor;
        html += list.map(function (w) {
          var own = owned.indexOf(w.id) !== -1, locked = !own && w.lv > lv;
          return '<button class="shop-item ' + (w.id === cur ? 'on' : '') + (locked ? ' locked' : '') + '" data-surf="' + w.id + '"><span class="ic" style="background:' + w.css + '"></span>' + w.name +
            '<span class="p">' + (w.id === cur ? '사용 중' : own ? '보유 중' : locked ? lockedTag(w) : '🪙 ' + w.price) + '</span></button>';
        }).join('');
      }
      html += '</div><p class="hint">보유 🪙 ' + s.coins.toLocaleString() + '</p>' +
        '<button class="btn sky block" id="arrange">✋ 가구 위치 옮기기</button>';
      var b = UI.openSheet('방 꾸미기', html, { onClose: function () { render(root); } });
      UI.$$('[data-tab]', b).forEach(function (el) { el.onclick = function () { tab = el.dataset.tab; draw(); }; });
      UI.$$('[data-furn]', b).forEach(function (el) {
        el.onclick = function () {
          var f = find(P.FURNITURE, el.dataset.furn);
          if (s.room.items[f.id]) { delete s.room.items[f.id]; S.save(); draw(); return; }
          if (s.room.owned.indexOf(f.id) === -1) {
            if (f.lv > S.level()) { UI.toast('Lv.' + f.lv + '이 되면 ' + f.name + '을(를) 살 수 있어요'); return; }
            confirmBuy(f, '<div style="width:120px;margin:0 auto">' + f.svg + '</div>', function () {
              s.room.owned.push(f.id); s.room.items[f.id] = { x: f.place[0], y: f.place[1] };
              S.care(0, 8);
            }, draw);
            return;
          }
          s.room.items[f.id] = { x: f.place[0], y: f.place[1] };
          S.save(); draw();
        };
      });
      UI.$$('[data-surf]', b).forEach(function (el) {
        el.onclick = function () {
          var list = tab === 'wall' ? P.WALLPAPERS : P.FLOORS, owned = tab === 'wall' ? s.room.ownedWall : s.room.ownedFloor;
          var w = find(list, el.dataset.surf);
          var apply = function () { if (tab === 'wall') s.room.wall = w.id; else s.room.floor = w.id; };
          if (owned.indexOf(w.id) === -1) {
            if (w.lv > S.level()) { UI.toast('Lv.' + w.lv + '이 되면 ' + w.name + '을(를) 살 수 있어요'); return; }
            confirmBuy(w, '<div style="width:140px;height:90px;margin:0 auto;border-radius:16px;background:' + w.css + '"></div>', function () {
              owned.push(w.id); apply(); S.care(0, 6);
            }, draw);
            return;
          }
          apply(); S.save(); draw();
        };
      });
      b.querySelector('#arrange').onclick = function () {
        if (!Object.keys(s.room.items).length) { UI.toast('먼저 가구를 하나 놓아주세요'); return; }
        UI.closeSheet();
        arrange(root);
      };
    }
    draw();
  }

  /* 가구 끌어서 옮기기 */
  function arrange(root) {
    var room = root.querySelector('#room'), s = S.get();
    room.classList.add('editing');
    root.querySelector('#actions').hidden = true;
    root.querySelector('#bubble').hidden = true;
    root.querySelector('#collect').hidden = true;
    var bar = document.createElement('div');
    bar.className = 'glass edit-bar';
    bar.innerHTML = '<strong>가구를 끌어서 옮겨보세요</strong><button class="btn small" id="done">완료</button>';
    room.appendChild(bar);
    var drag = null;
    UI.$$('.furn', room).forEach(function (el) {
      el.onpointerdown = function (e) {
        var r = room.getBoundingClientRect(), er = el.getBoundingClientRect();
        drag = { el: el, dx: e.clientX - er.left, dy: e.clientY - er.top, r: r };
        el.classList.add('dragging');
        el.setPointerCapture(e.pointerId);
      };
      el.onpointermove = function (e) {
        if (!drag || drag.el !== el) return;
        var x = (e.clientX - drag.r.left - drag.dx) / drag.r.width * 100;
        var y = (e.clientY - drag.r.top - drag.dy) / drag.r.height * 100;
        x = Math.max(-5, Math.min(95, x)); y = Math.max(0, Math.min(92, y));
        el.style.left = x + '%'; el.style.top = y + '%';
        s.room.items[el.dataset.id] = { x: +x.toFixed(1), y: +y.toFixed(1) };
      };
      el.onpointerup = el.onpointercancel = function () { if (drag) drag.el.classList.remove('dragging'); drag = null; };
    });
    bar.querySelector('#done').onclick = function () { S.save(); UI.toast('방 배치를 저장했어요 🏠'); render(root); };
  }

  global.TPHome = { render: render, roomSceneHTML: roomSceneHTML, levelSheet: levelSheet, levelUpSheet: levelUpSheet, coinSheet: coinSheet };
})(window);
