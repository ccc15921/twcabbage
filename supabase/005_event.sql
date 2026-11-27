-- =====================================================================
-- 票務交流區加入「活動」欄位 event，讓同一張表放多個活動的貼文：
--   ayafubumi = 百花繚乱あやふぶみ 演唱會（既有貼文，預設值）
--   expo2027  = Hololive EXPO/FES 2027（場次：EXPO_Day1~3 / Stage_1~3 / Dreams_Stage，不分座位區域）
-- 在 Supabase SQL Editor 貼上執行（可重複執行）。需先執行過 002、003、004。
-- =====================================================================

alter table public.ticket_posts add column if not exists event text not null default 'ayafubumi';

-- 重建固定選項檢查（取代 004 的版本）。not valid：只檢查新資料。
alter table public.ticket_posts drop constraint if exists ticket_posts_tickets_check;
alter table public.ticket_posts add constraint ticket_posts_tickets_check check (
  event in ('ayafubumi', 'expo2027')
  and (event <> 'ayafubumi' or (
    session in ('', 'Day1', 'Day2') and want_session in ('', 'Day1', 'Day2')
    and seat in ('', 'SS', 'S', 'A', 'B') and want_seat in ('', 'SS', 'S', 'A', 'B', 'any')))
  and (event <> 'expo2027' or (
    session in ('', 'EXPO_Day1', 'EXPO_Day2', 'EXPO_Day3', 'Stage_1', 'Stage_2', 'Stage_3', 'Dreams_Stage')
    and want_session in ('', 'EXPO_Day1', 'EXPO_Day2', 'EXPO_Day3', 'Stage_1', 'Stage_2', 'Stage_3', 'Dreams_Stage')
    and seat = '' and want_seat = ''))
  and platform in ('', 'zaiko', 'lawson') and want_platform in ('', 'zaiko', 'lawson', 'any')
  -- 換票、讓票：要有「我有的票」；換票、徵票：要有「我想要的票」（座位區域只有演唱會要選）
  and (kind = 'want' or (session <> '' and (event <> 'ayafubumi' or seat <> '') and platform <> ''))
  and (kind = 'give' or (want_session <> '' and (event <> 'ayafubumi' or want_seat <> '') and want_platform <> ''))
) not valid;

create index if not exists ticket_posts_event_idx on public.ticket_posts (event, created_at desc);

-- 權限：讀、寫都加上 event 欄位
grant select (id, user_id, event, kind, nickname, session, seat, platform, want_session, want_seat, want_platform, qty, note, status, hidden, created_at, updated_at)
  on public.ticket_posts to anon;
grant insert (event, kind, nickname, session, seat, platform, want_session, want_seat, want_platform, qty, note, contact, status) on public.ticket_posts to authenticated;
grant update (event, kind, nickname, session, seat, platform, want_session, want_seat, want_platform, qty, note, contact, status) on public.ticket_posts to authenticated;

-- 管理頁：被檢舉的貼文多回傳 event
create or replace function public.ticket_admin_reports() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.ticket_is_admin() then raise exception 'not admin'; end if;
  return coalesce((
    select jsonb_agg(x order by (x->>'report_count')::int desc, x->>'last_report' desc)
    from (
      select jsonb_build_object(
        'id', p.id, 'event', p.event, 'kind', p.kind, 'nickname', p.nickname, 'session', p.session, 'seat', p.seat,
        'platform', p.platform, 'want_session', p.want_session, 'want_seat', p.want_seat, 'want_platform', p.want_platform, 'qty', p.qty, 'note', p.note, 'contact', p.contact, 'status', p.status, 'hidden', p.hidden,
        'created_at', p.created_at, 'report_count', count(r.id), 'last_report', max(r.created_at),
        'reports', jsonb_agg(jsonb_build_object('reason', r.reason, 'detail', r.detail, 'at', r.created_at) order by r.created_at)
      ) as x
      from public.ticket_posts p join public.ticket_reports r on r.post_id = p.id
      group by p.id
    ) s
  ), '[]'::jsonb);
end $$;
