# Configurar Supabase (Fase 2) — pasos para Harold

Esto crea la base de datos en la nube. Hazlo una sola vez. Al final me pasas 2 datos
(URL y "anon key") y yo conecto la app.

## 1. Crear el proyecto

1. Entra a **https://supabase.com** → "Start your project" → inicia sesión (puedes usar
   tu cuenta de GitHub).
2. **New project**:
   - Name: `editor-de-fichas`
   - Database Password: pon una y **guárdala** (la necesitarás raras veces).
   - Region: la más cercana (ej. East US).
3. Espera ~2 min a que se cree.

## 2. Crear las tablas y permisos (copiar/pegar)

1. En el proyecto, menú izquierdo → **SQL Editor** → **New query**.
2. Pega TODO este bloque y dale **Run**:

```sql
-- PERFILES (rol por usuario: 'sales' o 'admin')
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'sales',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "perfil propio: leer" on public.profiles
  for select using (auth.uid() = id);

-- crear el perfil automáticamente cuando creas un usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- helper: ¿el usuario actual es admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- FICHAS
create table public.fichas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  category text,
  canvas_state jsonb,
  background_path text,
  thumbnail text,
  width int,
  height int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.fichas enable row level security;

create policy "fichas: leer propias o admin" on public.fichas
  for select using (auth.uid() = user_id or public.is_admin());
create policy "fichas: crear propias" on public.fichas
  for insert with check (auth.uid() = user_id);
create policy "fichas: editar propias o admin" on public.fichas
  for update using (auth.uid() = user_id or public.is_admin());
create policy "fichas: borrar propias o admin" on public.fichas
  for delete using (auth.uid() = user_id or public.is_admin());

-- BANCO DE BASES (imágenes base compartidas)
insert into storage.buckets (id, name, public) values ('bases', 'bases', true)
  on conflict (id) do nothing;

create policy "bases: leer (todos autenticados)" on storage.objects
  for select using (bucket_id = 'bases' and auth.role() = 'authenticated');
create policy "bases: subir (todos autenticados)" on storage.objects
  for insert with check (bucket_id = 'bases' and auth.role() = 'authenticated');
create policy "bases: actualizar (todos autenticados)" on storage.objects
  for update using (bucket_id = 'bases' and auth.role() = 'authenticated');
```

## 3. Crear tu usuario y hacerte admin

1. Menú → **Authentication** → **Users** → **Add user** → **Create new user**:
   - Email: tu correo
   - Password: la que quieras
   - **Marca "Auto Confirm User"** (para poder entrar sin verificar correo).
2. Vuelve al **SQL Editor** y corre esto (cambia el correo por el tuyo):

```sql
update public.profiles set role = 'admin' where email = 'TU-CORREO-AQUI';
```

> Para dar de alta a cada vendedor después: repite el paso 1 (Add user) con su correo
> y contraseña. No corras el UPDATE para ellos (quedan como 'sales' por defecto).

## 4. Pasarme los 2 datos

1. Menú → **Project Settings** (engranaje) → **API**.
2. Copia y pégame:
   - **Project URL** (algo como `https://abcdxyz.supabase.co`)
   - **anon public** key (una cadena larga que empieza con `eyJ...`)

> Tranquilo: la "anon key" está **diseñada para ir en el navegador**, no es secreta.
> La seguridad la dan los permisos (RLS) que configuramos arriba. Lo único que NUNCA
> se comparte es la "service_role" key (esa NO me la pases).

Con esos 2 datos conecto la app y probamos juntos.
