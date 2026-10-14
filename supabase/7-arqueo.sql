-- ---------------------------------------------------------------------------
-- Prepara la base para el arqueo de caja nuevo.
--
-- Dos cosas:
--   1. Tres columnas nuevas en `arqueos`.
--   2. Las formas de cobro que el local usa de verdad.
--
-- Se puede correr dos veces sin romper nada. No borra ningún arqueo viejo: los
-- que ya estén cerrados se siguen viendo, con el aviso de que se cerraron con
-- el formato anterior.
--
-- Dónde: Supabase → SQL Editor → New query → pegar todo → Run.
-- ---------------------------------------------------------------------------

-- 1) Columnas nuevas ---------------------------------------------------------
alter table public.arqueos
  -- Con cuánto efectivo se abrió el turno. Cuenta para lo que tiene que haber
  -- al cerrar: esos billetes se cuentan igual.
  add column if not exists monto_inicial integer default 0,
  add column if not exists cerrado_por   text,
  -- Lo que declaró el empleado, una entrada por forma de cobro. Va como jsonb
  -- y no una columna por medio: el local agrega formas de cobro desde el panel
  -- y la base no se tiene que tocar cada vez.
  add column if not exists declarado     jsonb default '{}'::jsonb;

-- 2) Columnas nuevas en medios de pago ---------------------------------------
alter table public.medios_pago
  -- Algunos medios no se reconocen por la forma de pago sino por de dónde vino
  -- el pedido: Pedidos Ya cobra él y le liquida al local.
  add column if not exists origen        text,
  -- Esa plata nunca pasa por el cajón, así que el encargado no la tiene que
  -- encontrar contando.
  add column if not exists fuera_de_caja boolean default false;

-- 3) Formas de cobro ---------------------------------------------------------

-- La «Tarjeta» pasa a llamarse como la llama el local. La clave y el 0 % de
-- arancel (decisión D6) no se tocan: solo cambia el nombre que se ve.
update public.medios_pago
set nombre = 'Tarj. Débito'
where nombre = 'Tarjeta';

-- Las dos que faltaban, cada una con su forma de reconocerse:
--
--   · «Mercado Pago QR» tiene clave `qr`. El cliente escanea el QR del local y
--     el empleado lo marca en el mostrador, así que el sistema lo cuenta igual
--     que el efectivo. No es lo mismo que el Mercado Pago de la web: entran por
--     canales distintos y el arancel puede ser distinto.
--
--   · «Online Pedidos Ya» NO se reconoce por la forma de pago sino por de dónde
--     vino el pedido. La plata la cobra PedidosYa y se la liquida al local, así
--     que nunca pasa por el cajón: va marcado `fuera_de_caja`.
--
-- La comisión queda en null —no en cero— porque todavía no sabemos el arancel
-- real. Null es «no lo sé» y el panel lo muestra como tal; un cero inventado
-- acá vuelve a ensuciar la ganancia neta.
insert into public.medios_pago (nombre, tipo, clave, origen, fuera_de_caja, comision, activo)
select v.nombre, v.tipo, v.clave, v.origen, v.fuera_de_caja, v.comision, true
from (values
  ('Mercado Pago QR',   'Online', 'qr'::text,  null::text,         false, null::numeric),
  ('Online Pedidos Ya', 'Online', null::text,  'Pedidos Ya'::text, true,  null::numeric)
) as v(nombre, tipo, clave, origen, fuera_de_caja, comision)
where not exists (
  select 1 from public.medios_pago m where m.nombre = v.nombre
);

-- Si ya los habías creado con la version anterior de este archivo, se corrigen.
update public.medios_pago set clave = 'qr'
  where nombre = 'Mercado Pago QR' and coalesce(clave, '') = '';
update public.medios_pago set origen = 'Pedidos Ya', fuera_de_caja = true
  where nombre = 'Online Pedidos Ya' and origen is null;

-- Para mirar que quedó bien: tienen que ser seis filas activas.
-- select nombre, tipo, clave, origen, fuera_de_caja, comision, activo
--   from public.medios_pago order by nombre;
