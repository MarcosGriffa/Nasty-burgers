-- ---------------------------------------------------------------------------
-- Nasty Burgers — 2 de 3: las columnas de cada tabla
-- Correr DESPUÉS de 1-esquema.sql, en Supabase > SQL Editor > New query > Run.
-- Todo es "add column if not exists": se puede volver a correr sin romper nada.
-- ---------------------------------------------------------------------------

-- Pedidos --------------------------------------------------------------------
-- Lo que se cobró de envío en ESE pedido. Se guarda en el pedido y no se lee
-- de los ajustes, porque si mañana sube el envío los pedidos viejos tienen que
-- seguir mostrando lo que se cobró de verdad.
alter table public.pedidos
  add column if not exists envio integer not null default 0;

-- Productos ------------------------------------------------------------------
alter table public.productos
  add column if not exists nombre               text,
  add column if not exists codigo               text,
  add column if not exists categoria            text,
  add column if not exists subcategoria         text,
  add column if not exists area                 text,
  add column if not exists costo                integer default 0,
  add column if not exists costo_manual         boolean default false,
  add column if not exists precio               integer default 0,
  add column if not exists descripcion          text,
  add column if not exists img                  text,
  add column if not exists receta               jsonb   default '[]'::jsonb,
  add column if not exists modificadores        jsonb   default '[]'::jsonb,
  add column if not exists proveedor            text,
  add column if not exists activo               boolean default true,
  add column if not exists visible_web          boolean default true,
  add column if not exists destacado            boolean default false,
  add column if not exists promo                boolean default false,
  add column if not exists permitir_vender_solo boolean default true,
  add column if not exists controlar_stock      boolean default true,
  add column if not exists vender_sin_stock     boolean default true;

-- El código es el que usa el sistema para reconocer cada producto
-- (critical-d, nasty-s…): no puede haber dos iguales.
create unique index if not exists productos_codigo_idx on public.productos (codigo);

-- Ingredientes ---------------------------------------------------------------
alter table public.ingredientes
  add column if not exists nombre        text,
  add column if not exists categoria     text,
  add column if not exists unidad        text,
  add column if not exists costo         numeric default 0,
  add column if not exists stock         numeric default 0,
  add column if not exists stock_minimo  numeric default 0;

-- Categorías -----------------------------------------------------------------
alter table public.cat_productos
  add column if not exists nombre text,
  add column if not exists area   text,
  add column if not exists bajada text;

alter table public.cat_ingredientes
  add column if not exists nombre text;

-- Grupos modificadores -------------------------------------------------------
-- `opciones` es la lista que ve el cliente: [{nombre, precio, ingrediente?, cantidad?}].
-- Las que tienen ingrediente descuentan stock al aceptar el pedido (las papas
-- sazonadas se llevan su sazonador).
alter table public.grupos_modificadores
  add column if not exists nombre    text,
  add column if not exists bajada    text,
  add column if not exists opciones  jsonb   default '[]'::jsonb,
  add column if not exists productos integer default 0,
  add column if not exists minimo    integer default 0,
  add column if not exists maximo    integer default 0;

-- Menús y listas de precios --------------------------------------------------
alter table public.menus
  add column if not exists nombre    text,
  add column if not exists canal     text,
  add column if not exists productos integer default 0,
  add column if not exists estado    text default 'Borrador';

alter table public.listas_precios
  add column if not exists nombre text,
  add column if not exists ajuste numeric default 0,
  add column if not exists tipo   text default 'Monto',
  add column if not exists activa boolean default true;

-- Proveedores ----------------------------------------------------------------
alter table public.proveedores
  add column if not exists nombre    text,
  add column if not exists email     text,
  add column if not exists telefono  text,
  add column if not exists direccion text,
  add column if not exists saldo     integer default 0;

-- Gastos ---------------------------------------------------------------------
alter table public.gastos
  add column if not exists fecha      timestamptz default now(),
  add column if not exists proveedor  text,
  add column if not exists categoria  text,
  add column if not exists comentario text,
  add column if not exists medio_pago text,
  add column if not exists estado     text default 'Pagado',
  add column if not exists importe    integer default 0;

alter table public.cat_gastos
  add column if not exists nombre     text,
  add column if not exists financiera text,
  add column if not exists activo     boolean default true;

-- Caja -----------------------------------------------------------------------
alter table public.movimientos_caja
  add column if not exists fecha      timestamptz default now(),
  add column if not exists caja       text,
  add column if not exists tipo       text,
  add column if not exists monto      integer default 0,
  add column if not exists comentario text;

alter table public.movimientos_stock
  add column if not exists fecha       timestamptz default now(),
  add column if not exists ingrediente text,
  add column if not exists tipo        text,
  add column if not exists cantidad    numeric default 0,
  add column if not exists unidad      text;

alter table public.arqueos
  add column if not exists caja          text,
  add column if not exists apertura      timestamptz,
  add column if not exists cierre        timestamptz,
  add column if not exists usuario       text,
  add column if not exists sistema       integer default 0,
  add column if not exists usuario_monto integer default 0,
  add column if not exists conciliado    boolean default false;

alter table public.cajas
  add column if not exists nombre text,
  add column if not exists activa boolean default true;

-- Descuentos y medios de pago ------------------------------------------------
alter table public.descuentos
  add column if not exists nombre text,
  add column if not exists tipo   text,
  add column if not exists valor  numeric default 0,
  add column if not exists activo boolean default true;

alter table public.medios_pago
  add column if not exists nombre   text,
  add column if not exists tipo     text,
  add column if not exists comision numeric default 0,
  add column if not exists activo   boolean default true;

alter table public.cuentas_bancarias
  add column if not exists nombre text,
  add column if not exists banco  text,
  add column if not exists numero text,
  add column if not exists saldo  integer default 0;

-- Impresión ------------------------------------------------------------------
alter table public.impresoras
  add column if not exists nombre text,
  add column if not exists ancho  text,
  add column if not exists tipo   text,
  add column if not exists activa boolean default true;

alter table public.areas_impresion
  add column if not exists nombre    text,
  add column if not exists impresora text,
  add column if not exists copias    integer default 1;

-- Usuarios, roles y turnos ---------------------------------------------------
alter table public.usuarios
  add column if not exists nombre text,
  add column if not exists email  text,
  add column if not exists rol    text,
  add column if not exists activo boolean default true;

alter table public.roles
  add column if not exists nombre   text,
  add column if not exists permisos text;

alter table public.turnos
  add column if not exists nombre text,
  add column if not exists desde  text,
  add column if not exists hasta  text,
  add column if not exists activo boolean default true;

-- Tienda online --------------------------------------------------------------
alter table public.zonas_envio
  add column if not exists zona     text,
  add column if not exists hasta_km numeric default 0,
  add column if not exists costo    integer default 0;

alter table public.ajustes
  add column if not exists clave                       text default 'general',
  add column if not exists tienda_activa               boolean default true,
  add column if not exists telefono                    text,
  add column if not exists whatsapp                    text,
  add column if not exists email                       text,
  add column if not exists direccion                   text,
  add column if not exists horario                     text,
  add column if not exists instagram                   text,
  add column if not exists facebook                    text,
  add column if not exists monto_minimo_activo         boolean default false,
  add column if not exists monto_minimo                integer default 0,
  -- uno solo para todas las zonas: se cobra lo mismo llegue a donde llegue
  add column if not exists costo_envio                 integer default 3000,
  add column if not exists ocultar_sin_stock           boolean default true,
  add column if not exists alertas_sonoras             boolean default true,
  add column if not exists imprimir_al_aceptar         boolean default true,
  add column if not exists imprimir_ticket_al_entregar boolean default false,
  add column if not exists rechazar_sin_stock          boolean default false,
  add column if not exists copias_cocina               integer default 1,
  add column if not exists ancho_papel                 text default '80mm',
  add column if not exists py_activo                   boolean default false,
  add column if not exists py_codigo                   text,
  add column if not exists py_comision                 numeric default 0,
  add column if not exists py_auto_aceptar             boolean default false,
  add column if not exists py_sonido                   boolean default true,
  add column if not exists horarios                    jsonb default '[]'::jsonb;

-- Los ajustes del local son una sola fila: sin esto, con dos pestañas abiertas
-- se duplican y el panel lee cualquiera de las dos.
create unique index if not exists ajustes_clave_idx on public.ajustes (clave);

-- Tiempo real para el panel --------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'productos','ingredientes','cat_productos','grupos_modificadores',
    'gastos','movimientos_caja',
    'movimientos_stock','arqueos','descuentos','listas_precios','zonas_envio',
    'historial_precios','ajustes'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
