-- =====================================================================
--  Classements de la Ludothèque : à coller UNE FOIS dans Supabase,
--  menu « SQL Editor » > « New query », puis bouton « Run ».
--
--  AVANT DE LANCER : remplace MON-CODE (ligne 18) par ton code familial.
--  Le code reste dans Supabase : il n'apparaît nulle part dans le site.
-- =====================================================================

-- 1. Un coin privé, invisible depuis le site, pour le code familial
create schema if not exists ludo_private;
revoke all on schema ludo_private from public, anon, authenticated;

create table if not exists ludo_private.settings (
  id          int  primary key default 1 check (id = 1),
  family_code text not null
);
insert into ludo_private.settings (id, family_code)
values (1, 'MON-CODE')
on conflict (id) do update set family_code = excluded.family_code;

-- 2. Les scores : le meilleur de chaque joueur, par jeu et par classement
create table if not exists public.scores (
  player      uuid             not null,                       -- identifiant aléatoire du téléphone
  pseudo      text             not null check (char_length(pseudo) between 1 and 16),
  game        text             not null check (game  ~ '^[a-z0-9_-]{1,24}$'),
  board       text             not null check (board ~ '^[A-Za-z0-9_:.-]{1,40}$'),
  value       double precision not null check (value >= 0 and value < 1e9),
  low_is_best boolean          not null default false,          -- vrai pour un temps (plus petit = meilleur)
  updated_at  timestamptz      not null default now(),
  primary key (player, game, board)
);
-- verrou : personne ne lit ni n'écrit la table directement, tout passe par les fonctions ci-dessous
alter table public.scores enable row level security;
revoke all on public.scores from anon, authenticated;

-- 3. Le code familial est-il bon ?
create or replace function public.ludo_check(code text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from ludo_private.settings where family_code = code);
$$;

-- 4. Publier un score (on ne garde que le meilleur) ; renvoie le rang du joueur
create or replace function public.ludo_submit(code text, p_player uuid, p_pseudo text, p_game text, p_board text,
                                              p_value double precision, p_low boolean)
returns table (best double precision, rank bigint, total bigint)
language plpgsql security definer set search_path = '' as $$
declare v_best double precision;
begin
  if not public.ludo_check(code) then raise exception 'mauvais code familial'; end if;
  insert into public.scores as s (player, pseudo, game, board, value, low_is_best)
  values (p_player, left(btrim(p_pseudo), 16), p_game, p_board, p_value, p_low)
  on conflict (player, game, board) do update set
    value      = case when s.low_is_best then least(s.value, excluded.value) else greatest(s.value, excluded.value) end,
    updated_at = case when (s.low_is_best and excluded.value < s.value) or (not s.low_is_best and excluded.value > s.value)
                      then now() else s.updated_at end;
  -- le pseudo suit le joueur sur tous ses scores
  update public.scores set pseudo = left(btrim(p_pseudo), 16) where player = p_player;
  select s.value into v_best from public.scores s where s.player = p_player and s.game = p_game and s.board = p_board;
  return query
    select v_best,
           1 + count(*) filter (where (p_low and s.value < v_best) or (not p_low and s.value > v_best)),
           count(*)
    from public.scores s where s.game = p_game and s.board = p_board;
end $$;

-- 5. Lire un classement
create or replace function public.ludo_board(code text, p_game text, p_board text, p_player uuid, p_limit int default 20)
returns table (pseudo text, value double precision, updated_at timestamptz, me boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ludo_check(code) then raise exception 'mauvais code familial'; end if;
  return query
    select s.pseudo, s.value, s.updated_at, s.player = p_player
    from public.scores s where s.game = p_game and s.board = p_board
    order by case when s.low_is_best then s.value else -s.value end, s.updated_at
    limit least(greatest(p_limit, 1), 100);
end $$;

-- 6. Un « ping » pour le réveil automatique (empêche la mise en pause après 7 jours)
create or replace function public.ludo_ping()
returns text language sql stable security definer set search_path = '' as $$ select 'ok'::text $$;

-- 7. Le site (clé publique) n'a droit qu'à ces fonctions
revoke all on function public.ludo_check(text) from public;
revoke all on function public.ludo_submit(text, uuid, text, text, text, double precision, boolean) from public;
revoke all on function public.ludo_board(text, text, text, uuid, int) from public;
revoke all on function public.ludo_ping() from public;
grant execute on function public.ludo_check(text) to anon, authenticated;
grant execute on function public.ludo_submit(text, uuid, text, text, text, double precision, boolean) to anon, authenticated;
grant execute on function public.ludo_board(text, text, text, uuid, int) to anon, authenticated;
grant execute on function public.ludo_ping() to anon, authenticated;
