-- ---------------------------------------------------------------------------
-- Deja la base de prueba como está la del local HOY, antes de la migración.
--
-- Hace falta porque 3-datos.sql ya se actualizó y no siembra más
-- «Transferencia»: sin esto, el 10-pagos-y-fotos.sql se probaría contra una
-- base que no tiene el problema que viene a arreglar, que es no probar nada.
--
-- Agrega: la forma de cobro vieja, un pedido pagado con transferencia, y los
-- siete productos sin foto.
-- ---------------------------------------------------------------------------

insert into public.medios_pago (nombre, tipo, clave, comision, activo)
values ('Transferencia', 'Bancario', 'transferencia', 0, true);

insert into public.pedidos (local, modalidad, cliente_nombre, cliente_telefono, items, subtotal, total, pago)
values ('benavidez', 'retiro', 'Venta vieja', '1100000000', '[]'::jsonb, 10000, 10000, 'transferencia');

-- Los siete productos ya existen (los siembra 3-datos.sql); lo que les falta
-- es la foto, igual que en la base del local.
update public.productos set img = ''
where codigo in ('ex-medallon','papas','imp-golden','imp-stout','imp-apa','imp-ipa','imp-lager');
