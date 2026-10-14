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

-- 2) Formas de cobro ---------------------------------------------------------

-- La «Tarjeta» pasa a llamarse como la llama el local. La clave y el 0 % de
-- arancel (decisión D6) no se tocan: solo cambia el nombre que se ve.
update public.medios_pago
set nombre = 'Tarj. Débito'
where nombre = 'Tarjeta';

-- Las dos que faltaban. Van SIN clave a propósito:
--   · «Online Pedidos Ya» entra por fuera del sistema (hasta que esté la API
--     de partners).
--   · «Mercado Pago QR» se cobra con el celular del local: el pedido no sabe
--     distinguirlo del Mercado Pago de la web.
-- Sin clave no se les asigna ninguna venta, y está bien: en el cierre el
-- empleado declara lo que contó igual.
--
-- La comisión queda en null —no en cero— porque todavía no sabemos el arancel
-- real. Null es «no lo sé» y el panel lo muestra como tal; un cero inventado
-- acá vuelve a ensuciar la ganancia neta.
insert into public.medios_pago (nombre, tipo, clave, comision, activo)
select v.nombre, v.tipo, v.clave, v.comision, true
from (values
  ('Mercado Pago QR',   'Online', null::text, null::numeric),
  ('Online Pedidos Ya', 'Online', null::text, null::numeric)
) as v(nombre, tipo, clave, comision)
where not exists (
  select 1 from public.medios_pago m where m.nombre = v.nombre
);

-- Para mirar que quedó bien: tienen que ser seis filas activas.
-- select nombre, tipo, clave, comision, activo
--   from public.medios_pago order by nombre;
