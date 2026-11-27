/* 票務管理頁：列出被檢舉的投稿，管理員可恢復、隱藏、刪除。
 * 所有動作走 supabase/003_ticket_admin.sql 的函式，函式內會檢查管理員身分。
 */
(function () {
  'use strict';

  const REASON = { scam: '疑似詐騙', overprice: '不是原價（加價轉售）', spam: '洗版／廣告', inappropriate: '不當內容', other: '其他' };
  const KIND = { exchange: '換票', give: '讓票', want: '徵票' };
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = iso => { const d = new Date(iso); return isNaN(d) ? '' : `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

  let client = null, posts = [], busy = false;

  function setState(text) {
    $('#ad-state').hidden = !text;
    $('#ad-state').textContent = text || '';
    $('#ad-body').hidden = !!text;
  }

  function cardHtml(p) {
    const PLAT = { zaiko: 'ZAIKO', lawson: 'Lawson' };
    const tk = (s, z, pl) => `${String(s || '').split(',').map(v => v.replace(/_/g, ' ')).join('／')} ${z ? (z === 'any' ? '不限區' : z + ' 區') : ''} ${pl === 'any' ? '平台不限' : (PLAT[pl] || '')}`.replace(/ +/g, ' ').trim();
    const info = [
      p.kind === 'exchange' ? ['我有的票', tk(p.session, p.seat, p.platform)] : null,
      p.kind === 'exchange' ? ['想換的票', tk(p.want_session, p.want_seat, p.want_platform)] : null,
      p.kind === 'give' ? ['讓出的票', tk(p.session, p.seat, p.platform)] : null,
      p.kind === 'want' ? ['徵求的票', tk(p.want_session, p.want_seat, p.want_platform)] : null,
      ['張數', p.qty + ' 張'], ['聯絡方式', p.contact]]
      .filter(Boolean).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    const reports = (p.reports || []).map(r =>
      `<li><b>${esc(REASON[r.reason] || r.reason)}</b>${r.detail ? `：${esc(r.detail)}` : ''} <small class="muted">${esc(fmt(r.at))}</small></li>`).join('');
    return `<article class="tk-card ${esc(p.kind)}${p.hidden ? ' hidden-post' : ''}" data-id="${esc(p.id)}">
      <header class="tk-head">
        <span class="tag">${p.event === 'expo2027' ? 'EXPO/FES 2027' : '百花繚乱'}</span>
        <span class="tag tk-kind ${esc(p.kind)}">${esc(KIND[p.kind] || p.kind)}</span>
        <span class="tag ${p.hidden ? 'danger' : 'warn'}">${p.hidden ? '已隱藏' : '顯示中'}</span>
        <span class="tag danger">${p.report_count} 筆檢舉</span>
        <time class="tk-date">${esc(fmt(p.created_at))}</time>
      </header>
      <p class="tk-nick">${esc(p.nickname)}</p>
      <dl class="tk-info">${info}</dl>
      ${p.note ? `<p class="tk-note">${esc(p.note)}</p>` : ''}
      <ul class="ad-reports">${reports}</ul>
      <div class="tk-tools">
        <button type="button" class="btn ghost small" data-act="dismiss">檢舉不成立（恢復）</button>
        <button type="button" class="btn ghost small" data-act="hide">${p.hidden ? '取消隱藏' : '先隱藏'}</button>
        <button type="button" class="btn small btn-danger" data-act="delete">刪除貼文</button>
      </div>
    </article>`;
  }

  function render() {
    $('#ad-count').textContent = `${posts.length} 篇被檢舉的投稿`;
    $('#ad-list').innerHTML = posts.length ? posts.map(cardHtml).join('') : '<p class="state">目前沒有被檢舉的投稿 🎉</p>';
  }

  async function load() {
    setState('讀取中…');
    const user = window.MioCloud.currentUser();
    if (!user) { setState('請先用右上角的「Google 登入」登入管理員帳號。'); return; }
    const adm = await client.rpc('ticket_is_admin');
    if (adm.error) { console.warn('[admin]', adm.error); setState('讀取失敗，請確認已執行 supabase/003_ticket_admin.sql。'); return; }
    if (!adm.data) { setState('這個帳號不是管理員。'); return; }
    const { data, error } = await client.rpc('ticket_admin_reports');
    if (error) { console.warn('[admin]', error); setState('讀取失敗，請稍後再試。'); return; }
    posts = data || [];
    setState('');
    render();
  }

  async function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b || busy) return;
    const id = b.closest('.tk-card').dataset.id;
    const p = posts.find(x => x.id === id);
    if (!p) return;
    let call;
    if (b.dataset.act === 'dismiss') {
      if (!window.confirm('檢舉不成立？會清除這篇的所有檢舉並恢復顯示。')) return;
      call = client.rpc('ticket_admin_dismiss', { p_id: id });
    } else if (b.dataset.act === 'hide') {
      call = client.rpc('ticket_admin_set_hidden', { p_id: id, p_hidden: !p.hidden });
    } else if (b.dataset.act === 'delete') {
      if (!window.confirm(`確定要永久刪除「${p.nickname}」的這篇投稿嗎？`)) return;
      call = client.rpc('ticket_admin_delete', { p_id: id });
    } else return;
    busy = true;
    const { error } = await call;
    busy = false;
    if (error) { console.warn('[admin]', error); window.alert('操作失敗：' + (error.message || '')); return; }
    await load();
  }

  /* 主題 */
  function isDark() {
    const a = document.documentElement.getAttribute('data-theme');
    if (a) return a === 'dark';
    return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function updateTheme() {
    const b = $('#btn-theme'), dark = isDark();
    b.textContent = dark ? '☀️' : '🌙';
    b.setAttribute('aria-label', dark ? '切換為淺色模式' : '切換為深色模式');
  }
  $('#btn-theme').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('mio-ledger-theme', next); } catch (e) { /* ignore */ }
    updateTheme();
  });
  updateTheme();

  $('#ad-list').addEventListener('click', onClick);
  $('#ad-reload').addEventListener('click', load);

  if (window.MioCloud) {
    window.MioCloud.init({ books: {} });
    client = window.MioCloud.client();
    if (!client) { setState('雲端功能無法使用。'); return; }
    // 登入狀態確定後（含重新整理後還原登入）才載入
    window.MioCloud.onUser(() => load());
    setTimeout(() => { if (!$('#ad-state').hidden && $('#ad-state').textContent === '讀取中…') load(); }, 1500);
  } else {
    setState('雲端功能無法使用。');
  }
})();
