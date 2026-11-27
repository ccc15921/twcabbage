-- 徵票的「想要的座位區域」與「購票平台」可選「不限」（any）。在 Supabase SQL Editor 執行一次。
alter table public.ticket_posts drop constraint if exists ticket_posts_tickets_check;
alter table public.ticket_posts add constraint ticket_posts_tickets_check check (
  session in ('', 'Day1', 'Day2') and want_session in ('', 'Day1', 'Day2')
  and seat in ('', 'SS', 'S', 'A', 'B') and want_seat in ('', 'SS', 'S', 'A', 'B', 'any')
  and platform in ('', 'zaiko', 'lawson') and want_platform in ('', 'zaiko', 'lawson', 'any')
  and (kind = 'want' or (session <> '' and seat <> '' and platform <> ''))
  and (kind = 'give' or (want_session <> '' and want_seat <> '' and want_platform <> ''))
) not valid;
