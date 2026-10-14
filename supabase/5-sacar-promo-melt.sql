-- ---------------------------------------------------------------------------
-- Saca la categoría «Promo Miércoles - Melt 10% OFF» y sus tres productos.
--
-- Por qué: esa promo estaba hecha a mano, como tres «Melt 2.0» duplicados con
-- el 10 % ya descontado en el precio. Problemas: se veía los siete días de la
-- semana, el mismo producto aparecía dos veces en la carta, y la promo real
-- del local es otra (miércoles, $2.000 menos en toda hamburguesa con papas).
--
-- Ahora la promo la calcula el sistema según el día, sobre la carta de verdad.
-- Estos tres productos ya no van.
--
-- Los «Melt 2.0 Simple / Doble / Triple» de siempre NO se tocan: solo se
-- borran los de la categoría de promo, que son los duplicados.
--
-- Se puede correr dos veces sin romper nada.
--
-- Dónde: Supabase → SQL Editor → New query → pegar todo → Run.
-- ---------------------------------------------------------------------------

-- 1) Los tres productos duplicados, por código (no por nombre: los nombres se
--    repiten con los Melt de la carta normal, y borrar por nombre se llevaría
--    puestos los buenos).
delete from public.productos
where codigo in ('melt-promo-simple', 'melt-promo-doble', 'melt-promo-triple');

-- 2) La categoría vacía.
delete from public.cat_productos
where nombre = 'Promo Miércoles - Melt 10% OFF';

-- 3) Para mirar que quedó bien: tienen que quedar los 3 Melt de siempre y
--    ninguna fila de promo.
-- select codigo, nombre, categoria, precio from public.productos
--   where nombre ilike 'Melt%' order by codigo;
-- select * from public.cat_productos where nombre ilike '%Promo%';
