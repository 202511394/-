create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  constraint user_profiles_username_length check (char_length(username) between 3 and 20),
  constraint user_profiles_username_no_spaces check (username !~ '\\s')
);

create unique index if not exists user_profiles_username_lower_idx on public.user_profiles (lower(username));

alter table public.user_profiles enable row level security;
create policy "users can read own profile" on public.user_profiles for select using (auth.uid() = user_id);
create policy "users can create own profile" on public.user_profiles for insert with check (auth.uid() = user_id);

create table if not exists public.username_login_attempts (
  username text primary key,
  failed_attempts integer not null default 0,
  locked_until timestamptz
);

alter table public.username_login_attempts enable row level security;
revoke all on public.username_login_attempts from anon, authenticated;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_username text := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
begin
  if char_length(new_username) not between 3 and 20 or new_username ~ '\\s' then
    raise exception 'A valid username is required';
  end if;

  insert into public.user_profiles (user_id, username) values (new.id, new_username);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_username_profile on auth.users;
create trigger on_auth_user_created_username_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();
