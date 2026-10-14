-- ---------------------------------------------------------------------------
-- Saca el grupo de opciones «Sin qué» de la base que ya está andando.
--
-- Por qué: era una sola lista pegada igual a todas las hamburguesas, así que
-- la Critical —que lleva pan de papa, medallón, cheddar, cebolla crispy, bacon
-- y salsa BBQ— ofrecía sacarle pepinillos, tomate, mayonesa y ketchup, que no
-- lleva. Decisión de Marcos (14/10): se saca del todo. El cliente que quiera
-- sacar algo lo escribe en la nota del pedido, que ya llega a la comanda.
--
-- Este archivo es para la base que YA tiene datos. No reemplaza a 3-datos.sql
-- ni borra nada más: solo desengancha el grupo de los productos y lo elimina.
-- Se puede correr dos veces sin romper nada.
--
-- Dónde: Supabase → SQL Editor → New query → pegar todo → Run.
-- ---------------------------------------------------------------------------

-- 1) Desenganchar el grupo de todos los productos que lo tengan en su lista.
--    `modificadores` es un array de nombres; se le saca ese elemento y se deja
--    el resto como estaba (Papas, Punto de la carne, Extras).
update public.productos
set modificadores = (
  select coalesce(jsonb_agg(valor), '[]'::jsonb)
  from jsonb_array_elements(modificadores) as valor
  where valor <> '"Sin qué"'::jsonb
)
where modificadores @> '["Sin qué"]'::jsonb;

-- 2) Borrar el grupo.
delete from public.grupos_modificadores where nombre = 'Sin qué';

-- 3) Para mirar que quedó bien: ninguna de las dos consultas tiene que devolver
--    filas.
-- select nombre, modificadores from public.productos
--   where modificadores @> '["Sin qué"]'::jsonb;
-- select * from public.grupos_modificadores where nombre = 'Sin qué';
