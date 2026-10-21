-- ---------------------------------------------------------------------------
-- Tres cosas, todas de una:
--
--   1. «Transferencia» y «Mercado Pago» pasan a ser una sola forma de cobro.
--   2. Se destraba el candado que NO dejaba guardar ventas por QR ni por
--      tarjeta de crédito. Esto es un error que te iba a aparecer el primer
--      día de uso, con un pedido rebotado y sin explicación.
--   3. Las siete fotos nuevas (medallón extra, papas y las cinco Imperial).
--
-- Se puede correr dos veces sin romper nada. No borra ninguna venta.
--
-- Dónde: Supabase → SQL Editor → New query → pegar todo → Run.
-- ---------------------------------------------------------------------------


-- 1) EL CANDADO DE LAS FORMAS DE COBRO ---------------------------------------
--
-- La tabla `pedidos` tiene una regla que solo deja guardar cuatro formas de
-- pago: efectivo, mercadopago, transferencia y tarjeta. Se escribió en
-- septiembre, antes de que existieran el QR y la tarjeta de crédito.
--
-- O sea: hoy, si un cliente paga con QR y el empleado lo marca como tal, la
-- base RECHAZA el pedido. No es que lo guarde mal: no lo guarda.
--
-- Se reemplaza por la lista de verdad. Se deja 'transferencia' adentro a
-- propósito, para que los pedidos viejos que ya están guardados con esa
-- palabra no queden fuera de la regla.
alter table public.pedidos drop constraint if exists pedidos_pago_check;
alter table public.pedidos add constraint pedidos_pago_check
  check (pago in ('efectivo', 'mercadopago', 'tarjeta', 'credito', 'qr', 'transferencia'));


-- 2) TRANSFERENCIA Y MERCADO PAGO SON LO MISMO -------------------------------
--
-- Es la misma plata entrando a la misma cuenta, así que tenerlas separadas
-- partía en dos un renglón del arqueo y del Estado de resultados.
--
-- Las ventas viejas que decían 'transferencia' pasan a decir 'mercadopago'.
-- Nada cambia de monto: solo se juntan en la misma fila de los reportes.
update public.pedidos set pago = 'mercadopago' where pago = 'transferencia';

-- Y la fila de «Transferencia» en Configuración → Medios de Pago se apaga.
-- Se apaga, no se borra: si algún arqueo cerrado la nombra, el detalle de ese
-- arqueo se tiene que seguir pudiendo abrir.
update public.medios_pago
set activo = false
where clave = 'transferencia' or nombre ilike 'transferencia';


-- 3) LAS FOTOS NUEVAS --------------------------------------------------------
--
-- Mismo criterio que la tanda anterior: se cruza por `codigo` y no por nombre,
-- y no se pisa ninguna foto que ya hayas cargado a mano desde el panel.
update public.productos p
set img = f.img
from (values
  ('ex-medallon', 'medallon-extra.jpg'),
  ('papas',       'papas.jpg'),
  ('imp-golden',  'imperial-golden.jpg'),
  ('imp-stout',   'imperial-stout.jpg'),
  ('imp-apa',     'imperial-apa.jpg'),
  ('imp-ipa',     'imperial-ipa.jpg'),
  ('imp-lager',   'imperial-lager.jpg')
) as f(codigo, img)
where p.codigo = f.codigo
  and coalesce(p.img, '') = '';


-- 4) PARA MIRAR QUE QUEDÓ BIEN -----------------------------------------------
-- Formas de cobro: «Transferencia» tiene que figurar en false, el resto en true.
select nombre, clave, activo from public.medios_pago order by activo desc, nombre;

-- Fotos: las siete filas tienen que tener su archivo. Si alguna sale vacía, es
-- que en tu base ese producto tiene otro código: decímelo y lo ajusto.
select codigo, nombre, coalesce(nullif(img, ''), '(SIN FOTO)') as img
from public.productos
where codigo in ('ex-medallon','papas','imp-golden','imp-stout','imp-apa','imp-ipa','imp-lager')
order by codigo;
