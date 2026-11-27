-- EXPO/FES 2027 的場次可複選：session / want_session 以逗號串接（例：EXPO_Day1,Stage_2）。
-- 在 Supabase SQL Editor 執行（可重複執行）。需先執行過 005。
alter table public.ticket_posts drop constraint if exists ticket_posts_tickets_check;
alter table public.ticket_posts add constraint ticket_posts_tickets_check check (
  event in ('ayafubumi', 'expo2027')
  and (event <> 'ayafubumi' or (
    session in ('', 'Day1', 'Day2') and want_session in ('', 'Day1', 'Day2')
    and seat in ('', 'SS', 'S', 'A', 'B') and want_seat in ('', 'SS', 'S', 'A', 'B', 'any')))
  and (event <> 'expo2027' or (
    session ~ '^(|(EXPO_Day1|EXPO_Day2|EXPO_Day3|Stage_1|Stage_2|Stage_3|Dreams_Stage)(,(EXPO_Day1|EXPO_Day2|EXPO_Day3|Stage_1|Stage_2|Stage_3|Dreams_Stage))*)$'
    and want_session ~ '^(|(EXPO_Day1|EXPO_Day2|EXPO_Day3|Stage_1|Stage_2|Stage_3|Dreams_Stage)(,(EXPO_Day1|EXPO_Day2|EXPO_Day3|Stage_1|Stage_2|Stage_3|Dreams_Stage))*)$'
    and seat = '' and want_seat = ''))
  and platform in ('', 'zaiko', 'lawson') and want_platform in ('', 'zaiko', 'lawson', 'any')
  and (kind = 'want' or (session <> '' and (event <> 'ayafubumi' or seat <> '') and platform <> ''))
  and (kind = 'give' or (want_session <> '' and (event <> 'ayafubumi' or want_seat <> '') and want_platform <> ''))
) not valid;
