/* 首頁：列出目前開放的票務交流活動。語言與主題沿用票務頁的設定。 */
(function () {
  'use strict';
  const LANG_KEY = 'mio-ledger-lang';
  const THEME_KEY = 'mio-ledger-theme';
  const I18N = {
    'zh-Hant': {
      'doc.title': 'ミオファ的高麗菜園｜票務交流區',
      'doc.desc': '台灣Holo粉絲的票務交流區，列出目前開放的活動。非官方粉絲製作。',
      brand: 'ミオファ的高麗菜園',
      'nav.ayafu': '百花繚乱 演唱會', 'nav.expo': 'EXPO/FES 2027',
      'home.title': '票務交流區',
      'home.lead': '台灣Holo粉絲交流換票、讓票、徵票的地方。請從下方選擇活動，進入該活動的交流區。',
      'home.list': '目前的票務交流活動', 'home.open': '開放中', 'home.go': '前往票務交流區 →',
      'ev.ayafu.name': '百花繚乱あやふぶみ 演唱會', 'ev.ayafu.desc': '換票、讓票、徵票，依場次與座位區域交流。',
      'ev.expo.name': 'Hololive EXPO/FES 2027', 'ev.expo.desc': '換票、讓票、徵票，場次可複選，不分座位區域。',
      'home.latest': '最新貼文', loading: '讀取中…', 'home.failed': '讀取失敗，請稍後再試。', 'home.empty': '目前還沒有貼文。',
      'kind.exchange': '換票', 'kind.give': '讓票', 'kind.want': '徵票',
      'card.have': '我有的票', 'card.wantEx': '想換的票', 'card.give': '讓出的票', 'card.wantOnly': '徵求的票',
      zone: z => z === 'any' ? '不限' : `${z} 區`, 'plat.zaiko': 'ZAIKO', 'plat.lawson': 'Lawson', 'plat.any': '不限', qtyv: n => `${n} 張`,
      'theme.toLight': '切換為淺色模式', 'theme.toDark': '切換為深色模式',
      footer1: '本站為Holo粉絲自製的非官方粉絲網站，與 COVER 株式会社無關。',
      'footer.tk': '票務交流為使用者自行聯繫，本站不經手交易，不保證票券真偽，也不協助處理任何交易糾紛，請自行解決。請小心詐騙，建議面交，或是交換其他聯絡方式，確保聯絡得到人。',
    },
    ja: {
      'doc.title': 'ミオファ的高麗菜園｜チケット交流所',
      'doc.desc': '台湾HoloFanのチケット交流所。開催中のイベント一覧です。非公式ファンサイトです。',
      brand: 'ミオファ的高麗菜園',
      'nav.ayafu': '百花繚乱 ライブ', 'nav.expo': 'EXPO/FES 2027',
      'home.title': 'チケット交流所',
      'home.lead': '台湾のHoloFanがチケットの交換・譲渡・募集をする場所です。下からイベントを選んで、そのイベントの交流所に入ってください。',
      'home.list': '開催中のチケット交流イベント', 'home.open': '受付中', 'home.go': 'チケット交流所へ →',
      'ev.ayafu.name': '百花繚乱あやふぶみ ライブ', 'ev.ayafu.desc': '交換・譲渡・募集。公演日と座席エリアで探せます。',
      'ev.expo.name': 'Hololive EXPO/FES 2027', 'ev.expo.desc': '交換・譲渡・募集。公演は複数選択可、座席エリアの区分はありません。',
      'home.latest': '最新の投稿', loading: '読み込み中…', 'home.failed': '読み込みに失敗しました。しばらくしてからお試しください。', 'home.empty': 'まだ投稿がありません。',
      'kind.exchange': '交換', 'kind.give': '譲渡', 'kind.want': '募集',
      'card.have': '持っているチケット', 'card.wantEx': '交換希望', 'card.give': '譲るチケット', 'card.wantOnly': '探しているチケット',
      zone: z => z === 'any' ? 'エリア問わず' : `${z}席`, 'plat.zaiko': 'ZAIKO', 'plat.lawson': 'ローソンチケット', 'plat.any': 'どちらでも', qtyv: n => `${n} 枚`,
      'theme.toLight': 'ライトモードに切り替え', 'theme.toDark': 'ダークモードに切り替え',
      footer1: '本サイトはHoloFanによる非公式のファンサイトで、カバー株式会社とは一切関係ありません。',
      'footer.tk': 'チケットのやり取りは利用者同士で行ってください。本サイトは取引に関与せず、チケットの真偽も保証せず、取引上のトラブルへの対応も行いません（当事者同士で解決してください）。詐欺にご注意ください。',
    },
  };
  const $ = s => document.querySelector(s);
  let lang = 'zh-Hant';
  try { const v = localStorage.getItem(LANG_KEY); lang = I18N[v] ? v : (/^ja/i.test(navigator.language || '') ? 'ja' : 'zh-Hant'); } catch (e) { /* ignore */ }
  const t = (k, ...a) => { const v = I18N[lang][k]; return typeof v === 'function' ? v(...a) : (v == null ? k : v); };

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
  }
  function apply () {
    document.documentElement.lang = lang;
    document.title = t('doc.title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('doc.desc'));
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('.lang-switch button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    updateThemeButton();
  }
  document.querySelectorAll('.lang-switch button').forEach(b => b.addEventListener('click', () => {
    if (!I18N[b.dataset.lang]) return;
    lang = b.dataset.lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    apply();
  }));
  $('#btn-theme').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
    updateThemeButton();
  });
  /* ---------- 最新貼文 ---------- */
  const COLS = 'id,event,kind,nickname,session,seat,platform,want_session,want_seat,want_platform,qty,status,hidden,created_at';
  const PAGE = { ayafubumi: 'ayafubumi1st.html', expo2027: 'expo2027.html' };
  const EVNAME = { ayafubumi: 'ev.ayafu.name', expo2027: 'ev.expo.name' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sessLabel = v => String(v || '').split(',').filter(Boolean).map(x => x.replace(/_/g, ' ')).join('／');
  const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? '' : `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`; };
  let posts = null, failed = false;

  function ticket(s, z, pl) {
    return esc(sessLabel(s))
      + (z ? `<span class="zone">${esc(t('zone', z))}</span>` : '')
      + (t('plat.' + pl) !== 'plat.' + pl ? `<span class="zone plat">${esc(t('plat.' + pl))}</span>` : '');
  }
  function postHtml(p) {
    const rows = [
      p.kind === 'exchange' ? ['card.have', ticket(p.session, p.seat, p.platform)] : null,
      p.kind === 'exchange' ? ['card.wantEx', ticket(p.want_session, p.want_seat, p.want_platform)] : null,
      p.kind === 'give' ? ['card.give', ticket(p.session, p.seat, p.platform)] : null,
      p.kind === 'want' ? ['card.wantOnly', ticket(p.want_session, p.want_seat, p.want_platform)] : null,
    ].filter(Boolean).map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>`).join('');
    return `<a class="tk-card ${esc(p.kind)} ev-post" href="${esc(PAGE[p.event] || './')}">
      <header class="tk-head">
        <span class="tag tk-kind ${esc(p.kind)}">${esc(t('kind.' + p.kind))}</span>
        <span class="tag">${esc(t(EVNAME[p.event] || ''))}</span>
        <time class="tk-date" datetime="${esc(p.created_at)}">${esc(fmtDate(p.created_at))}</time>
      </header>
      <p class="tk-nick">${esc(p.nickname)} <small class="muted">× ${esc(t('qtyv', p.qty))}</small></p>
      <dl class="tk-info">${rows}</dl>
    </a>`;
  }
  function renderLatest() {
    const box = $('#ev-latest');
    if (failed) { box.innerHTML = `<p class="state">${esc(t('home.failed'))}</p>`; return; }
    if (posts === null) { box.innerHTML = `<p class="state">${esc(t('loading'))}</p>`; return; }
    box.innerHTML = posts.length ? posts.map(postHtml).join('') : `<p class="state">${esc(t('home.empty'))}</p>`;
  }
  async function loadLatest() {
    const client = window.MioCloud ? window.MioCloud.client() : null;
    if (!client) { failed = true; renderLatest(); return; }
    // 只列出公開、未完成的貼文（不含聯絡方式）
    const { data, error } = await client.from('ticket_posts').select(COLS)
      .eq('hidden', false).eq('status', 'open').order('created_at', { ascending: false }).limit(6);
    if (error) { console.warn('[home] latest failed', error); failed = true; } else { posts = data || []; }
    renderLatest();
  }
  const baseApply = apply;
  apply = function () { baseApply(); renderLatest(); if (window.MioCloud) window.MioCloud.refreshLang(); };   // eslint-disable-line no-func-assign
  if (window.MioCloud) window.MioCloud.init({ books: {} });   // 啟用登入鈕與讀取資料用的連線
  apply();
  loadLatest();
})();
