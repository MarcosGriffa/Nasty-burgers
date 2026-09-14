-- ---------------------------------------------------------------------------
-- Nasty Burgers — 3 de 3: los datos iniciales
--
-- GENERADO AUTOMÁTICAMENTE desde src/data/semillas.js — no editar a mano.
-- Para regenerarlo:  npm run sql
--
-- Correr DESPUÉS de 1-esquema.sql y 2-columnas.sql, en
-- Supabase > SQL Editor > New query > Run.
--
-- OJO: cada tabla se vacía antes de cargarse. Si ya venís operando y sólo
-- querés actualizar la carta, corré nada más el bloque de productos.
--
-- NO carga pedidos: la base arranca sin ventas, como tiene que ser.
-- ---------------------------------------------------------------------------

-- Categorías de la carta ----------------------------------------------------
delete from public.cat_productos;
insert into public.cat_productos (nombre, area, bajada) values
  ('La Pampera - Burga del Mundial', 'Cocina', 'La burga del mundial'),
  ('Promo Miércoles - Melt 10% OFF', 'Cocina', 'Melt 2.0 con 10% OFF'),
  ('Hamburguesas c/ Papas Fritas', 'Cocina', null),
  ('Papas Fritas', 'Cocina', null),
  ('Extras', 'Cocina', null),
  ('Bebidas', 'Mostrador', null),
  ('Cerveza', 'Mostrador', 'Imperial, línea completa.'),
  ('Promo 4x3 - Simples', 'Mostrador', null),
  ('Burga del Mes', 'Cocina', null),
  ('Promo Día de la Hamburguesa', 'Mostrador', null);

-- Categorías de ingredientes ------------------------------------------------
delete from public.cat_ingredientes;
insert into public.cat_ingredientes (nombre) values
  ('Aderezos'),
  ('Carne'),
  ('Cocinar'),
  ('Medallones Vegetarianos'),
  ('Pan'),
  ('Papas fritas'),
  ('Papelería'),
  ('Pollo'),
  ('Queso'),
  ('Verduras');

-- Ingredientes, con su costo y su stock -------------------------------------
delete from public.ingredientes;
insert into public.ingredientes (nombre, categoria, unidad, costo, stock, stock_minimo) values
  ('Medallón 120 g', 'Carne', 'un.', 1150, 480, 0),
  ('Bolita 120 g Smash', 'Carne', 'un.', 1150, 120, 0),
  ('Medallón de pollo frito', 'Pollo', 'un.', 1400, 40, 0),
  ('Bacon', 'Carne', 'g', 9, 4200, 0),
  ('Bacon bits', 'Carne', 'g', 11, 900, 0),
  ('Cheddar en fetas', 'Queso', 'un.', 320, 900, 0),
  ('Provolone', 'Queso', 'un.', 420, 180, 0),
  ('Cheddar líquido', 'Queso', 'g', 6, 5000, 0),
  ('Roquefort', 'Queso', 'g', 14, 800, 0),
  ('Pan de papa', 'Pan', 'un.', 780, 600, 0),
  ('Papas fritas', 'Papas fritas', 'g', 3, 42000, 0),
  ('Sazonado Nasty', 'Papas fritas', 'g', 22, 2400, 0),
  ('Cebolla en cubitos', 'Verduras', 'g', 2, 3500, 0),
  ('Cebolla morada', 'Verduras', 'g', 3, 2200, 0),
  ('Cebolla crispy', 'Verduras', 'g', 12, 1400, 0),
  ('Cebolla caramelizada', 'Verduras', 'g', 8, 900, 0),
  ('Cebolla smashed', 'Verduras', 'g', 5, 1100, 0),
  ('Lechuga', 'Verduras', 'g', 4, 1800, 0),
  ('Tomate', 'Verduras', 'g', 3, 2600, 0),
  ('Rúcula', 'Verduras', 'g', 9, 400, 0),
  ('Pickles', 'Verduras', 'g', 6, 1500, 0),
  ('Guacamole', 'Aderezos', 'g', 11, 700, 0),
  ('Mayonesa', 'Aderezos', 'g', 3, 6000, 0),
  ('Ketchup', 'Aderezos', 'g', 3, 5200, 0),
  ('Mostaza', 'Aderezos', 'g', 3, 2400, 0),
  ('Salsa mil islas', 'Aderezos', 'g', 5, 2800, 0),
  ('Salsa cheddar', 'Aderezos', 'g', 7, 3100, 0),
  ('Barbacoa', 'Aderezos', 'g', 6, 2600, 0),
  ('Mermelada de bacon', 'Aderezos', 'g', 15, 900, 0),
  ('Salsa criolla especial', 'Aderezos', 'g', 6, 1200, 0),
  ('Aceite Cañuelas', 'Cocinar', 'ml', 2, 18000, 0),
  ('Caja hamburguesa', 'Papelería', 'un.', 210, 800, 0),
  ('Bolsa papas fritas', 'Papelería', 'un.', 95, 900, 0),
  ('Bolsa polietileno', 'Papelería', 'un.', 60, 1200, 0),
  ('Aluminio plateado', 'Papelería', 'm', 40, 300, 0),
  ('Porta papas individual', 'Papelería', 'un.', 85, 700, 0);

-- La carta: precio, descripción, foto y receta ------------------------------
delete from public.productos;
insert into public.productos (codigo, nombre, categoria, subcategoria, area, receta, costo, costo_manual, precio, descripcion, img, destacado, promo, activo, visible_web, permitir_vender_solo, controlar_stock, vender_sin_stock, proveedor, modificadores) values
  ('pampera-simple', 'Pampera Simple', 'La Pampera - Burga del Mundial', null, 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":1,"merma":5,"mostrar_web":true},{"ingrediente":"Provolone","neta":2,"merma":0,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Salsa criolla especial","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 4442, false, 15500, 'Pan de Papa + Medallón de 120 g + Cheddar + Provolone x2 + Bacon + Salsa Criolla Especial + Mayonesa. Con papas fritas.', 'pampera.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('pampera-doble', 'Pampera Doble', 'La Pampera - Burga del Mundial', null, 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":2,"merma":5,"mostrar_web":true},{"ingrediente":"Provolone","neta":4,"merma":0,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Salsa criolla especial","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 6489, false, 17700, 'Pan de Papa + 2 Medallones de 120 g + Cheddar + Provolone x4 + Bacon + Salsa Criolla Especial + Mayonesa. Con papas fritas.', 'pampera.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('pampera-triple', 'Pampera Triple', 'La Pampera - Burga del Mundial', null, 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":3,"merma":5,"mostrar_web":true},{"ingrediente":"Provolone","neta":6,"merma":0,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Salsa criolla especial","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 8537, false, 19900, 'Pan de Papa + 3 Medallones de 120 g + Cheddar + Provolone x6 + Bacon + Salsa Criolla Especial + Mayonesa. Con papas fritas.', 'pampera.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('melt-promo-simple', 'Melt 2.0 Simple', 'Promo Miércoles - Melt 10% OFF', null, 'Cocina', '[]'::jsonb, 3610, true, 13680, 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Salsa Cheddar + Bacon Bits + Mayonesa. Con papas fritas.', 'melt-s.jpg', false, true, true, true, true, false, true, null, '[]'::jsonb),
  ('melt-promo-doble', 'Melt 2.0 Doble', 'Promo Miércoles - Melt 10% OFF', null, 'Cocina', '[]'::jsonb, 3070, true, 15660, 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Salsa Cheddar + Bacon Bits + Mayonesa. Con papas fritas.', 'melt-d.jpg', false, true, true, true, true, false, true, null, '[]'::jsonb),
  ('melt-promo-triple', 'Melt 2.0 Triple', 'Promo Miércoles - Melt 10% OFF', null, 'Cocina', '[]'::jsonb, 3850, true, 17640, 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Salsa Cheddar + Bacon Bits + Mayonesa. Con papas fritas.', 'melt-t.jpg', false, true, true, true, true, false, true, null, '[]'::jsonb),
  ('nasty-s', 'Nasty Simple', 'Hamburguesas c/ Papas Fritas', 'Simple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":1,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":2,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla en cubitos","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Ketchup","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 3565, false, 14850, 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Cebolla Cubos + Mayonesa + Ketchup.', 'nasty-s.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('dirty-s', 'Dirty Simple', 'Hamburguesas c/ Papas Fritas', 'Simple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":1,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":2,"merma":0,"mostrar_web":true},{"ingrediente":"Salsa mil islas","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla morada","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Lechuga","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Tomate","neta":30,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 3750, false, 14950, 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Salsa Mil Islas + Cebolla Morada + Lechuga + Tomate.', 'dirty-s.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('sick-s', 'Sick Simple', 'Hamburguesas c/ Papas Fritas', 'Simple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":1,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":2,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla en cubitos","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Pickles","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Ketchup","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Mostaza","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 3947, false, 14950, 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Cebolla Cubos + Bacon + Pepinos + Ketchup + Mostaza.', 'sick-s.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('critical-s', 'Critical Simple', 'Hamburguesas c/ Papas Fritas', 'Simple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":1,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":2,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla crispy","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Barbacoa","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 4117, false, 15500, 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Cebolla Crispy + Bacon + Salsa BBQ.', 'critical-s.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('gross-s', 'Gross Simple', 'Hamburguesas c/ Papas Fritas', 'Simple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolita 120 g Smash","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":2,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla smashed","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 3548, false, 15100, 'Pan de Papa + Medallón Smash 120 g + Cheddar x2 + Cebolla Smashed + Mayonesa.', 'gross-s.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('muddy-s', 'Muddy Simple', 'Hamburguesas c/ Papas Fritas', 'Simple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":1,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":2,"merma":0,"mostrar_web":true},{"ingrediente":"Mermelada de bacon","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon bits","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 4020, false, 15100, 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Mermelada de Bacon + Bacon Bits + Mayonesa.', 'muddy-s.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('stinky-s', 'Stinky Simple', 'Hamburguesas c/ Papas Fritas', 'Simple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":1,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":2,"merma":0,"mostrar_web":true},{"ingrediente":"Roquefort","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Cebolla caramelizada","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Rúcula","neta":10,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 4412, false, 15200, 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Salsa Roquefort + Bacon + Cebolla Caramelizada + Rúcula + Mayonesa.', 'stinky-s.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('melt-s', 'Melt 2.0 Simple', 'Hamburguesas c/ Papas Fritas', 'Simple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":1,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":2,"merma":0,"mostrar_web":true},{"ingrediente":"Salsa cheddar","neta":30,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon bits","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 3910, false, 15200, 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Salsa Cheddar + Bacon Bits + Mayonesa.', 'melt-s.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('nbc-s', 'NBC Simple', 'Hamburguesas c/ Papas Fritas', 'Simple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón de pollo frito","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":2,"merma":0,"mostrar_web":true},{"ingrediente":"Guacamole","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla morada","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Tomate","neta":30,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 4038, false, 14300, 'Pan de papa + medallón de pollo frito + cheddar x2 + guacamole + cebolla morada + tomate.', 'nbc.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('nasty-d', 'Nasty Doble', 'Hamburguesas c/ Papas Fritas', 'Doble', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":2,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":4,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla en cubitos","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Ketchup","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 5413, false, 17000, 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Cebolla Cubos + Mayonesa + Ketchup.', 'nasty-d.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('dirty-d', 'Dirty Doble', 'Hamburguesas c/ Papas Fritas', 'Doble', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":2,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":4,"merma":0,"mostrar_web":true},{"ingrediente":"Salsa mil islas","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla morada","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Lechuga","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Tomate","neta":30,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 5598, false, 17100, 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Salsa Mil Islas + Cebolla Morada + Lechuga + Tomate.', 'dirty-d.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('sick-d', 'Sick Doble', 'Hamburguesas c/ Papas Fritas', 'Doble', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":2,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":4,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla en cubitos","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Pickles","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Ketchup","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Mostaza","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 5794, false, 17100, 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Cebolla Cubos + Bacon + Pepinos + Ketchup + Mostaza.', 'sick-d.jpg', true, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('critical-d', 'Critical Doble', 'Hamburguesas c/ Papas Fritas', 'Doble', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":2,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":4,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla crispy","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Barbacoa","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 5964, false, 17700, 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Cebolla Crispy + Bacon + Salsa BBQ.', 'critical-d.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('gross-d', 'Gross Doble', 'Hamburguesas c/ Papas Fritas', 'Doble', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolita 120 g Smash","neta":2,"merma":0,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":4,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla smashed","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 5338, false, 17300, 'Pan de Papa + 2 Medallones Smash 120 g + Cheddar x4 + Cebolla Smashed + Mayonesa.', 'gross-d.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('muddy-d', 'Muddy Doble', 'Hamburguesas c/ Papas Fritas', 'Doble', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":2,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":4,"merma":0,"mostrar_web":true},{"ingrediente":"Mermelada de bacon","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon bits","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 5868, false, 17300, 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Mermelada de Bacon + Bacon Bits + Mayonesa.', 'muddy-d.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('stinky-d', 'Stinky Doble', 'Hamburguesas c/ Papas Fritas', 'Doble', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":2,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":4,"merma":0,"mostrar_web":true},{"ingrediente":"Roquefort","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Cebolla caramelizada","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Rúcula","neta":10,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 6259, false, 17400, 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Salsa Roquefort + Bacon + Cebolla Caramelizada + Rúcula + Mayonesa.', 'stinky-d.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('melt-d', 'Melt 2.0 Doble', 'Hamburguesas c/ Papas Fritas', 'Doble', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":2,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":4,"merma":0,"mostrar_web":true},{"ingrediente":"Salsa cheddar","neta":30,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon bits","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 5758, false, 17400, 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Salsa Cheddar + Bacon Bits + Mayonesa.', 'melt-d.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('nasty-t', 'Nasty Triple', 'Hamburguesas c/ Papas Fritas', 'Triple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":3,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":6,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla en cubitos","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Ketchup","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 7260, false, 19200, 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Cebolla Cubos + Mayonesa + Ketchup.', 'nasty-t.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('dirty-t', 'Dirty Triple', 'Hamburguesas c/ Papas Fritas', 'Triple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":3,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":6,"merma":0,"mostrar_web":true},{"ingrediente":"Salsa mil islas","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla morada","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Lechuga","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Tomate","neta":30,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 7445, false, 19400, 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Salsa Mil Islas + Cebolla Morada + Lechuga + Tomate.', 'dirty-t.jpg', true, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('sick-t', 'Sick Triple', 'Hamburguesas c/ Papas Fritas', 'Triple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":3,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":6,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla en cubitos","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Pickles","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Ketchup","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Mostaza","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 7642, false, 19400, 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Cebolla Cubos + Bacon + Pepinos + Ketchup + Mostaza.', 'sick-t.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('critical-t', 'Critical Triple', 'Hamburguesas c/ Papas Fritas', 'Triple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":3,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":6,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla crispy","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Barbacoa","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 7812, false, 19900, 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Cebolla Crispy + Bacon + Salsa BBQ.', 'critical-t.jpg', true, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('gross-t', 'Gross Triple', 'Hamburguesas c/ Papas Fritas', 'Triple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolita 120 g Smash","neta":3,"merma":0,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":6,"merma":0,"mostrar_web":true},{"ingrediente":"Cebolla smashed","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 7128, false, 19500, 'Pan de Papa + 3 Medallones Smash 120 g + Cheddar x6 + Cebolla Smashed + Mayonesa.', 'gross-t.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('muddy-t', 'Muddy Triple', 'Hamburguesas c/ Papas Fritas', 'Triple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":3,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":6,"merma":0,"mostrar_web":true},{"ingrediente":"Mermelada de bacon","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon bits","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 7715, false, 19500, 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Mermelada de Bacon + Bacon Bits + Mayonesa.', 'muddy-t.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('stinky-t', 'Stinky Triple', 'Hamburguesas c/ Papas Fritas', 'Triple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":3,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":6,"merma":0,"mostrar_web":true},{"ingrediente":"Roquefort","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon","neta":30,"merma":8,"mostrar_web":true},{"ingrediente":"Cebolla caramelizada","neta":25,"merma":0,"mostrar_web":true},{"ingrediente":"Rúcula","neta":10,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 8107, false, 19600, 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Salsa Roquefort + Bacon + Cebolla Caramelizada + Rúcula + Mayonesa.', 'stinky-t.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('melt-t', 'Melt 2.0 Triple', 'Hamburguesas c/ Papas Fritas', 'Triple', 'Cocina', '[{"ingrediente":"Pan de papa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Medallón 120 g","neta":3,"merma":5,"mostrar_web":true},{"ingrediente":"Cheddar en fetas","neta":6,"merma":0,"mostrar_web":true},{"ingrediente":"Salsa cheddar","neta":30,"merma":0,"mostrar_web":true},{"ingrediente":"Bacon bits","neta":20,"merma":0,"mostrar_web":true},{"ingrediente":"Mayonesa","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Papas fritas","neta":150,"merma":5,"mostrar_web":true},{"ingrediente":"Aceite Cañuelas","neta":15,"merma":0,"mostrar_web":true},{"ingrediente":"Caja hamburguesa","neta":1,"merma":0,"mostrar_web":true},{"ingrediente":"Bolsa papas fritas","neta":1,"merma":0,"mostrar_web":true}]'::jsonb, 7605, false, 19600, 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Salsa Cheddar + Bacon Bits + Mayonesa.', 'melt-t.jpg', false, false, true, true, true, true, true, null, '["Papas","Punto de la carne","Extras","Sin qué"]'::jsonb),
  ('papas', 'Porción de papas fritas', 'Papas Fritas', null, 'Cocina', '[]'::jsonb, 1280, true, 4200, 'Con nuestro sazonado.', 'papas.jpg', false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('ex-bacon', 'Extra bacon', 'Extras', null, 'Cocina', '[]'::jsonb, 330, true, 1500, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('ex-cheddar', 'Extra cheddar en fetas x2', 'Extras', null, 'Cocina', '[]'::jsonb, 350, true, 1500, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('ex-medallon', 'Medallón extra + cheddar', 'Extras', null, 'Cocina', '[]'::jsonb, 1090, true, 4700, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('cheeseburger', 'CheeseBurger', 'Extras', null, 'Cocina', '[]'::jsonb, 3170, true, 10300, 'Sumá una hamburguesa con queso.', null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('cheeseburger-papas', 'CheeseBurger c/ papas', 'Extras', null, 'Cocina', '[]'::jsonb, 3270, true, 11500, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('agua', 'Agua mineral 500 ml', 'Bebidas', null, 'Mostrador', '[]'::jsonb, 380, true, 2000, 'Villavicencio.', null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('coca', 'Coca-Cola 500 ml', 'Bebidas', null, 'Mostrador', '[]'::jsonb, 1020, true, 3500, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('coca-zero', 'Coca-Cola Zero 500 ml', 'Bebidas', null, 'Mostrador', '[]'::jsonb, 820, true, 3500, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('sprite', 'Sprite 500 ml', 'Bebidas', null, 'Mostrador', '[]'::jsonb, 760, true, 3500, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('imp-golden', 'Imperial Golden', 'Cerveza', null, 'Mostrador', '[]'::jsonb, 690, true, 3000, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('imp-stout', 'Imperial Cream Stout', 'Cerveza', null, 'Mostrador', '[]'::jsonb, 650, true, 3000, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('imp-apa', 'Imperial APA', 'Cerveza', null, 'Mostrador', '[]'::jsonb, 740, true, 3000, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('imp-ipa', 'Imperial IPA', 'Cerveza', null, 'Mostrador', '[]'::jsonb, 610, true, 3000, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb),
  ('imp-lager', 'Imperial Extra Lager', 'Cerveza', null, 'Mostrador', '[]'::jsonb, 700, true, 3000, null, null, false, false, true, true, true, false, true, null, '[]'::jsonb);

-- Grupos modificadores ------------------------------------------------------
delete from public.grupos_modificadores;
insert into public.grupos_modificadores (nombre, bajada, minimo, maximo, opciones) values
  ('Papas', 'Todas las burgas vienen con papas. Elegí cómo las querés.', 1, 1, '[{"nombre":"Papas normales","precio":0},{"nombre":"Papas sazonadas","precio":0,"ingrediente":"Sazonado Nasty","cantidad":8}]'::jsonb),
  ('Punto de la carne', 'Por defecto va a punto.', 0, 1, '[{"nombre":"A punto","precio":0},{"nombre":"Bien cocida","precio":0}]'::jsonb),
  ('Extras', 'Para el que quiere más.', 0, 4, '[{"nombre":"Bacon","precio":1500,"ingrediente":"Bacon","cantidad":30},{"nombre":"Cheddar x2","precio":1500,"ingrediente":"Cheddar en fetas","cantidad":2},{"nombre":"Medallón + cheddar","precio":4700,"ingrediente":"Medallón 120 g","cantidad":1},{"nombre":"Cebolla crispy","precio":1200,"ingrediente":"Cebolla crispy","cantidad":20}]'::jsonb),
  ('Sin qué', 'Lo que no quiere el cliente.', 0, 5, '[{"nombre":"Sin cebolla","precio":0},{"nombre":"Sin pepinillos","precio":0},{"nombre":"Sin tomate","precio":0},{"nombre":"Sin mayonesa","precio":0},{"nombre":"Sin ketchup","precio":0}]'::jsonb);

-- Proveedores ---------------------------------------------------------------
delete from public.proveedores;
insert into public.proveedores (nombre, email, telefono, direccion, saldo) values
  ('Agua Ivess', null, null, null, 0),
  ('Bebidas Garin', null, null, 'Colectora Oeste 1890', 0),
  ('Carne Colo', null, null, null, 0),
  ('Carnes Camfa', null, '1132456479', 'Dr. Ricardo Balbín 1203', 0),
  ('Distribuidora HUSA Cajas', null, '011 4489-1373', 'Av. Estanislao Zeballos 2682', 0),
  ('Distribuidora Marmol', null, '11 3888-1190', null, 0),
  ('Edenor', null, null, null, 0),
  ('Gas Caracciolo', null, null, 'Av. Gral. Juan Domingo Perón 5649', 0),
  ('Inmobiliaria Puricelli', null, '011 4935-7588', 'Av. Alvear 2819', 0),
  ('Movistar', null, null, null, 0),
  ('Papelera Coda', null, null, 'Hipólito Yrigoyen 538', 0),
  ('Porta Papas Individuales', null, null, null, 0),
  ('The burger pan', null, null, null, 0),
  ('Verdulería Rosa', null, null, 'Av. Alvear 3050', 0);

-- Categorías de gastos ------------------------------------------------------
delete from public.cat_gastos;
insert into public.cat_gastos (nombre, financiera, activo) values
  ('Gastos Generales', null, true),
  ('Proveedores', null, true),
  ('Sueldos', null, true);

-- Descuentos ----------------------------------------------------------------
delete from public.descuentos;
insert into public.descuentos (nombre, tipo, valor, activo) values
  ('Pago en efectivo', 'Porcentaje', 10, true),
  ('Sin motivo', 'Monto', 0, true),
  ('Empleados', 'Porcentaje', 50, true),
  ('Clientes', 'Porcentaje', 15, true);

-- Medios de pago ------------------------------------------------------------
delete from public.medios_pago;
insert into public.medios_pago (nombre, tipo, comision, activo) values
  ('Efectivo', 'Efectivo', 0, true),
  ('Mercado Pago', 'Online', 3.5, true),
  ('Transferencia', 'Bancario', 0, true),
  ('Tarjeta Débito', 'Tarjeta', 1.8, true),
  ('Tarjeta Crédito', 'Tarjeta', 3.2, true);

-- Cajas ---------------------------------------------------------------------
delete from public.cajas;
insert into public.cajas (nombre, activa) values
  ('Principal', true);

-- Cuentas -------------------------------------------------------------------
delete from public.cuentas_bancarias;
insert into public.cuentas_bancarias (nombre, banco, numero, saldo) values
  ('Caja física', null, null, 0);

-- Usuarios del panel --------------------------------------------------------
delete from public.usuarios;
insert into public.usuarios (nombre, email, rol, activo) values
  ('nastyburger', 'nastyburgersbenavidez@gmail.com', 'Administrador', true),
  ('Ramiro', null, 'Cajero', true),
  ('Manu', null, 'Cocina', true),
  ('Fede', null, 'Cocina', true),
  ('Juanma', null, 'Cocina', true);

-- Roles ---------------------------------------------------------------------
delete from public.roles;
insert into public.roles (nombre, permisos) values
  ('Administrador', 'Todo'),
  ('Cajero', 'Ventas, caja, comandas'),
  ('Cocina', 'Comandas');

-- Turnos --------------------------------------------------------------------
delete from public.turnos;
insert into public.turnos (nombre, desde, hasta, activo) values
  ('Noche', '19:30', '23:00', true);

-- Áreas de impresión --------------------------------------------------------
delete from public.areas_impresion;
insert into public.areas_impresion (nombre, impresora, copias) values
  ('Cocina', 'Térmica cocina', 1),
  ('Mostrador', 'Térmica mostrador', 1);

-- Impresoras ----------------------------------------------------------------
delete from public.impresoras;
insert into public.impresoras (nombre, ancho, tipo, activa) values
  ('Térmica cocina', '80mm', 'Navegador', true),
  ('Térmica mostrador', '80mm', 'Navegador', true);

-- Listas de precios ---------------------------------------------------------
delete from public.listas_precios;
insert into public.listas_precios (nombre, ajuste, tipo, activa) values
  ('$2.000 menos', -2000, 'Monto', true);

-- Menús ---------------------------------------------------------------------
delete from public.menus;
insert into public.menus (nombre, canal, productos, estado) values
  ('Menu Tienda Online', 'Tienda Online', 46, 'Publicado');

-- Zonas de envío ------------------------------------------------------------
delete from public.zonas_envio;
insert into public.zonas_envio (zona, hasta_km, costo) values
  ('Benavídez centro', 3, 1500),
  ('Benavídez resto', 6, 2500),
  ('Nordelta / Garín', 10, 3800);

-- Ajustes del local ---------------------------------------------------------
delete from public.ajustes;
insert into public.ajustes (clave, tienda_activa, telefono, whatsapp, email, direccion, horario, instagram, facebook, monto_minimo_activo, monto_minimo, ocultar_sin_stock, alertas_sonoras, imprimir_al_aceptar, imprimir_ticket_al_entregar, rechazar_sin_stock, copias_cocina, ancho_papel, py_activo, py_codigo, py_comision, py_auto_aceptar, py_sonido, horarios) values
  ('general', true, '541140940880', '541140940880', 'nastyburgersbenavidez@gmail.com', 'Av. Alvear 3041', '19:30 - 23:00', 'https://instagram.com/nastyburgersarg', null, false, 0, true, true, true, false, false, 1, '80mm', false, '468828', 0, false, true, '[{"dia":"Lun","delivery":false,"retiro":false,"desde":"19:30","hasta":"23:00"},{"dia":"Mar","delivery":false,"retiro":false,"desde":"19:30","hasta":"23:00"},{"dia":"Mié","delivery":true,"retiro":true,"desde":"19:30","hasta":"23:00"},{"dia":"Jue","delivery":true,"retiro":true,"desde":"19:30","hasta":"23:00"},{"dia":"Vie","delivery":true,"retiro":true,"desde":"19:30","hasta":"23:00"},{"dia":"Sáb","delivery":true,"retiro":true,"desde":"19:30","hasta":"23:00"},{"dia":"Dom","delivery":true,"retiro":true,"desde":"19:30","hasta":"23:00"}]'::jsonb);
