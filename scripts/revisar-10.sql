-- ---------------------------------------------------------------------------
-- Las preguntas que tiene que contestar bien el 10-pagos-y-fotos.sql.
-- Cada fila imprime OK o MAL. Si hay un solo MAL, el SQL no se manda.
-- ---------------------------------------------------------------------------

-- A) La venta por QR ahora entra. Antes la rechazaba el candado de `pedidos`.
insert into public.pedidos (local, modalidad, cliente_nombre, cliente_telefono, items, subtotal, total, pago)
values ('benavidez', 'retiro', 'Prueba QR', '1100000000', '[]'::jsonb, 5000, 5000, 'qr');

-- B) Y la de tarjeta de crédito también.
insert into public.pedidos (local, modalidad, cliente_nombre, cliente_telefono, items, subtotal, total, pago)
values ('benavidez', 'retiro', 'Prueba credito', '1100000000', '[]'::jsonb, 6000, 6000, 'credito');

-- C) Una forma de cobro inventada tiene que seguir rebotando: el candado se
--    amplía, no se saca.
do $$
begin
  insert into public.pedidos (local, modalidad, cliente_nombre, cliente_telefono, items, subtotal, total, pago)
  values ('benavidez', 'retiro', 'Prueba trucha', '1100000000', '[]'::jsonb, 1, 1, 'bitcoin');
  raise exception 'MAL: entro un pago inventado';
exception when check_violation then
  raise notice 'OK  · el candado sigue rechazando formas de pago inventadas';
end $$;

select case when count(*) = 0 then 'OK  · no quedo ninguna venta diciendo transferencia'
            else 'MAL · quedaron ' || count(*) || ' ventas en transferencia' end
from public.pedidos where pago = 'transferencia';

select case when count(*) = 1 then 'OK  · la venta vieja paso a mercadopago'
            else 'MAL · la venta vieja no se migro' end
from public.pedidos where cliente_nombre = 'Venta vieja' and pago = 'mercadopago';

select case when bool_and(activo = false) then 'OK  · Transferencia quedo apagada, no borrada'
            else 'MAL · Transferencia sigue activa' end
from public.medios_pago where clave = 'transferencia';

select case when count(*) = 1 then 'OK  · quedo una sola forma de cobro activa para Mercado Pago'
            else 'MAL · hay ' || count(*) || ' activas para Mercado Pago' end
from public.medios_pago where clave = 'mercadopago' and activo;

select case when count(*) = 7 then 'OK  · las siete fotos quedaron cargadas'
            else 'MAL · solo ' || count(*) || ' de 7 productos tienen foto' end
from public.productos
where codigo in ('ex-medallon','papas','imp-golden','imp-stout','imp-apa','imp-ipa','imp-lager')
  and coalesce(img, '') <> '';

select case when count(*) = 2 then 'OK  · entraron las ventas por QR y por credito'
            else 'MAL · solo entraron ' || count(*) || ' de 2 (QR / credito)' end
from public.pedidos where pago in ('qr', 'credito');
