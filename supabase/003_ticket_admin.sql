-- =====================================================================
-- ミオファ的高麗菜園（twmiofa）003：票務交流區管理頁（admin.html）用的管理員與函式
--
-- 執行前提：已執行 002_ticket_posts.sql。可重複執行。
-- 管理員名單存在 ticket_admins；管理動作都用 security definer 函式，函式內會檢查呼叫者是不是管理員，
-- 所以即使有人知道 admin.html 的網址，也看不到檢舉內容、不能刪文。
--
-- 把自己設為管理員（執行一次；把 Email 換成你登入本站用的 Google 信箱）：
--   insert into public.ticket_admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;
-- =====================================================================

create table if not exists public.ticket_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.ticket_admins enable row level security;
revoke all on public.ticket_admins from anon, authenticated;   -- 完全不開放直接讀寫，只能靠下面的函式

create or replace function public.ticket_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ticket_admins where user_id = auth.uid());
$$;

-- 被檢舉的貼文（含聯絡方式、每筆檢舉的原因與說明），檢舉多的在前
create or replace function public.ticket_admin_reports() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.ticket_is_admin() then raise exception 'not admin'; end if;
  return coalesce((
    select jsonb_agg(x order by (x->>'report_count')::int desc, x->>'last_report' desc)
    from (
      select jsonb_build_object(
        'id', p.id, 'kind', p.kind, 'nickname', p.nickname, 'session', p.session, 'seat', p.seat,
        'platform', p.platform, 'want_session', p.want_session, 'want_seat', p.want_seat, 'want_platform', p.want_platform, 'qty', p.qty, 'note', p.note, 'contact', p.contact, 'status', p.status, 'hidden', p.hidden,
        'created_at', p.created_at, 'report_count', count(r.id), 'last_report', max(r.created_at),
        'reports', jsonb_agg(jsonb_build_object('reason', r.reason, 'detail', r.detail, 'at', r.created_at) order by r.created_at)
      ) as x
      from public.ticket_posts p join public.ticket_reports r on r.post_id = p.id
      group by p.id
    ) s
  ), '[]'::jsonb);
end $$;

-- 檢舉不成立：清掉檢舉並恢復顯示
create or replace function public.ticket_admin_dismiss(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ticket_is_admin() then raise exception 'not admin'; end if;
  delete from public.ticket_reports where post_id = p_id;
  update public.ticket_posts set hidden = false where id = p_id;
end $$;

-- 手動隱藏／取消隱藏（保留檢舉紀錄）
create or replace function public.ticket_admin_set_hidden(p_id uuid, p_hidden boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ticket_is_admin() then raise exception 'not admin'; end if;
  update public.ticket_posts set hidden = p_hidden where id = p_id;
end $$;

-- 確認違規：刪除貼文（檢舉紀錄會跟著刪除）
create or replace function public.ticket_admin_delete(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ticket_is_admin() then raise exception 'not admin'; end if;
  delete from public.ticket_posts where id = p_id;
end $$;

revoke all on function public.ticket_is_admin(), public.ticket_admin_reports(),
  public.ticket_admin_dismiss(uuid), public.ticket_admin_set_hidden(uuid, boolean), public.ticket_admin_delete(uuid)
  from public, anon;
grant execute on function public.ticket_is_admin(), public.ticket_admin_reports(),
  public.ticket_admin_dismiss(uuid), public.ticket_admin_set_hidden(uuid, boolean), public.ticket_admin_delete(uuid)
  to authenticated;
