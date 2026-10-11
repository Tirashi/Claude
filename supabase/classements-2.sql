-- =====================================================================
--  Classements de la Ludothèque : mise à jour n° 2 (à coller UNE FOIS
--  dans Supabase, « SQL Editor » > « New query », puis « Run »).
--  Rien à remplacer : le code familial ne change pas.
--
--  Ajoute ludo_bests : le meilleur score de chaque classement d'un jeu,
--  en un seul appel (records du Picross Dex, couronnes dans le Pokédex).
-- =====================================================================

create or replace function public.ludo_bests(code text, p_game text, p_player uuid)
returns table (board text, pseudo text, value double precision, me boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ludo_check(code) then raise exception 'mauvais code familial'; end if;
  return query
    select distinct on (s.board) s.board, s.pseudo, s.value, s.player = p_player
    from public.scores s where s.game = p_game
    order by s.board, case when s.low_is_best then s.value else -s.value end, s.updated_at;
end $$;

revoke all on function public.ludo_bests(text, text, uuid) from public;
grant execute on function public.ludo_bests(text, text, uuid) to anon, authenticated;
