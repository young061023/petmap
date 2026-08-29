create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  point_balance integer not null default 0 check (point_balance >= 0),
  coupon_count integer not null default 0 check (coupon_count >= 0),
  badge_count integer not null default 0 check (badge_count >= 0),
  completed_mission_count integer not null default 0 check (completed_mission_count >= 0),
  visited_region_count integer not null default 0 check (visited_region_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing projects may already have a smaller profiles table. Keep its rows and
-- add only the columns required by the current app.
alter table public.profiles add column if not exists name text not null default '';
alter table public.profiles add column if not exists point_balance integer not null default 0;
alter table public.profiles add column if not exists coupon_count integer not null default 0;
alter table public.profiles add column if not exists badge_count integer not null default 0;
alter table public.profiles add column if not exists completed_mission_count integer not null default 0;
alter table public.profiles add column if not exists visited_region_count integer not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  breed text not null default '',
  size text not null check (size in ('small', 'medium', 'large')),
  birth_date date,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  record_date date not null,
  record_time text not null,
  title text not null,
  description text not null default '',
  category text not null check (category in ('산책', '간식', '놀이', '병원', '여행', '기록')),
  location text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists records_user_date_idx on public.records(user_id, record_date);

create table if not exists public.user_missions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  id text not null,
  title text not null,
  description text not null,
  category text not null check (category in ('walk', 'place', 'training', 'bonding', 'photo')),
  period text not null check (period in ('daily', 'weekly')),
  reward_points integer not null check (reward_points >= 0),
  progress integer not null default 0 check (progress >= 0),
  target integer not null check (target > 0),
  unit text not null,
  deadline_label text not null,
  instructions jsonb not null default '[]'::jsonb,
  assigned_date date not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check (progress <= target)
);

create index if not exists user_missions_user_date_idx on public.user_missions(user_id, assigned_date);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists pets_set_updated_at on public.pets;
create trigger pets_set_updated_at before update on public.pets
for each row execute function public.set_updated_at();
drop trigger if exists records_set_updated_at on public.records;
create trigger records_set_updated_at before update on public.records
for each row execute function public.set_updated_at();
drop trigger if exists user_missions_set_updated_at on public.user_missions;
create trigger user_missions_set_updated_at before update on public.user_missions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger security definer set search_path = public language plpgsql as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, name)
select id, coalesce(raw_user_meta_data ->> 'name', '') from auth.users
on conflict (id) do nothing;

create or replace view public.profile_summaries
with (security_invoker = true) as
select id, name, point_balance, coupon_count, badge_count,
       completed_mission_count, visited_region_count
from public.profiles;

alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.records enable row level security;
alter table public.user_missions enable row level security;

drop policy if exists profiles_own_rows on public.profiles;
create policy profiles_own_rows on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists pets_own_rows on public.pets;
create policy pets_own_rows on public.pets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists records_own_rows on public.records;
create policy records_own_rows on public.records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists user_missions_own_rows on public.user_missions;
create policy user_missions_own_rows on public.user_missions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.pets to authenticated;
grant select, insert, update, delete on public.records to authenticated;
grant select on public.user_missions to authenticated;
grant update (progress) on public.user_missions to authenticated;
grant select on public.profile_summaries to authenticated;

create or replace function public.ensure_example_missions()
returns void
security definer set search_path = public language plpgsql as $$
declare
  current_user_id uuid := auth.uid();
  today date := current_date;
  monday date := current_date - (extract(isodow from current_date)::integer - 1);
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_missions
    (user_id, id, title, description, category, period, reward_points, progress,
     target, unit, deadline_label, instructions, assigned_date)
  values
    (current_user_id, 'daily-' || today || '-walk-30', '하루 30분 산책하기',
     '반려동물과 함께 30분 이상 산책해 보세요.', 'walk', 'daily', 60, 0,
     30, '분', '오늘 자정까지', '["안전한 산책로를 선택해 주세요.", "30분 이상 산책하면 완료예요."]'::jsonb, today),
    (current_user_id, 'daily-' || today || '-brush', '양치질 1분 하기',
     '반려동물의 치아를 깔끔하게 관리해 주세요.', 'bonding', 'daily', 40, 0,
     1, '회', '오늘 자정까지', '["반려동물용 칫솔과 치약을 사용해 주세요."]'::jsonb, today),
    (current_user_id, 'daily-' || today || '-photo', '추억 사진 1장 남기기',
     '오늘의 귀여운 순간을 기록해 보세요.', 'photo', 'daily', 50, 0,
     1, '장', '오늘 자정까지', '["오늘의 사진을 한 장 촬영해 기록해 주세요."]'::jsonb, today),
    (current_user_id, 'weekly-' || monday || '-walk-3', '일주일에 3번 산책하기',
     '이번 주에 서로 다른 날 3번 산책해 보세요.', 'walk', 'weekly', 180, 0,
     3, '회', '일요일 자정까지', '["서로 다른 날에 산책 기록을 남겨 주세요."]'::jsonb, monday),
    (current_user_id, 'weekly-' || monday || '-new-place', '새로운 산책 장소 발견하기',
     '평소와 다른 산책 장소를 한 곳 방문해 보세요.', 'place', 'weekly', 120, 0,
     1, '곳', '일요일 자정까지', '["안전한 새 장소에서 산책 기록을 남겨 주세요."]'::jsonb, monday)
  on conflict (user_id, id) do nothing;
end;
$$;

revoke all on function public.ensure_example_missions() from public;
grant execute on function public.ensure_example_missions() to authenticated;

create or replace function public.claim_mission_reward(p_mission_id text)
returns table(mission_id text, claimed_at timestamptz)
security definer set search_path = public language plpgsql as $$
declare
  reward integer;
  claimed timestamptz;
begin
  update public.user_missions
  set claimed_at = now()
  where user_id = auth.uid()
    and id = p_mission_id
    and progress >= target
    and user_missions.claimed_at is null
  returning reward_points, user_missions.claimed_at into reward, claimed;

  if not found then
    raise exception 'Mission is not complete or reward was already claimed';
  end if;

  update public.profiles
  set point_balance = point_balance + reward,
      completed_mission_count = completed_mission_count + 1
  where id = auth.uid();

  return query select p_mission_id, claimed;
end;
$$;

revoke all on function public.claim_mission_reward(text) from public;
grant execute on function public.claim_mission_reward(text) to authenticated;
