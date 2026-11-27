-- =====================================================================
-- ミオファ的高麗菜園（twmiofa）002：票務交流區 ticket_posts ＋ 檢舉 ticket_reports
--
-- 規則：
--   * 任何人（含未登入）都能看到貼文，但「聯絡方式 contact」欄位只有已登入者讀得到
--   * 只有已登入者能投稿；每個人只能修改、刪除自己的貼文
--   * 每個帳號最多同時有 10 篇貼文（防洗版）
--   * 一律原價交易，所以沒有價格欄位
--   * 已登入者可檢舉別人的貼文（每人每篇一次）；累積 3 個不同人檢舉就自動隱藏，
--     隱藏後只有投稿者自己看得到（會看到「因檢舉暫時隱藏」）。管理員用 SQL 處理（見檔案最後）。
-- 執行前提：twkaitakusha/supabase/001 已執行過（沿用 touch_updated_at 函式）。
-- 使用方式：Supabase 後台 → SQL Editor → New query → 整段貼上 → Run（可重複執行，也可接在舊版之後執行）
-- =====================================================================

create table if not exists public.ticket_posts (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text        not null check (kind in ('exchange', 'give', 'want')),   -- 換票 / 讓票 / 徵票
  nickname   text        not null check (char_length(nickname) between 1 and 24),
  session    text        not null default '',   -- 我有的票：場次 Day1 / Day2（換票、讓票用）
  seat       text        not null default '',   -- 我有的票：區域 SS / S / A / B
  platform   text        not null default '',   -- 我有的票：購票平台 zaiko / lawson
  want_session text      not null default '',   -- 我想要的票：場次（換票、徵票用）
  want_seat  text        not null default '',   -- 我想要的票：區域
  want_platform text     not null default '',   -- 我想要的票：購票平台
  qty       smallint    not null default 1 check (qty between 1 and 10),
  note       text        not null default '' check (char_length(note) <= 300),
  contact    text        not null check (char_length(contact) between 1 and 100), -- 聯絡方式（僅登入者可見）
  status     text        not null default 'open' check (status in ('open', 'done')),
  hidden     boolean     not null default false,                                  -- 被檢舉達標自動隱藏
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- 舊版（已執行過第一版 SQL 的人）升級：移除價格、加入 hidden
alter table public.ticket_posts drop column if exists price;
alter table public.ticket_posts add column if not exists hidden boolean not null default false;
-- 舊版（場次、座位為自由輸入）升級：加入想要的票欄位，並改成固定選項
alter table public.ticket_posts add column if not exists want_session text not null default '';
alter table public.ticket_posts add column if not exists want_seat text not null default '';
alter table public.ticket_posts add column if not exists platform text not null default '';
alter table public.ticket_posts add column if not exists want_platform text not null default '';

-- 固定選項與各類型必填欄位。用 not valid：只檢查新資料，不會因為舊的自由輸入資料而失敗。
alter table public.ticket_posts drop constraint if exists ticket_posts_session_check;
alter table public.ticket_posts drop constraint if exists ticket_posts_seat_check;
alter table public.ticket_posts drop constraint if exists ticket_posts_tickets_check;
alter table public.ticket_posts add constraint ticket_posts_tickets_check check (
  session in ('', 'Day1', 'Day2') and want_session in ('', 'Day1', 'Day2')
  and seat in ('', 'SS', 'S', 'A', 'B') and want_seat in ('', 'SS', 'S', 'A', 'B')
  and platform in ('', 'zaiko', 'lawson') and want_platform in ('', 'zaiko', 'lawson')
  -- 換票、讓票：要有「我有的票」；換票、徵票：要有「我想要的票」
  and (kind = 'want' or (session <> '' and seat <> '' and platform <> ''))
  and (kind = 'give' or (want_session <> '' and want_seat <> '' and want_platform <> ''))
) not valid;

create index if not exists ticket_posts_created_idx on public.ticket_posts (created_at desc);
create index if not exists ticket_posts_user_idx on public.ticket_posts (user_id);

drop trigger if exists ticket_posts_touch on public.ticket_posts;
create trigger ticket_posts_touch before insert or update on public.ticket_posts
  for each row execute function public.touch_updated_at();

-- 每帳號最多 10 篇
create or replace function public.ticket_posts_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.ticket_posts where user_id = new.user_id) >= 10 then
    raise exception 'ticket post limit reached (10)';
  end if;
  return new;
end $$;
drop trigger if exists ticket_posts_limit_trg on public.ticket_posts;
create trigger ticket_posts_limit_trg before insert on public.ticket_posts
  for each row execute function public.ticket_posts_limit();

alter table public.ticket_posts enable row level security;

-- 權限：未登入只能讀「不含 contact」的欄位；登入者可讀全部、寫自己的（hidden 不能自己改）
revoke all on public.ticket_posts from anon, authenticated;
grant select (id, user_id, kind, nickname, session, seat, platform, want_session, want_seat, want_platform, qty, note, status, hidden, created_at, updated_at)
  on public.ticket_posts to anon;
grant select on public.ticket_posts to authenticated;
grant insert (kind, nickname, session, seat, platform, want_session, want_seat, want_platform, qty, note, contact, status) on public.ticket_posts to authenticated;
grant update (kind, nickname, session, seat, platform, want_session, want_seat, want_platform, qty, note, contact, status) on public.ticket_posts to authenticated;
grant delete on public.ticket_posts to authenticated;

drop policy if exists ticket_posts_select_all on public.ticket_posts;
drop policy if exists ticket_posts_insert_own on public.ticket_posts;
drop policy if exists ticket_posts_update_own on public.ticket_posts;
drop policy if exists ticket_posts_delete_own on public.ticket_posts;
-- 隱藏的貼文只有本人看得到
create policy ticket_posts_select_all on public.ticket_posts for select to anon, authenticated
  using (not hidden or user_id = (select auth.uid()));
create policy ticket_posts_insert_own on public.ticket_posts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy ticket_posts_update_own on public.ticket_posts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy ticket_posts_delete_own on public.ticket_posts for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------- 檢舉 ----------
create table if not exists public.ticket_reports (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.ticket_posts (id) on delete cascade,
  reporter_id uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  reason      text        not null check (reason in ('scam', 'overprice', 'spam', 'inappropriate', 'other')),
  detail      text        not null default '' check (char_length(detail) <= 200),
  created_at  timestamptz not null default now(),
  unique (post_id, reporter_id)
);
create index if not exists ticket_reports_post_idx on public.ticket_reports (post_id);

alter table public.ticket_reports enable row level security;
revoke all on public.ticket_reports from anon, authenticated;
grant select on public.ticket_reports to authenticated;          -- 只讀得到自己送出的（見 policy）
grant insert (post_id, reason, detail) on public.ticket_reports to authenticated;

drop policy if exists ticket_reports_select_own on public.ticket_reports;
drop policy if exists ticket_reports_insert on public.ticket_reports;
create policy ticket_reports_select_own on public.ticket_reports for select to authenticated
  using ((select auth.uid()) = reporter_id);
-- 只能以自己的身分檢舉，且不能檢舉自己的貼文
create policy ticket_reports_insert on public.ticket_reports for insert to authenticated
  with check (
    (select auth.uid()) = reporter_id
    and not exists (select 1 from public.ticket_posts p where p.id = post_id and p.user_id = (select auth.uid()))
  );

-- 累積 3 個不同人檢舉 → 自動隱藏貼文
create or replace function public.ticket_reports_autohide() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.ticket_reports where post_id = new.post_id) >= 3 then
    update public.ticket_posts set hidden = true where id = new.post_id;
  end if;
  return new;
end $$;
drop trigger if exists ticket_reports_autohide_trg on public.ticket_reports;
create trigger ticket_reports_autohide_trg after insert on public.ticket_reports
  for each row execute function public.ticket_reports_autohide();

-- 刪除帳號時，貼文與檢舉都會因 on delete cascade 一起刪除。

-- ---------- 管理員用（需要時在 SQL Editor 手動執行，不會自動跑） ----------
-- 看有被檢舉的貼文：
--   select p.id, p.nickname, p.session, p.hidden, count(r.id) as reports,
--          string_agg(r.reason || coalesce(' ' || nullif(r.detail, ''), ''), ' | ') as reasons
--   from ticket_posts p join ticket_reports r on r.post_id = p.id group by p.id order by reports desc;
-- 檢舉不成立、恢復顯示（同時清掉檢舉，避免再被自動隱藏）：
--   delete from ticket_reports where post_id = '<貼文 id>'; update ticket_posts set hidden = false where id = '<貼文 id>';
-- 確認違規、直接刪除貼文：
--   delete from ticket_posts where id = '<貼文 id>';
