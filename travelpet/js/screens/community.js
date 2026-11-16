/* 친구 커뮤니티: 광장(펫끼리 만나기) · 친구 목록 · 여행 소식 · 친구 방 놀러가기 · 방명록
 * 서버가 없어서 친구 정보는 '친구 초대 링크'를 주고받을 때의 모습으로 저장돼요.
 * 하트·방명록·댓글도 이 기기에만 저장돼요. 실시간으로 주고받으려면 서버(예: Firebase)가 필요해요.
 */
(function (global) {
  'use strict';
  var UI = global.TPUI, P = global.TPPets, Z = global.TPZodiac, S = global.TPStore;
  var tab = 'plaza', timer = null;

  function cleanup() { if (timer) { clearInterval(timer); timer = null; } }
  function zko(id) { var z = Z.ZODIAC.filter(function (x) { return x.id === id; })[0]; return z ? z.ko : ''; }
  function friend(id) { return S.get().friends.filter(function (f) { return f.id === id; })[0]; }
  function myProfile() {
    var s = S.get();
    if (!s.user.uid) { s.user.uid = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); S.save(); }
    return { id: s.user.uid, name: s.user.name, zodiac: s.user.zodiac, color: s.user.color, petName: s.user.petName, level: S.level(), equip: s.pet.equip, room: { wall: s.room.wall, floor: s.room.floor, items: s.room.items } };
  }
  function pet(f, small) { return P.petSVG(f.zodiac, { color: f.color, equip: f.equip || {}, level: small ? 1 : f.level, label: f.petName }); }

  function render(root) {
    cleanup();
    var s = S.get();
    root.innerHTML = '<div class="page"><div class="page-head"><div><p class="eyebrow">친구와 함께</p><h1>친구 광장</h1></div>' +
      '<button class="btn small mint" id="add-friend">' + UI.icon('user-plus', 20) + ' 친구 추가</button></div>' +
      '<div class="seg"><button data-t="plaza" aria-pressed="' + (tab === 'plaza') + '">광장</button><button data-t="friends" aria-pressed="' + (tab === 'friends') + '">친구 ' + s.friends.length + '</button><button data-t="feed" aria-pressed="' + (tab === 'feed') + '">여행 소식</button></div>' +
      '<div id="cm-body" class="stack" style="gap:16px"></div></div>';
    UI.$$('[data-t]', root).forEach(function (b) { b.onclick = function () { tab = b.dataset.t; render(root); }; });
    root.querySelector('#add-friend').onclick = addFriend;
    var body = root.querySelector('#cm-body');
    ({ plaza: plaza, friends: friends, feed: feed })[tab](body, root);
  }

  /* ---------- 광장: 내 펫과 친구 펫들이 돌아다녀요 ---------- */
  function plaza(body, root) {
    var s = S.get(), me = myProfile();
    var all = [Object.assign({ me: true }, me)].concat(s.friends);
    body.innerHTML = '<div class="plaza" id="plaza">' +
      '<div class="pz-sky"><span class="pz-sun"></span><span class="pz-cloud" style="left:8%;top:14%"></span><span class="pz-cloud" style="left:62%;top:8%;transform:scale(.8)"></span></div>' +
      '<div class="pz-ground"></div>' +
      '<span class="pz-deco" style="left:2%;top:30%">🌳</span><span class="pz-deco" style="left:82%;top:28%">🌳</span><span class="pz-deco" style="left:44%;top:31%;font-size:34px">⛲</span>' +
      '<span class="pz-deco small" style="left:20%;top:86%">🌷</span><span class="pz-deco small" style="left:70%;top:88%">🌼</span><span class="pz-deco small" style="left:90%;top:70%">🌸</span>' +
      all.map(function (f, i) {
        return '<button class="walker" data-id="' + (f.me ? 'me' : f.id) + '" style="left:' + (10 + i * 22) + '%;top:' + (48 + (i % 2) * 16) + '%" aria-label="' + UI.esc(f.name) + '의 ' + UI.esc(f.petName) + '">' +
          '<span class="wk-pet">' + pet(f, true) + '</span><span class="wk-name' + (f.me ? ' me' : '') + '">' + UI.esc(f.me ? '나' : f.name) + '</span></button>';
      }).join('') + '</div>' +
      '<p class="hint" style="text-align:center">펫을 누르면 인사하거나 방에 놀러 갈 수 있어요</p>' +
      '<div class="card stack" style="gap:6px"><strong>오늘 광장 미션</strong>' +
      '<div class="row between"><span class="muted">친구 방 놀러가기</span><span class="badge butter">🪙20 · ' + S.earnedToday('visit') + '/5</span></div>' +
      '<div class="row between"><span class="muted">하트·방명록·댓글 남기기</span><span class="badge butter">🪙5 · ' + S.earnedToday('social') + '/6</span></div></div>';
    var box = body.querySelector('#plaza');
    var walkers = UI.$$('.walker', box);
    function wander() {
      walkers.forEach(function (w) {
        var x = 4 + Math.random() * 70, y = 40 + Math.random() * 36;
        var prev = parseFloat(w.style.left);
        w.classList.toggle('flip', x < prev);
        w.style.left = x + '%'; w.style.top = y + '%';
        w.style.zIndex = Math.round(y);
      });
    }
    setTimeout(wander, 300);
    timer = setInterval(wander, 3200);
    walkers.forEach(function (w) {
      w.onclick = function () {
        if (w.dataset.id === 'me') { w.classList.add('jump'); setTimeout(function () { w.classList.remove('jump'); }, 600); UI.toast('나의 ' + s.user.petName + '예요! 친구 펫을 눌러보세요'); return; }
        profileSheet(w.dataset.id, root);
      };
    });
  }

  function profileSheet(id, root) {
    var f = friend(id); if (!f) return;
    var b = UI.openSheet(f.name + '의 ' + f.petName,
      '<div class="big-pet" style="width:160px;height:160px">' + pet(f) + '</div>' +
      '<div class="row" style="justify-content:center;gap:6px;flex-wrap:wrap"><span class="badge pink">Lv.' + f.level + '</span><span class="badge lav">' + zko(f.zodiac) + '띠</span><span class="badge">❤️ ' + (f.hearts || 0) + '</span>' + (f.sample ? '<span class="badge butter">예시 친구</span>' : '') + '</div>' +
      (f.status ? '<p style="text-align:center;font-weight:700">"' + UI.esc(f.status) + '"</p>' : '') +
      '<div class="grid2"><button class="btn ghost" id="pf-heart">' + UI.icon('heart', 20) + ' 하트 보내기</button><button class="btn" id="pf-visit">' + UI.icon('home', 20) + ' 방 놀러가기</button></div>');
    b.querySelector('#pf-heart').onclick = function () { sendHeart(f); UI.closeSheet(); };
    b.querySelector('#pf-visit').onclick = function () { UI.closeSheet(); location.hash = '#/room/' + f.id; };
  }
  function sendHeart(f) {
    var s = S.get(), k = 'heart:' + f.id + ':' + S.today();
    if (s.likes[k]) { UI.toast('오늘은 이미 ' + f.name + '님에게 하트를 보냈어요'); return; }
    s.likes[k] = 1; f.hearts = (f.hearts || 0) + 1; S.save();
    if (!S.earn('social', 'heart-' + f.id)) UI.toast('❤️ ' + f.name + '님에게 하트를 보냈어요');
  }

  /* ---------- 친구 목록 ---------- */
  function friends(body) {
    var s = S.get(), mine = (s.guestbook.me || []);
    body.innerHTML = s.friends.map(function (f) {
      var last = (f.posts || [])[0];
      return '<div class="card row" style="padding:14px 16px"><div class="pv" style="width:76px;height:76px;flex-shrink:0">' + pet(f) + '</div>' +
        '<div style="flex:1;min-width:0"><div class="row" style="gap:6px;flex-wrap:wrap"><strong style="font-size:18px">' + UI.esc(f.name) + '</strong><span class="badge pink">Lv.' + f.level + '</span>' + (f.sample ? '<span class="badge butter">예시</span>' : '') + '</div>' +
        '<div class="muted" style="font-size:15px">' + UI.esc(f.petName) + ' · ' + zko(f.zodiac) + '띠' + (last ? ' · 최근 ' + UI.esc(last.region.split(' ').pop()) : '') + '</div>' +
        '<div class="row" style="gap:8px;margin-top:8px"><button class="btn small" data-visit="' + f.id + '">' + UI.icon('home', 18) + ' 놀러가기</button><button class="btn small ghost" data-heart="' + f.id + '">' + UI.icon('heart', 18) + ' ' + (f.hearts || 0) + '</button></div></div></div>';
    }).join('') +
      '<div class="card stack" style="gap:10px"><div class="row between"><strong>' + UI.icon('message-circle', 20) + ' 내 방명록</strong><span class="badge">' + mine.length + '개</span></div>' +
      (mine.length ? mine.slice(0, 3).map(function (g) { return '<div class="gb"><span class="avatar">' + P.petSVG(g.zodiac || 'dog') + '</span><div><b>' + UI.esc(g.from) + '</b> <span class="hint">' + UI.fmtDate(g.date) + '</span><div>' + UI.esc(g.text) + '</div></div></div>'; }).join('') : '<p class="hint">친구가 내 방에 남긴 글이 여기 보여요</p>') + '</div>' +
      '<a class="card row between" href="#/dex" style="text-decoration:none"><span><strong>✨ 12간지 펫 도감</strong><br><span class="muted" style="font-size:15px">친구들의 띠 펫을 구경해보세요</span></span><span style="font-size:22px">›</span></a>' +
      '<p class="hint">예시 친구는 커뮤니티를 미리 보여주기 위한 친구예요. 친구 추가로 진짜 친구를 초대해보세요.</p>';
    UI.$$('[data-visit]', body).forEach(function (b) { b.onclick = function () { location.hash = '#/room/' + b.dataset.visit; }; });
    UI.$$('[data-heart]', body).forEach(function (b) { b.onclick = function () { sendHeart(friend(b.dataset.heart)); friends(body); }; });
  }

  /* ---------- 여행 소식 ---------- */
  function feed(body) {
    var s = S.get(), posts = [];
    s.friends.forEach(function (f) { (f.posts || []).forEach(function (p) { posts.push({ f: f, p: p }); }); });
    s.records.slice(0, 3).forEach(function (r) { posts.push({ f: Object.assign({ me: true }, myProfile()), p: { id: 'my-' + r.id, title: r.title, region: r.regionName, date: r.date, mood: r.mood, memo: r.memo, photo: r.photos && r.photos[0] } }); });
    posts.sort(function (a, b) { return a.p.date < b.p.date ? 1 : -1; });
    body.innerHTML = posts.length ? posts.map(function (x) {
      var p = x.p, liked = !!s.likes['post:' + p.id], cs = s.comments[p.id] || [];
      return '<div class="card stack post" style="gap:10px"><div class="row"><span class="avatar" style="width:44px;height:44px">' + pet(x.f, true) + '</span><div style="flex:1"><strong>' + UI.esc(x.f.me ? '나' : x.f.name) + '</strong><div class="hint">' + UI.esc(p.region) + ' · ' + UI.fmtDate(p.date) + '</div></div><span style="font-size:24px">' + (p.mood || '') + '</span></div>' +
        (p.photo ? '<img alt="" src="' + p.photo + '" style="width:100%;border-radius:16px;aspect-ratio:4/3;object-fit:cover">' : '') +
        '<div><div style="font-weight:800;font-size:17px">' + UI.esc(p.title) + '</div>' + (p.memo ? '<p style="font-size:16px">' + UI.esc(p.memo) + '</p>' : '') + '</div>' +
        '<div class="row" style="gap:8px"><button class="btn small ' + (liked ? '' : 'ghost') + '" data-like="' + p.id + '">' + UI.icon('heart', 18) + ' ' + (liked ? '좋아요 취소' : '좋아요') + '</button>' +
        '<button class="btn small ghost" data-cm="' + p.id + '">' + UI.icon('message-circle', 18) + ' 댓글 ' + cs.length + '</button></div>' +
        (cs.length ? '<div class="stack" style="gap:6px">' + cs.map(function (c) { return '<div class="cm"><b>나</b> ' + UI.esc(c) + '</div>'; }).join('') + '</div>' : '') + '</div>';
    }).join('') : '<div class="card empty"><span class="big">📮</span>아직 소식이 없어요</div>';
    UI.$$('[data-like]', body).forEach(function (b) {
      b.onclick = function () {
        var k = 'post:' + b.dataset.like;
        if (s.likes[k]) delete s.likes[k]; else { s.likes[k] = 1; S.earn('social', 'like-' + b.dataset.like); }
        S.save(); feed(body);
      };
    });
    UI.$$('[data-cm]', body).forEach(function (b) {
      b.onclick = function () {
        var sh = UI.openSheet('댓글 남기기', '<form class="row" id="cmf"><input class="input" name="c" maxlength="80" placeholder="따뜻한 한마디" autofocus required><button class="btn" style="flex-shrink:0">등록</button></form>');
        sh.querySelector('#cmf').onsubmit = function (e) {
          e.preventDefault();
          var c = String(new FormData(e.target).get('c') || '').trim(); if (!c) return;
          (s.comments[b.dataset.cm] = s.comments[b.dataset.cm] || []).push(c);
          S.save(); UI.closeSheet(); S.earn('social', 'cm-' + b.dataset.cm + '-' + Date.now()); feed(body);
        };
      };
    });
  }

  /* ---------- 친구 방 놀러가기 ---------- */
  function room(root, id) {
    cleanup();
    var f = friend(id), s = S.get();
    if (!f) { location.hash = '#/friends'; return; }
    var me = myProfile();
    root.innerHTML = '<div class="room" id="room">' + global.TPHome.roomSceneHTML(f.room || { wall: 'plain', floor: 'plain', items: {} }) +
      '<div class="home-top"><a class="icon-btn glass" href="#/friends" aria-label="친구 광장으로">←</a>' +
      '<div class="glass name-card" style="flex:1;max-width:none"><div class="n">' + UI.esc(f.name) + '의 방 <span class="badge pink" style="vertical-align:3px">Lv.' + f.level + '</span></div><div class="s">' + UI.esc(f.petName) + ' · ' + zko(f.zodiac) + '띠' + (f.sample ? ' · 예시 친구' : '') + '</div></div></div>' +
      '<div class="bubble" id="bubble">' + UI.esc(f.status || (s.user.petName + ' 왔구나! 반가워 💕')) + '</div>' +
      '<div class="pet-stage" id="pet" role="button" tabindex="0" aria-label="' + UI.esc(f.petName) + ' 쓰다듬기">' + pet(f) + '</div>' +
      '<div class="visitor" aria-label="놀러 온 내 펫">' + P.petSVG(me.zodiac, { color: me.color, equip: me.equip }) + '<span class="wk-name me">' + UI.esc(s.user.petName) + '</span></div>' +
      '<div class="home-actions" style="grid-template-columns:repeat(3,1fr)">' +
      '<button class="act" id="rv-heart"><span class="e" style="background:var(--pink-soft);color:var(--pink-ink)">' + UI.icon('heart') + '</span>하트 ' + (f.hearts || 0) + '</button>' +
      '<button class="act" id="rv-gb"><span class="e" style="background:var(--sky-soft);color:var(--sky-ink)">' + UI.icon('message-circle') + '</span>방명록</button>' +
      '<button class="act" id="rv-play"><span class="e" style="background:var(--mint-soft)">⚽</span>같이 놀기</button></div></div>';
    var got = S.earn('visit', f.id, { silent: true });
    if (got) UI.coinToast(got, f.name + '님 방 놀러가기');
    var stage = root.querySelector('#pet');
    var bounce = function (cls) { stage.classList.remove('hop', 'wiggle'); void stage.offsetWidth; stage.classList.add(cls); setTimeout(function () { stage.classList.remove(cls); }, 1600); };
    stage.onclick = function () { bounce('wiggle'); root.querySelector('#bubble').textContent = '히히, ' + s.user.petName + ' 손 따뜻하다!'; };
    root.querySelector('#rv-heart').onclick = function () { sendHeart(f); root.querySelector('#rv-heart').lastChild.textContent = '하트 ' + f.hearts; bounce('hop'); };
    root.querySelector('#rv-play').onclick = function () {
      bounce('hop'); root.querySelector('#bubble').textContent = '같이 노니까 최고야! 🎈';
      S.care(-2, 6);
      UI.toast(s.user.petName + '의 행복도가 올라갔어요 😊');
    };
    root.querySelector('#rv-gb').onclick = function () { guestbook(f); };
  }

  function guestbook(f) {
    var s = S.get(), list = s.guestbook[f.id] = s.guestbook[f.id] || [];
    var b = UI.openSheet(f.name + '님의 방명록',
      (list.length ? list.map(function (g) { return '<div class="gb"><span class="avatar">' + P.petSVG(s.user.zodiac, { color: s.user.color }) + '</span><div><b>나</b> <span class="hint">' + UI.fmtDate(g.date) + '</span><div>' + UI.esc(g.text) + '</div></div></div>'; }).join('') : '<p class="hint">첫 방명록을 남겨보세요!</p>') +
      '<form class="row" id="gbf"><input class="input" name="t" maxlength="80" placeholder="예: 방 너무 예쁘다! 다음 여행 같이 가자" autofocus required><button class="btn" style="flex-shrink:0">남기기</button></form>' +
      (f.sample ? '<p class="hint">예시 친구라 이 글은 내 기기에만 저장돼요</p>' : '<p class="hint">방명록은 이 기기에 저장돼요. 친구에게 보이게 하려면 서버 연결이 필요해요</p>'));
    b.querySelector('#gbf').onsubmit = function (e) {
      e.preventDefault();
      var t = String(new FormData(e.target).get('t') || '').trim(); if (!t) return;
      list.unshift({ text: t, date: S.today() }); S.save(); UI.closeSheet();
      if (!S.earn('social', 'gb-' + f.id)) UI.toast('방명록을 남겼어요 💌');
    };
  }

  /* ---------- 친구 추가: 내 펫 정보를 담은 링크 ---------- */
  function encode(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function decode(c) { try { return JSON.parse(decodeURIComponent(escape(atob(c.replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { return null; } }

  function addFriend() {
    var link = location.href.split('#')[0] + '#/friend/' + encode({ v: 1, f: myProfile() });
    var b = UI.openSheet('친구 추가하기',
      '<p class="muted">내 친구 링크를 보내면, 친구가 링크를 열 때 나와 내 펫이 친구 목록에 추가돼요. 친구도 자기 링크를 보내주면 서로 친구가 돼요.</p>' +
      '<button class="btn block" id="af-share">' + UI.icon('user-plus', 20) + ' 내 친구 링크 보내기</button>' +
      '<p class="hint">친구 목록의 방과 펫 모습은 링크를 주고받은 때의 모습이에요.</p>');
    b.querySelector('#af-share').onclick = function () {
      var title = '여행펫에서 ' + S.get().user.name + '님이 친구가 되고 싶대요!';
      if (navigator.share) navigator.share({ title: title, url: link }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { UI.toast('친구 링크를 복사했어요. 친구에게 보내주세요 💌'); }, function () { prompt('친구 링크', link); });
      else prompt('친구 링크', link);
    };
  }

  function accept(root, code) {
    cleanup();
    var d = decode(code), s = S.get();
    if (!d || !d.f || !d.f.zodiac) { UI.toast('친구 링크가 올바르지 않아요'); location.hash = '#/friends'; return; }
    var f = d.f;
    if (f.id === s.user.uid) { UI.toast('내 친구 링크예요. 친구에게 보내주세요!'); location.hash = '#/friends'; return; }
    root.innerHTML = '<div class="page"><div class="page-head"><div><p class="eyebrow">친구 요청</p><h1>' + UI.esc(f.name) + '님과<br>친구가 될까요?</h1></div></div>' +
      '<div class="card stack" style="align-items:center"><div class="big-pet" style="width:170px;height:170px">' + pet(f) + '</div><strong style="font-size:19px">' + UI.esc(f.petName) + '</strong><span class="muted">Lv.' + f.level + ' · ' + zko(f.zodiac) + '띠</span></div>' +
      '<button class="btn block" id="ac-ok">친구 추가하기</button><a class="btn ghost block" href="#/friends">다음에 할게요</a></div>';
    root.querySelector('#ac-ok').onclick = function () {
      s.friends = s.friends.filter(function (x) { return x.id !== f.id; });
      s.friends.unshift({ id: f.id, name: f.name, zodiac: f.zodiac, color: f.color, petName: f.petName, level: f.level, equip: f.equip || {}, room: f.room || { wall: 'plain', floor: 'plain', items: {} }, hearts: 0, posts: [] });
      S.save(); tab = 'friends';
      UI.toast(f.name + '님과 친구가 됐어요! 🎉');
      location.hash = '#/friends';
    };
  }

  global.TPCommunity = { render: render, room: room, accept: accept, cleanup: cleanup };
})(window);
