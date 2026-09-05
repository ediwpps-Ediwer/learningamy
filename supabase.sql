-- ===========================================================================
--  Block Quest — tabla de progreso en Supabase
--  Correr esto UNA VEZ en:  Supabase → SQL Editor → New query → Run
--  Proyecto: https://qdyssqmggbmwoctfnnoi.supabase.co
-- ===========================================================================

create table if not exists public.progreso (
  id           text primary key,
  datos        jsonb not null default '{}'::jsonb,
  actualizado  timestamptz not null default now()
);

alter table public.progreso enable row level security;

-- --------------------------------------------------------------------------
--  Política: acceso anónimo SOLO a la fila 'gabriel'.
--
--  Es deliberadamente simple porque es una app familiar de un solo jugador,
--  sin login. Lo único que queda expuesto es el progreso escolar de un chico
--  bajo una clave que hay que adivinar, y nada más de la base.
--
--  Si algún día se agrega un segundo hijo o querés cerrarlo de verdad,
--  el paso siguiente es Supabase Auth y cambiar esto por
--  `using (auth.uid() = user_id)`.
-- --------------------------------------------------------------------------

drop policy if exists "progreso lectura" on public.progreso;
create policy "progreso lectura"
  on public.progreso for select
  to anon
  using (id = 'gabriel');

drop policy if exists "progreso alta" on public.progreso;
create policy "progreso alta"
  on public.progreso for insert
  to anon
  with check (id = 'gabriel');

drop policy if exists "progreso cambio" on public.progreso;
create policy "progreso cambio"
  on public.progreso for update
  to anon
  using (id = 'gabriel')
  with check (id = 'gabriel');

-- fila inicial
insert into public.progreso (id, datos)
values ('gabriel', '{}'::jsonb)
on conflict (id) do nothing;
