-- ---------------------------------------------------------------------------
-- Nasty Burgers — 1 de 3: las tablas
-- Pegar tal cual en Supabase > SQL Editor > New query > Run.
-- Después correr 2-columnas.sql y 3-datos.sql, en ese orden.
-- ---------------------------------------------------------------------------

create table if not exists public.pedidos (
  id                uuid primary key default gen_random_uuid(),
  creado_en         timestamptz not null default now(),
  numero            integer,

  -- del cliente
  modalidad         text not null check (modalidad in ('delivery', 'retiro')),
  local             text not null,
  cliente_nombre    text not null,
  cliente_telefono  text not null,
  cliente_email     text,
  direccion         text,
  nota              text,

  items             jsonb not null default '[]'::jsonb,
  subtotal          integer not null,
  descuento         integer not null default 0,
  total             integer not null,
  pago              text not null check (pago in ('efectivo', 'mercadopago', 'transferencia', 'tarjeta')),

  -- del local
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente','preparando','en_envio','listo','entregado','rechazado')),
  demora_min        integer,
  efectivo_cobrado  boolean not null default false,
  avisado           boolean not null default false,
  motivo_rechazo    text,
  origen            text default 'Tienda Online',
  stock_descontado  boolean not null default false,
  aceptado_por      text,
  actualizado_en    timestamptz not null default now()
);

-- Numero de comanda: reinicia todos los dias, hora de Buenos Aires.
create or replace function public.asignar_numero()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.numero is null then
    select coalesce(max(numero), 0) + 1
      into new.numero
      from public.pedidos
     where (creado_en at time zone 'America/Argentina/Buenos_Aires')::date
         = (now()      at time zone 'America/Argentina/Buenos_Aires')::date;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_asignar_numero on public.pedidos;
create trigger trg_asignar_numero
  before insert on public.pedidos
  for each row execute function public.asignar_numero();

create or replace function public.tocar_actualizado()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end; $$;

drop trigger if exists trg_tocar_actualizado on public.pedidos;
create trigger trg_tocar_actualizado
  before update on public.pedidos
  for each row execute function public.tocar_actualizado();

create index if not exists pedidos_creado_en_idx on public.pedidos (creado_en desc);
create index if not exists pedidos_estado_idx    on public.pedidos (estado);

-- ---------------------------------------------------------------------------
-- Seguridad
-- Cualquiera (la web publica) puede CREAR un pedido.
-- Solo un empleado logueado puede VERLOS y MODIFICARLOS.
-- Esto es importante: la tabla guarda telefono, mail y direccion de clientes.
-- ---------------------------------------------------------------------------

alter table public.pedidos enable row level security;

drop policy if exists "cualquiera crea pedidos" on public.pedidos;
create policy "cualquiera crea pedidos"
  on public.pedidos for insert
  to anon, authenticated
  with check (true);

-- Cada local ve SOLO sus comandas. Sale del mail con el que entró:
-- benavidez@nastyburgers.com -> local 'benavidez'
-- escobar@nastyburgers.com   -> local 'escobar'
-- Cualquier otro mail (el del dueño, por ejemplo) ve los dos locales.
--
-- Si algún día abre un local nuevo, agregalo al array de abajo y volvé a
-- correr este bloque.
create or replace function public.local_del_usuario()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
           when split_part(lower(coalesce(auth.jwt() ->> 'email', '')), '@', 1)
                = any (array['benavidez', 'escobar'])
           then split_part(lower(auth.jwt() ->> 'email'), '@', 1)
           else null
         end;
$$;

drop policy if exists "empleados leen pedidos" on public.pedidos;
create policy "empleados leen pedidos"
  on public.pedidos for select
  to authenticated
  using (
    public.local_del_usuario() is null
    or local = public.local_del_usuario()
  );

drop policy if exists "empleados actualizan pedidos" on public.pedidos;
create policy "empleados actualizan pedidos"
  on public.pedidos for update
  to authenticated
  using (
    public.local_del_usuario() is null
    or local = public.local_del_usuario()
  )
  with check (
    public.local_del_usuario() is null
    or local = public.local_del_usuario()
  );

-- Tiempo real para el panel
alter publication supabase_realtime add table public.pedidos;


-- ---------------------------------------------------------------------------
-- Historial del asistente de precios
-- Cada cambio de precios que se aplica queda acá, con el detalle para deshacer.
-- ---------------------------------------------------------------------------

create table if not exists public.historial_precios (
  id        uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  fecha     timestamptz default now(),
  pedido    text,
  detalle   text,
  fuente    text,
  cambios   jsonb not null default '[]'::jsonb,
  deshecho  boolean not null default false
);

alter table public.historial_precios enable row level security;

drop policy if exists lectura on public.historial_precios;
create policy lectura on public.historial_precios
  for select to authenticated using (true);

drop policy if exists escritura on public.historial_precios;
create policy escritura on public.historial_precios
  for all to authenticated using (true) with check (true);


-- ---------------------------------------------------------------------------
-- Tablas del sistema (productos, stock, caja, gastos, configuración…)
--
-- Todas tienen la misma forma: id + creado_en + los campos propios. El panel
-- las lee y escribe con el mismo código genérico (src/lib/almacen.js), así que
-- alcanza con crearlas y darles permiso al usuario logueado.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tablas text[] := array[
    'productos', 'ingredientes', 'cat_productos', 'cat_ingredientes',
    'grupos_modificadores', 'menus', 'listas_precios',
    'proveedores', 'gastos', 'cat_gastos',
    'movimientos_caja', 'movimientos_stock', 'arqueos', 'cajas',
    'descuentos', 'medios_pago', 'cuentas_bancarias',
    'impresoras', 'areas_impresion', 'usuarios', 'roles', 'turnos',
    'zonas_envio', 'ajustes'
  ];
begin
  foreach t in array tablas loop
    execute format(
      'create table if not exists public.%I (
         id uuid primary key default gen_random_uuid(),
         creado_en timestamptz not null default now()
       )', t);

    -- Los campos propios de cada tabla viven en columnas normales; para no
    -- tener que declararlas una por una, se agregan sobre la marcha desde el
    -- panel o se puede usar una columna jsonb. Acá se habilitan los permisos.
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists lectura on public.%I', t);
    execute format(
      'create policy lectura on public.%I for select to authenticated using (true)', t);

    execute format('drop policy if exists escritura on public.%I', t);
    execute format(
      'create policy escritura on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Lo que puede leer la web pública (sin login)
--
-- La carta, las categorías, los ingredientes (para armar la descripción), los
-- datos del local y los costos de envío. NADA MÁS: los pedidos, la caja, los
-- gastos y los usuarios siguen siendo solo para el empleado logueado.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  -- grupos_modificadores va acá porque la web tiene que poder mostrarle al
  -- cliente las papas normales o sazonadas antes de que se loguee nadie.
  publicas text[] := array[
    'productos', 'cat_productos', 'ingredientes', 'grupos_modificadores',
    'ajustes', 'zonas_envio'
  ];
begin
  foreach t in array publicas loop
    execute format('drop policy if exists "lectura publica" on public.%I', t);
    execute format(
      'create policy "lectura publica" on public.%I for select to anon using (true)', t);
  end loop;
end $$;

-- NOTA: acá las tablas quedan creadas con id y creado_en nada más. Las columnas
-- de cada una (nombre, precio, receta, stock…) las agrega 2-columnas.sql, y los
-- datos iniciales de la carta los carga 3-datos.sql.
