-- ---------------------------------------------------------------------------
-- ¿QUÉ SQL YA CORRÍ Y CUÁL ME FALTA?
--
-- Esto no cambia nada: solo mira y contesta. Pegalo entero en
-- Supabase → SQL Editor → New query → Run y leé la columna `estado`.
--
-- Cada fila dice un archivo. Si todas dicen HECHO, no tenés que correr nada.
-- ---------------------------------------------------------------------------

with chequeos as (

  select '4-sacar-sin-que.sql' as archivo, 1 as orden,
         not exists (select 1 from public.grupos_modificadores where nombre = 'Sin qué')
           as listo,
         'el grupo «Sin qué» ya no está' as que_mira

  union all
  select '5-sacar-promo-melt.sql', 2,
         not exists (
           select 1 from public.productos
           where codigo in ('melt-promo-simple', 'melt-promo-doble', 'melt-promo-triple')
         ),
         'los 3 Melt duplicados ya no están'

  union all
  select '6-fotos.sql', 3,
         not exists (
           select 1 from public.productos
           where codigo in ('agua','coca','coca-zero','sprite','ex-bacon',
                            'ex-cheddar','cheeseburger','cheeseburger-papas')
             and coalesce(img, '') = ''
         ),
         'los 8 productos tienen foto'

  union all
  select '7-arqueo.sql (columnas)', 4,
         (select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'arqueos'
             and column_name in ('monto_inicial','cerrado_por','declarado')) = 3
         and
         (select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'medios_pago'
             and column_name in ('origen','fuera_de_caja')) = 2,
         'las columnas nuevas de arqueos y medios_pago'

  union all
  select '7-arqueo.sql (formas de cobro)', 5,
         exists (select 1 from public.medios_pago where clave = 'qr')
         and exists (select 1 from public.medios_pago where origen = 'Pedidos Ya'),
         'Mercado Pago QR y Online Pedidos Ya'

  union all
  select '8-tarjeta-credito.sql', 6,
         exists (select 1 from public.medios_pago where clave = 'credito'),
         'Tarj. Crédito como medio aparte'
)

select
  archivo,
  case when listo then '✅ HECHO' else '❌ FALTA CORRERLO' end as estado,
  que_mira
from chequeos
order by orden;

-- ---------------------------------------------------------------------------
-- Y para ver las formas de cobro como quedaron:
--
-- select nombre, clave, origen, fuera_de_caja, comision, activo
--   from public.medios_pago order by nombre;
--
-- Tienen que estar las siete: Efectivo, Mercado Pago, Mercado Pago QR,
-- Online Pedidos Ya, Tarj. Crédito, Tarj. Débito y Transferencia.
-- ---------------------------------------------------------------------------
