/* 票務交流區：百花繚乱あやふぶみ 演唱會，台灣ミオファ換票／讓票／徵票。
 * 資料在 Supabase 的 ticket_posts 表（supabase/002_ticket_posts.sql）。
 * 所有人都能看貼文；聯絡方式只有登入者看得到；只有登入者能投稿，且只能改／刪自己的。
 */
(function () {
  'use strict';

  const LANG_KEY = 'mio-ledger-lang';
  const THEME_KEY = 'mio-ledger-theme';
  const COLS_PUBLIC = 'id,user_id,kind,nickname,session,seat,platform,want_session,want_seat,want_platform,qty,note,status,hidden,created_at,updated_at';
  const KINDS = ['exchange', 'give', 'want'];
  const SESSIONS = ['Day1', 'Day2'];
  const ZONES = ['SS', 'S', 'A', 'B'];
  const WANT_ZONES = ZONES.concat('any');
  const PLATFORMS = ['zaiko', 'lawson'];
  const WANT_PLATFORMS = PLATFORMS.concat('any');

  const I18N = {
    'zh-Hant': {
      'doc.title': '票務交流區｜ミオファ的高麗菜園',
      'doc.desc': '百花繚乱あやふぶみ 演唱會，台灣ミオファ的票務交流區。非官方粉絲製作。',
      brand: 'ミオファ的高麗菜園', 'nav.ledger': '繳稅紀錄簿', 'nav.tickets': '票務交流區',
      title: '票務交流區',
      lead: '百花繚乱あやふぶみ 演唱會，台灣ミオファ交流換票、讓票、徵票的地方。所有交易一律依座位原價，請自行確認對方身分與票券真偽，本站不經手任何交易，也不協助處理任何交易糾紛，請自行解決。',
      'form.title': '我要投稿', 'form.edit': '修改我的投稿',
      'form.needLogin': '投稿需要先用 Google 登入。', 'form.loginHint': '請點右上角的「Google 登入」。',
      'form.warn': '請勿張貼身分證、完整票號、QR Code 等個人或票券敏感資料。聯絡方式只有登入的人看得到。',
      'f.kind': '類型', 'f.nick': '暱稱（最多 24 字）', 'f.session': '場次', 'f.seat': '座位區域', 'f.pick': '請選擇', 'f.platform': '購票平台', 'plat.zaiko': 'ZAIKO', 'plat.lawson': 'Lawson', 'plat.any': '不限',
      'f.qty': '張數', 'f.contact': '聯絡方式（僅登入者看得到）', 'f.note': '備註（最多 300 字）',
      'lg.have.exchange': '我有的票', 'lg.have.give': '我要讓出的票', 'lg.want.exchange': '我想換的票', 'lg.want.want': '我想徵的票',
      zone: z => z === 'any' ? '不限' : `${z} 區`,
      'zone.any': '不限',
      'f.contact.ph': '例：X @xxxx／LINE ID／Discord',
      'kind.exchange': '換票', 'kind.give': '讓票', 'kind.want': '徵票',
      'btn.post': '送出投稿', 'btn.save': '儲存修改', 'btn.cancelEdit': '取消', 'btn.open': '＋ 我要投稿',
      'list.title': '投稿列表', 'chip.all': '全部', 'chip.mine': '我的投稿',
      count: n => `（${n} 篇）`,
      loading: '讀取中…', failed: '讀取失敗，請稍後再試。', retry: '重新讀取', empty: '目前還沒有投稿。',
      'card.have': '我有的票', 'card.wantEx': '想換的票', 'card.give': '讓出的票', 'card.wantOnly': '徵求的票', 'card.qty': '張數',
      'card.qtyv': n => `${n} 張`,
      'card.contact': '聯絡方式', 'card.contactLogin': '登入後可查看聯絡方式',
      'f.status': '狀態', 'chip.hidedone': '只顯示未完成（隱藏已完成）', 'card.done': '已完成', 'card.markDone': '標記為已完成', 'card.reopen': '重新開放',
      'card.edit': '修改', 'card.delete': '刪除', 'card.mine': '我的',
      'card.report': '檢舉', 'card.reported': '已檢舉', 'card.hidden': '因檢舉暫時隱藏中，只有你看得到。如有疑問請聯絡站長。',
      'form.rule': '本區一律依「座位原價」交易，禁止加價轉售。違規者會被檢舉並隱藏。',
      'rp.title': '檢舉這篇投稿', 'rp.desc': '檢舉內容只有站長看得到。同一篇累積 3 位使用者檢舉會先自動隱藏，等待站長確認。',
      'rp.reason': '原因', 'rp.scam': '疑似詐騙', 'rp.overprice': '不是原價（加價轉售）', 'rp.spam': '洗版／廣告', 'rp.inappropriate': '不當內容', 'rp.other': '其他',
      'rp.detail': '補充說明（選填，最多 200 字）', 'rp.send': '送出檢舉', 'rp.cancel': '取消',
      'rp.done': '已收到你的檢舉，謝謝。', 'rp.failed': '檢舉失敗，請稍後再試。', 'rp.dup': '你已經檢舉過這篇了。',
      'del.confirm': '確定要刪除這篇投稿嗎？', 'del.failed': '刪除失敗，請稍後再試。',
      saving: '送出中…', saved: '已儲存。', posted: '投稿成功！', 'save.failed': '送出失敗，請稍後再試。',
      'limit.reached': '每個帳號最多同時 10 篇投稿，請先刪除舊的。',
      'theme.toLight': '切換為淺色模式', 'theme.toDark': '切換為深色模式',
      footer1: '本站為ミオファ自製的非官方粉絲網站，與 COVER 株式会社無關。',
      'footer.tk': '票務交流為使用者自行聯繫，本站不經手交易，不保證票券真偽，也不協助處理任何交易糾紛，請自行解決。請小心詐騙，建議面交或使用官方轉讓管道。',
    },
    ja: {
      'doc.title': 'チケット交流所｜ミオファ的高麗菜園',
      'doc.desc': '百花繚乱あやふぶみ ライブ、台湾ミオファのチケット交流所。非公式ファンサイトです。',
      brand: 'ミオファ的高麗菜園', 'nav.ledger': '納税記録簿', 'nav.tickets': 'チケット交流所',
      title: 'チケット交流所',
      lead: '百花繚乱あやふぶみ ライブで、台湾のミオファがチケットの交換・譲渡・募集をする場所です。取引はすべて座席の定価で行ってください。相手の確認とチケットの真偽はご自身でお願いします。本サイトは取引に関与せず、取引上のトラブルへの対応も行いません。当事者同士で解決してください。',
      'form.title': '投稿する', 'form.edit': '投稿を修正する',
      'form.needLogin': '投稿するには Google でログインしてください。', 'form.loginHint': '右上の「Google でログイン」を押してください。',
      'form.warn': '身分証、チケット番号の全文、QR コードなどの個人情報・チケットの機微情報は書き込まないでください。連絡先はログインした人にだけ表示されます。',
      'f.kind': '種類', 'f.nick': 'ニックネーム（24文字まで）', 'f.session': '公演日', 'f.seat': '座席エリア', 'f.pick': '選択してください', 'f.platform': '購入プラットフォーム', 'plat.zaiko': 'ZAIKO', 'plat.lawson': 'ローソンチケット', 'plat.any': 'どちらでも',
      'f.qty': '枚数', 'f.contact': '連絡先（ログインした人にだけ表示）', 'f.note': '備考（300文字まで）',
      'lg.have.exchange': '持っているチケット', 'lg.have.give': '譲るチケット', 'lg.want.exchange': '交換したいチケット', 'lg.want.want': '探しているチケット',
      zone: z => z === 'any' ? 'エリア問わず' : `${z}席`,
      'zone.any': 'エリア問わず',
      'f.contact.ph': '例：X @xxxx／LINE ID／Discord',
      'kind.exchange': '交換', 'kind.give': '譲渡', 'kind.want': '募集',
      'btn.post': '投稿する', 'btn.save': '修正を保存', 'btn.cancelEdit': 'キャンセル', 'btn.open': '＋ 投稿する',
      'list.title': '投稿一覧', 'chip.all': 'すべて', 'chip.mine': '自分の投稿',
      count: n => `（${n} 件）`,
      loading: '読み込み中…', failed: '読み込みに失敗しました。しばらくしてからお試しください。', retry: '再読み込み', empty: 'まだ投稿がありません。',
      'card.have': '持っているチケット', 'card.wantEx': '交換希望', 'card.give': '譲るチケット', 'card.wantOnly': '探しているチケット', 'card.qty': '枚数',
      'card.qtyv': n => `${n} 枚`,
      'card.contact': '連絡先', 'card.contactLogin': 'ログインすると連絡先が表示されます',
      'f.status': '状態', 'chip.hidedone': '未完了のみ表示（完了を隠す）', 'card.done': '完了', 'card.markDone': '完了にする', 'card.reopen': '再び募集する',
      'card.edit': '修正', 'card.delete': '削除', 'card.mine': '自分',
      'card.report': '通報', 'card.reported': '通報済み', 'card.hidden': '通報により一時的に非表示です（あなたにだけ見えています）。ご不明な点は管理者までご連絡ください。',
      'form.rule': 'このコーナーの取引はすべて「座席の定価」で行います。転売・高額販売は禁止です。違反した投稿は通報され非表示になります。',
      'rp.title': 'この投稿を通報', 'rp.desc': '通報内容は管理者だけが見られます。同じ投稿に3人のユーザーから通報があると、確認が済むまで自動で非表示になります。',
      'rp.reason': '理由', 'rp.scam': '詐欺の疑い', 'rp.overprice': '定価ではない（高額転売）', 'rp.spam': '連投・宣伝', 'rp.inappropriate': '不適切な内容', 'rp.other': 'その他',
      'rp.detail': '補足（任意・200文字まで）', 'rp.send': '通報する', 'rp.cancel': 'キャンセル',
      'rp.done': '通報を受け付けました。ありがとうございます。', 'rp.failed': '通報に失敗しました。しばらくしてからお試しください。', 'rp.dup': 'この投稿はすでに通報済みです。',
      'del.confirm': 'この投稿を削除しますか？', 'del.failed': '削除に失敗しました。しばらくしてからお試しください。',
      saving: '送信中…', saved: '保存しました。', posted: '投稿しました！', 'save.failed': '送信に失敗しました。しばらくしてからお試しください。',
      'limit.reached': '1アカウントにつき同時に10件までです。古い投稿を削除してください。',
      'theme.toLight': 'ライトモードに切り替え', 'theme.toDark': 'ダークモードに切り替え',
      footer1: '本サイトはミオファによる非公式のファンサイトで、カバー株式会社とは一切関係ありません。',
      'footer.tk': 'チケットのやり取りは利用者同士で行ってください。本サイトは取引に関与せず、チケットの真偽も保証せず、取引上のトラブルへの対応も行いません（当事者同士で解決してください）。詐欺にご注意ください。',
    },
  };

  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function detectLang() {
    try { const v = localStorage.getItem(LANG_KEY); if (I18N[v]) return v; } catch (e) { /* ignore */ }
    return /^ja/i.test(navigator.language || '') ? 'ja' : 'zh-Hant';
  }
  let lang = detectLang();
  const t = (k, ...a) => { const v = I18N[lang][k]; return typeof v === 'function' ? v(...a) : (v == null ? k : v); };

  const state = { posts: [], reported: new Set(), reporting: null, user: null, filter: 'all', day: 'all', hideDone: localStorage.getItem('mio-ticket-hidedone') === '1', editing: null, loaded: false, failed: false };
  let client = null;

  /* ---------------- 資料 ---------------- */
  async function load() {
    if (!client) { state.failed = true; render(); return; }
    const { data, error } = await client.from('ticket_posts')
      .select(state.user ? '*' : COLS_PUBLIC).order('created_at', { ascending: false }).limit(500);
    if (error) { console.warn('[tickets] load failed', error); state.failed = true; }
    else { state.failed = false; state.posts = data || []; }
    state.loaded = true;
    state.reported = new Set();
    if (state.user) {
      const r = await client.from('ticket_reports').select('post_id');
      if (!r.error) state.reported = new Set((r.data || []).map(x => x.post_id));
    }
    render();
  }

  /* ---------------- 畫面 ---------------- */
  const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? '' : `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`; };

  function cardHtml(p) {
    const mine = state.user && p.user_id === state.user.id;
    const tk = (s, z, pl) => `${esc(s)}<span class="zone">${esc(t('zone', z))}</span>`
      + (WANT_PLATFORMS.includes(pl) ? `<span class="zone plat">${esc(t('plat.' + pl))}</span>` : '');
    const rows = [
      p.kind === 'exchange' ? ['card.have', tk(p.session, p.seat, p.platform)] : null,
      p.kind === 'exchange' ? ['card.wantEx', tk(p.want_session, p.want_seat, p.want_platform)] : null,
      p.kind === 'give' ? ['card.give', tk(p.session, p.seat, p.platform)] : null,
      p.kind === 'want' ? ['card.wantOnly', tk(p.want_session, p.want_seat, p.want_platform)] : null,
      ['card.qty', esc(t('card.qtyv', p.qty))],
    ].filter(Boolean).map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>`).join('');
    const contact = state.user
      ? `<p class="tk-contact"><b>${esc(t('card.contact'))}</b>${esc(p.contact || '')}</p>`
      : `<p class="tk-contact muted">🔒 ${esc(t('card.contactLogin'))}</p>`;
    const reportBtn = (state.user && !mine) ? (state.reported.has(p.id)
      ? `<span class="tk-reported">${esc(t('card.reported'))}</span>`
      : `<button type="button" class="rk-report" data-act="report">⚑ ${esc(t('card.report'))}</button>`) : '';
    const tools = mine ? `<div class="tk-tools">
        <button type="button" class="btn ghost small" data-act="done">${esc(p.status === 'done' ? t('card.reopen') : t('card.markDone'))}</button>
        <button type="button" class="btn ghost small" data-act="edit">${esc(t('card.edit'))}</button>
        <button type="button" class="btn small btn-danger" data-act="del">${esc(t('card.delete'))}</button>
      </div>` : '';
    return `<article class="tk-card ${esc(p.kind)}${p.status === 'done' ? ' done' : ''}${mine ? ' mine' : ''}" data-id="${esc(p.id)}">
      <header class="tk-head">
        <span class="tag tk-kind ${esc(p.kind)}">${esc(t('kind.' + p.kind))}</span>
        ${p.status === 'done' ? `<span class="tag">${esc(t('card.done'))}</span>` : ''}
        ${mine ? `<span class="tag tk-mine">${esc(t('card.mine'))}</span>` : ''}
        <time class="tk-date" datetime="${esc(p.created_at)}">${esc(fmtDate(p.created_at))}</time>
      </header>
      <p class="tk-nick">${esc(p.nickname)}</p>
      <dl class="tk-info">${rows}</dl>
      ${p.note ? `<p class="tk-note">${esc(p.note)}</p>` : ''}
      ${contact}
      ${p.hidden && mine ? `<p class="set-warn">${esc(t('card.hidden'))}</p>` : ''}
      ${tools}
      ${reportBtn ? `<div class="tk-report-row">${reportBtn}</div>` : ''}
    </article>`;
  }

  function render() {
    const box = $('#tk-list');
    if (!state.loaded && !state.failed) { box.innerHTML = `<p class="state">${esc(t('loading'))}</p>`; return; }
    if (state.failed) {
      box.innerHTML = `<div class="state"><p>${esc(t('failed'))}</p><button type="button" class="btn" id="tk-retry">${esc(t('retry'))}</button></div>`;
      $('#tk-retry').addEventListener('click', () => { state.failed = false; state.loaded = false; render(); load(); });
      $('#tk-count').textContent = '';
      return;
    }
    const f = state.filter;
    const d = state.day;     // 場次篩選：我有的票或想要的票任一邊符合就列出
    const list = state.posts.filter(p =>
      (f === 'all' ? true : f === 'mine' ? (state.user && p.user_id === state.user.id) : p.kind === f)
      && !(state.hideDone && p.status === 'done')
      && (d === 'all' || p.session === d || p.want_session === d));
    $('#tk-count').textContent = t('count', list.length);
    box.innerHTML = list.length ? list.map(cardHtml).join('') : `<p class="state">${esc(t('empty'))}</p>`;
  }

  function syncAuthUI() {
    const loggedIn = !!state.user;
    $('#tk-login').hidden = loggedIn;
    $('#tk-form').hidden = !loggedIn;
    const mineBtn = document.querySelector('#tk-filter [data-v="mine"]');
    mineBtn.hidden = !loggedIn;
    if (!loggedIn && state.filter === 'mine') setFilter('all');
    if (!loggedIn) resetForm();
  }

  /* ---------------- 表單 ---------------- */
  function msg(text, bad) {
    const m = $('#tk-msg');
    m.hidden = !text; m.textContent = text || ''; m.style.color = bad ? '#d33' : '';
  }
  // 依類型顯示「我有的票」「我想要的票」，隱藏的欄位停用（不參與必填檢查）
  function syncKind() {
    const k = $('#f-kind').value;
    const hasHave = k === 'exchange' || k === 'give', hasWant = k === 'exchange' || k === 'want';
    $('#grp-have').hidden = !hasHave;
    $('#grp-want').hidden = !hasWant;
    ['#f-session', '#f-seat', '#f-plat'].forEach(s => { $(s).disabled = !hasHave; });
    ['#f-wsession', '#f-wseat', '#f-wplat'].forEach(s => { $(s).disabled = !hasWant; });
    $('#f-wseat-any').hidden = $('#f-wseat-any').disabled = k !== 'want';
    if (k !== 'want' && $('#f-wseat').value === 'any') $('#f-wseat').value = '';
    $('#f-wplat-any').hidden = $('#f-wplat-any').disabled = k !== 'want';
    if (k !== 'want' && $('#f-wplat').value === 'any') $('#f-wplat').value = '';
    if (hasHave) $('#lg-have').textContent = t('lg.have.' + k);
    if (hasWant) $('#lg-want').textContent = t('lg.want.' + k);
  }
  function resetForm() {
    state.editing = null;
    $('#tk-form').reset();
    $('#f-qty').value = '1';
    syncKind();
    $('#f-nick').value = lastNick;      // 暱稱記起來，下次投稿不用重打
    $('#tk-form-title').textContent = t('form.title');
    $('#tk-submit').textContent = t('btn.post');
    msg('');
  }
  let lastNick = '';
  const dlg = () => $('#post-dlg');
  function toast(text) {
    const el = $('#tk-toast');
    el.textContent = text; el.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { el.hidden = true; }, 4000);
  }
  function openPost() {
    resetForm();
    dlg().showModal();
  }
  function startEdit(id) {
    const p = state.posts.find(x => x.id === id);
    if (!p) return;
    state.editing = id;
    $('#f-kind').value = p.kind; $('#f-nick').value = p.nickname;
    syncKind();
    $('#f-session').value = p.session || ''; $('#f-seat').value = p.seat || '';
    $('#f-plat').value = p.platform || '';
    $('#f-wsession').value = p.want_session || ''; $('#f-wseat').value = p.want_seat || ''; $('#f-wplat').value = p.want_platform || '';
    $('#f-qty').value = String(p.qty);
    $('#f-contact').value = p.contact || ''; $('#f-note').value = p.note || '';
    $('#tk-form-title').textContent = t('form.edit');
    $('#tk-submit').textContent = t('btn.save');
    msg('');
    if (!dlg().open) dlg().showModal();
  }

  async function submit(e) {
    e.preventDefault();
    if (!client || !state.user) return;
    const kind = $('#f-kind').value;
    const hasHave = kind === 'exchange' || kind === 'give', hasWant = kind === 'exchange' || kind === 'want';
    const row = {
      kind,
      nickname: $('#f-nick').value.trim(),
      session: hasHave ? $('#f-session').value : '',
      seat: hasHave ? $('#f-seat').value : '',
      platform: hasHave ? $('#f-plat').value : '',
      want_session: hasWant ? $('#f-wsession').value : '',
      want_seat: hasWant ? $('#f-wseat').value : '',
      want_platform: hasWant ? $('#f-wplat').value : '',
      qty: Number($('#f-qty').value) || 1,
      contact: $('#f-contact').value.trim(),
      note: $('#f-note').value.trim(),
    };
    if (!KINDS.includes(kind) || !row.nickname || !row.contact) return;
    if (hasHave && (!SESSIONS.includes(row.session) || !ZONES.includes(row.seat) || !PLATFORMS.includes(row.platform))) return;
    if (hasWant && (!SESSIONS.includes(row.want_session) || !WANT_ZONES.includes(row.want_seat) || !WANT_PLATFORMS.includes(row.want_platform))) return;
    const btn = $('#tk-submit');
    btn.disabled = true; msg(t('saving'));
    const editing = state.editing;
    const q = editing
      ? client.from('ticket_posts').update(row).eq('id', editing)
      : client.from('ticket_posts').insert(row);
    const { error } = await q;
    btn.disabled = false;
    if (error) {
      console.warn('[tickets] save failed', error);
      msg(/limit reached/i.test(error.message || '') ? t('limit.reached') : t('save.failed'), true);
      return;
    }
    lastNick = row.nickname;
    dlg().close();                      // close 事件會清空表單
    toast(editing ? t('saved') : t('posted'));
    await load();
  }

  async function onListClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b || !client) return;
    const card = b.closest('.tk-card');
    const id = card && card.dataset.id;
    const p = state.posts.find(x => x.id === id);
    if (!p || !state.user) return;
    if (b.dataset.act === 'report') { openReport(id); return; }
    if (p.user_id !== state.user.id) return;
    if (b.dataset.act === 'edit') { startEdit(id); return; }
    if (b.dataset.act === 'del') {
      if (!window.confirm(t('del.confirm'))) return;
      const { error } = await client.from('ticket_posts').delete().eq('id', id);
      if (error) { console.warn('[tickets] delete failed', error); window.alert(t('del.failed')); return; }
      if (state.editing === id) resetForm();
      await load();
    } else if (b.dataset.act === 'done') {
      const { error } = await client.from('ticket_posts').update({ status: p.status === 'done' ? 'open' : 'done' }).eq('id', id);
      if (error) { console.warn('[tickets] status failed', error); window.alert(t('save.failed')); return; }
      await load();
    }
  }

  /* ---------------- 檢舉 ---------------- */
  function rpMsg(text, bad) {
    const m = $('#rp-msg');
    m.hidden = !text; m.textContent = text || ''; m.style.color = bad ? '#d33' : '';
  }
  function openReport(id) {
    state.reporting = id;
    $('#rp-reason').value = 'scam';
    $('#rp-detail').value = '';
    $('#rp-send').disabled = false;
    rpMsg('');
    $('#report-dlg').showModal();
  }
  async function sendReport() {
    if (!client || !state.user || !state.reporting) return;
    const id = state.reporting;
    const btn = $('#rp-send');
    btn.disabled = true;
    const { error } = await client.from('ticket_reports').insert({
      post_id: id, reason: $('#rp-reason').value, detail: $('#rp-detail').value.trim(),
    });
    if (error && error.code !== '23505') {          // 23505 = 已檢舉過（唯一鍵衝突）
      console.warn('[tickets] report failed', error);
      rpMsg(t('rp.failed'), true); btn.disabled = false; return;
    }
    state.reported.add(id);
    rpMsg(error ? t('rp.dup') : t('rp.done'));
    render();
    setTimeout(() => { const d = $('#report-dlg'); if (d.open) d.close(); }, 900);
  }

  function setFilter(v) {
    state.filter = v;
    document.querySelectorAll('#tk-filter button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    render();
  }

  /* ---------------- 語言與主題 ---------------- */
  function applyI18n() {
    document.documentElement.lang = lang;
    document.title = t('doc.title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('doc.desc'));
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll('.lang-switch button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('#tk-form-title').textContent = state.editing ? t('form.edit') : t('form.title');
    $('#tk-submit').textContent = state.editing ? t('btn.save') : t('btn.post');
    const qty = $('#f-qty'), cur = qty.value || '1';
    qty.innerHTML = Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${esc(t('card.qtyv', i + 1))}</option>`).join('');
    qty.value = cur;
    syncKind();
    updateThemeButton();
  }
  function setLang(next) {
    if (!I18N[next] || next === lang) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    applyI18n(); render();
    if (window.MioCloud) window.MioCloud.refreshLang();
  }
  function isDark() {
    const a = document.documentElement.getAttribute('data-theme');
    if (a) return a === 'dark';
    return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function updateThemeButton() {
    const b = $('#btn-theme'), dark = isDark();
    b.textContent = dark ? '☀️' : '🌙';
    b.setAttribute('aria-label', dark ? t('theme.toLight') : t('theme.toDark'));
    b.title = b.getAttribute('aria-label');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0b0b0c' : '#ffffff');
  }
  function toggleTheme() {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
    updateThemeButton();
  }

  /* ---------------- init ---------------- */
  applyI18n();
  document.querySelectorAll('.lang-switch button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btn-theme').addEventListener('click', toggleTheme);
  $('#tk-form').addEventListener('submit', submit);
  $('#f-kind').addEventListener('change', syncKind);
  $('#tk-cancel').addEventListener('click', () => dlg().close());
  $('#tk-open').addEventListener('click', openPost);
  dlg().addEventListener('close', resetForm);
  $('#tk-list').addEventListener('click', onListClick);
  $('#rp-send').addEventListener('click', sendReport);
  $('#rp-cancel').addEventListener('click', () => $('#report-dlg').close());
  $('#tk-day').addEventListener('click', e => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    state.day = b.dataset.v;
    document.querySelectorAll('#tk-day button').forEach(x => x.classList.toggle('on', x.dataset.v === state.day));
    render();
  });
  const hdBtn = $('#tk-hidedone');
  function syncHd() { hdBtn.classList.toggle('on', state.hideDone); hdBtn.setAttribute('aria-pressed', state.hideDone); }
  syncHd();
  hdBtn.addEventListener('click', () => {
    state.hideDone = !state.hideDone;
    try { localStorage.setItem('mio-ticket-hidedone', state.hideDone ? '1' : '0'); } catch (e) { /* ignore */ }
    syncHd();
    render();
  });
  $('#tk-filter').addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) setFilter(b.dataset.v); });

  if (window.MioCloud) {
    window.MioCloud.init({ books: {} });
    client = window.MioCloud.client();
    state.user = window.MioCloud.currentUser();
    syncAuthUI();
    window.MioCloud.onUser(u => {
      const changed = (u && u.id) !== (state.user && state.user.id);
      state.user = u;
      syncAuthUI();
      if (changed || !state.loaded) load(); else render();
    });
    // 初次載入（onUser 在 INITIAL_SESSION 時也會觸發，這裡確保 client 不可用時也有畫面）
    if (client) load(); else { state.failed = true; render(); }
  } else {
    state.failed = true; syncAuthUI(); render();
  }
})();
