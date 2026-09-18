create or replace function public.ensure_rotating_missions(p_missions jsonb)
returns void
security definer set search_path = public language plpgsql as $$
declare
  current_user_id uuid := auth.uid();
  item jsonb;
  daily_count integer;
  weekly_count integer;
  today_date date := (now() at time zone 'Asia/Seoul')::date;
  week_date date := date_trunc('week', now() at time zone 'Asia/Seoul')::date;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(p_missions) <> 'array' or jsonb_array_length(p_missions) <> 8 then
    raise exception 'Exactly eight missions are required';
  end if;

  select
    count(*) filter (where value ->> 'period' = 'daily'),
    count(*) filter (where value ->> 'period' = 'weekly')
  into daily_count, weekly_count
  from jsonb_array_elements(p_missions);

  if daily_count <> 3 or weekly_count <> 5 then
    raise exception 'Three daily and five weekly missions are required';
  end if;

  for item in select value from jsonb_array_elements(p_missions)
  loop
    if item ->> 'category' not in ('walk', 'place', 'training', 'bonding', 'photo')
       or coalesce((item ->> 'target')::integer, 0) not between 1 and 100
       or coalesce((item ->> 'rewardPoints')::integer, 0) not between 1 and 300
       or item ->> 'title' is null
       or item ->> 'description' is null
       or item ->> 'unit' is null then
      raise exception 'Invalid mission payload';
    end if;

    if item ->> 'period' = 'daily' then
      if (item ->> 'assignedDate')::date <> today_date
         or item ->> 'id' not like 'daily-' || today_date::text || '-%' then
        raise exception 'Invalid daily mission date';
      end if;
    elsif item ->> 'period' = 'weekly' then
      if (item ->> 'assignedDate')::date <> week_date
         or item ->> 'id' not like 'weekly-' || week_date::text || '-%' then
        raise exception 'Invalid weekly mission date';
      end if;
    else
      raise exception 'Invalid mission period';
    end if;

    insert into public.user_missions
      (user_id, id, title, description, category, period, reward_points, progress,
       target, unit, deadline_label, instructions, assigned_date)
    values
      (current_user_id,
       item ->> 'id',
       item ->> 'title',
       item ->> 'description',
       item ->> 'category',
       item ->> 'period',
       (item ->> 'rewardPoints')::integer,
       0,
       (item ->> 'target')::integer,
       item ->> 'unit',
       item ->> 'deadlineLabel',
       coalesce(item -> 'instructions', '[]'::jsonb),
       (item ->> 'assignedDate')::date)
    on conflict (user_id, id) do nothing;
  end loop;
end;
$$;

revoke all on function public.ensure_rotating_missions(jsonb) from public;
grant execute on function public.ensure_rotating_missions(jsonb) to authenticated;
