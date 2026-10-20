-- ---------------------------------------------------------------------------
-- Separa la tarjeta en débito y crédito.
--
-- Marcos las cuenta por separado al cerrar la caja, así que son dos formas de
-- cobro distintas y no una.
--
-- El débito se queda con la clave `tarjeta` —y no pasa a `debito`— a propósito:
-- todos los pedidos ya guardados dicen 'tarjeta' en la forma de pago, y
-- cambiarla dejaría esas ventas sin medio asignado, que es justo el agujero que
-- se tapó en T1.8.
--
-- El 0 % de arancel sale de la decisión D6: al local no le cobran por tarjeta.
--
-- Se puede correr dos veces sin romper nada.
--
-- Dónde: Supabase → SQL Editor → New query → pegar todo → Run.
-- ---------------------------------------------------------------------------

insert into public.medios_pago (nombre, tipo, clave, comision, activo)
select 'Tarj. Crédito', 'Tarjeta', 'credito', 0, true
where not exists (
  select 1 from public.medios_pago where nombre = 'Tarj. Crédito' or clave = 'credito'
);

-- Para mirar que quedó bien: tienen que aparecer las dos tarjetas.
-- select nombre, clave, comision, activo from public.medios_pago
--   where tipo = 'Tarjeta' order by nombre;
