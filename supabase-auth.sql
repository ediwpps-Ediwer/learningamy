-- ===========================================================================
--  Block Quest — cuentas de verdad (usuario + contraseña)
--
--  Correr esto UNA VEZ en:  Supabase → SQL Editor → New query → Run
--  Proyecto: https://qdyssqmggbmwoctfnnoi.supabase.co
--
--  Reemplaza al esquema anterior de `progreso`, que identificaba al jugador
--  por un texto adivinable. Acá cada jugador es un usuario real de Supabase
--  Auth y la base solo le deja ver lo suyo.
--
--  ANTES DE CORRER ESTO hay que apagar la confirmación por correo:
--    Authentication → Sign In / Providers → Email → "Confirm email" → OFF
--  Si queda encendida, Supabase manda un mail de confirmación a direcciones
--  que no existen y nadie puede entrar nunca.
-- ===========================================================================

create table if not exists public.jugadores (
  user_id        uuid primary key references auth.users on delete cascade,
  usuario        text not null unique,
  nombre         text not null default '',
  -- quién puede VER el progreso de este jugador además de él mismo
  tutor_id       uuid references auth.users on delete set null,
  -- código que otros usan para vincularse a este adulto como tutor
  codigo_familia text unique,
  datos          jsonb not null default '{}'::jsonb,
  actualizado    timestamptz not null default now()
);

create index if not exists jugadores_tutor_idx on public.jugadores (tutor_id);

alter table public.jugadores enable row level security;

-- --------------------------------------------------------------------------
--  Políticas
--
--  Ver     : tu propia fila, o la de los chicos que tutorás.
--  Crear   : solo tu propia fila, y solo con tu propio user_id.
--  Cambiar : solo tu propia fila. El tutor LEE el progreso pero no lo escribe
--            — así un adulto no puede alterar los resultados de un chico, que
--            es justamente lo que hace que los datos sirvan para algo.
--  Borrar  : no hay política, así que nadie borra desde el navegador.
-- --------------------------------------------------------------------------

drop policy if exists "jugadores ver" on public.jugadores;
create policy "jugadores ver"
  on public.jugadores for select
  to authenticated
  using (user_id = auth.uid() or tutor_id = auth.uid());

drop policy if exists "jugadores alta" on public.jugadores;
create policy "jugadores alta"
  on public.jugadores for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "jugadores cambio" on public.jugadores;
create policy "jugadores cambio"
  on public.jugadores for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- --------------------------------------------------------------------------
--  Vincularse a un tutor con un código
--
--  Va como SECURITY DEFINER porque necesita buscar al adulto por su código,
--  y las políticas de arriba no dejan leer filas ajenas. La función es la
--  única puerta: recibe un código, y si existe, marca al que llama como
--  tutorado de ese adulto. No devuelve ningún dato del adulto.
-- --------------------------------------------------------------------------

create or replace function public.vincular_tutor(codigo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  t uuid;
begin
  if codigo is null or length(trim(codigo)) < 4 then
    return false;
  end if;
  select user_id into t
    from public.jugadores
   where codigo_familia = upper(trim(codigo))
   limit 1;

  if t is null or t = auth.uid() then
    return false;
  end if;

  update public.jugadores
     set tutor_id = t
   where user_id = auth.uid();

  return true;
end;
$$;

revoke all on function public.vincular_tutor(text) from public;
grant execute on function public.vincular_tutor(text) to authenticated;

-- --------------------------------------------------------------------------
--  La tabla vieja `progreso` queda sin uso.
--  Cuando confirmes que las cuentas nuevas andan, se puede borrar con:
--      drop table if exists public.progreso;
--  No la borro acá por si querés mirar lo que haya quedado adentro.
-- --------------------------------------------------------------------------
