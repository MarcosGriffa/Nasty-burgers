-- ---------------------------------------------------------------------------
-- ¿QUÉ SQL YA CORRÍ Y CUÁL ME FALTA?
--
-- Esto no cambia nada: solo mira y contesta. Pegalo entero en
-- Supabase → SQL Editor → New query → Run y leé la columna `estado`.
--
-- Cada fila dice un archivo. Si todas dicen HECHO, no tenés que correr nada.
--
-- NOTA PARA EL QUE LO LEA MAÑANA: las columnas que agregan los otros archivos
-- (`origen`, `fuera_de_caja`) NO se nombran directo. Postgres revisa que todas
-- las columnas existan ANTES de ejecutar, así que una consulta que las nombre
-- revienta justo en el caso que esto viene a detectar: que todavía no estén.
-- Por eso se leen con `to_jsonb(fila) ->> 'columna'`, que devuelve null si la
-- columna no existe en vez de romper.
-- ---------------------------------------------------------------------------

with
-- Qué columnas hay, para no tener que adivinar.
cols as (
  select table_name, column_name
  from information_schema.columns
  where table_schema = 'public'
),

chequeos as (

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
  select '7-arqueo.sql — columnas', 4,
         (select count(*) from cols
           where table_name = 'arqueos'
             and column_name in ('monto_inicial','cerrado_por','declarado')) = 3
         and
         (select count(*) from cols
           where table_name = 'medios_pago'
             and column_name in ('origen','fuera_de_caja')) = 2,
         'arqueos: monto_inicial, cerrado_por, declarado · medios_pago: origen, fuera_de_caja'

  union all
  select '7-arqueo.sql — formas de cobro', 5,
         exists (select 1 from public.medios_pago where clave = 'qr')
         and exists (
           -- `origen` se lee por json: si la columna todavía no existe, esto da
           -- null y la fila sale como FALTA, que es lo correcto.
           select 1 from public.medios_pago m
           where to_jsonb(m) ->> 'origen' = 'Pedidos Ya'
         ),
         'Mercado Pago QR (clave qr) y Online Pedidos Ya (por origen)'

  union all
  select '8-tarjeta-credito.sql', 6,
         exists (select 1 from public.medios_pago where clave = 'credito'),
         'Tarj. Crédito como forma de cobro aparte'
)

select
  archivo,
  case when listo then '✅ HECHO' else '❌ FALTA CORRERLO' end as estado,
  que_mira
from chequeos
order by orden;
