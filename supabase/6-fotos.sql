-- ---------------------------------------------------------------------------
-- Le pone la foto a los ocho productos que mostraban el placeholder amarillo.
--
-- Por qué hace falta: las imágenes viajan adentro del archivo HTML, pero QUÉ
-- foto le toca a cada producto es un dato de la base (`productos.img`). El
-- local ya tiene sus productos cargados con ese campo vacío, así que por más
-- que la foto esté en el archivo, nadie le dice que la use.
--
-- Se cruza por `codigo`, nunca por nombre: si mañana el local renombra
-- «Coca-Cola 500 ml», esto tiene que seguir funcionando igual.
--
-- Se puede correr dos veces sin romper nada. No pisa fotos ya cargadas a mano
-- desde el panel: solo toca las que están vacías.
--
-- Dónde: Supabase → SQL Editor → New query → pegar todo → Run.
-- ---------------------------------------------------------------------------

update public.productos p
set img = f.img
from (values
  ('agua',               'agua.jpg'),
  ('coca',               'coca.jpg'),
  ('coca-zero',          'coca-zero.jpg'),
  ('sprite',             'sprite.jpg'),
  ('ex-bacon',           'extra-bacon.jpg'),
  ('ex-cheddar',         'extra-cheddar.jpg'),
  ('cheeseburger',       'cheeseburger.jpg'),
  ('cheeseburger-papas', 'cheeseburger.jpg')
) as f(codigo, img)
where p.codigo = f.codigo
  and coalesce(p.img, '') = '';

-- Para mirar que quedó bien: las ocho filas tienen que tener su archivo.
-- select codigo, nombre, img from public.productos
--   where codigo in ('agua','coca','coca-zero','sprite','ex-bacon','ex-cheddar',
--                    'cheeseburger','cheeseburger-papas')
--   order by codigo;
