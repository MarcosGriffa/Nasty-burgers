# Nasty Burgers — web + sistema del local

Dos cosas en un mismo proyecto:

- **La web pública** (`/`): landing con scroll cinematográfico y pedidos online.
- **El sistema del local** (`/#/panel`): la misma estructura de módulos que Fudo,
  con la estética de Nasty.

React 19 + Vite + Tailwind v4 + Supabase. Sin dependencias de gráficos ni de UI.

---

## Arrancar

```bash
npm install
npm run dev          # http://localhost:5173        (web)
                     # http://localhost:5173/#/panel (sistema)
```

Sin configurar nada arranca en **modo demo**: los datos viven en el navegador y se
sincronizan entre pestañas del mismo equipo. Incluye ~2 meses de ventas de ejemplo
para que los reportes tengan de dónde agarrarse. Para operar de verdad hay que
conectar Supabase (abajo).

## Buildear

```bash
npm run build          # -> dist/                  (Vercel / Netlify)
npm run build:single   # -> dist-single/index.html (un archivo, sin internet)
npm run build:panel    # -> dist-single/index.html arrancando en el panel
```

---

## Los módulos del sistema

La barra de arriba tiene los mismos módulos que Fudo, salvo Mesas, Mostrador
express y Reservas (el local no los usa).

| Módulo | Qué hace |
|---|---|
| **Ventas** | Delivery (Pendientes → En preparación → Listo → Enviados → Entregados) y Mostrador. Aceptar con demora, avisar por WhatsApp, imprimir comanda, control de efectivo. Alta manual de pedidos. |
| **Estadísticas** | Ventas, movimientos de caja, arqueos con conciliación, descuentos. |
| **Gastos** | Gastos y categorías, con estado de pago y total del período. |
| **Finanzas** | Cuentas a cobrar, estado de resultados, cuentas bancarias, flujo de caja. |
| **Productos** | Productos, ingredientes, grupos modificadores, categorías, fichas técnicas, stock, conteo de inventario, listas de precios, menús. |
| **Clientes** | Se arma solo con los pedidos: compras, total gastado, ticket promedio y si el cliente está dormido. |
| **Proveedores** | Alta, baja y modificación con saldo. |
| **Reportes** | Ventas por día/hora/día de semana, ranking y rentabilidad de productos, stock, gastos y balance. Todo calculado sobre los pedidos reales. |
| **Tu Delivery** | Estado de la tienda, horarios por día, costos de envío por zona, configuración de contacto. |
| **Asistente IA** | Preguntarle al sistema cómo va el negocio, y pedirle cambios de precios y promos en castellano. |
| **Configuración** | Impresoras, áreas de impresión, opciones de impresión, cajas, medios de pago, Delivery Apps, **la clave de la IA**, usuarios, roles y turnos. |

Todas las pantallas de ABM comparten el mismo motor (`src/panel/pantallas/Crud.jsx`):
buscar, ordenar por cualquier columna, agrupar, alta, edición, borrado con confirmación
y exportar a CSV. Productos es la excepción: usa el editor completo de abajo.

---

## Los dos locales

El cliente elige **Benavídez o Escobar en el carrito**, antes de confirmar, y el
pedido va a una sola pantalla: la del local que eligió. El empleado entra al
sistema con la cuenta de su local y ve solo lo suyo.

| | Benavídez | Escobar |
|---|---|---|
| Cuenta | `benavidez@nastyburgers.com` | `escobar@nastyburgers.com` |
| `id` en el código | `benavidez` | `escobar` |

Los mails y los datos de cada local están en `LOCALES`, en `src/data/negocio.js`.
En modo demo la pantalla de login funciona igual (con cualquier contraseña), así
se puede probar el circuito completo sin Supabase.

---

## El cliente no manda nada por WhatsApp

La web no abre WhatsApp en ningún momento: el cliente confirma y ve un cartel de
«recibimos tu pedido #N». El **único** WhatsApp que sale es el del empleado
cuando acepta la comanda y elige la demora, y ese lo manda él desde su teléfono.

El mensaje se arma en `MENSAJES.aceptado` (`src/data/negocio.js`) y sigue el
formato de Fudo:

```
Hola Marcos Griffa, confirmamos tu pedido #27927 ✅
📦 Tipo de entrega: Retiro en el local
⏰ Tiempo estimado: 20 minutos
* Productos: $19.400,00
* Total: $19.400,00
¡Gracias por tu compra!
Nasty Burgers - Local Benavídez
```

Las líneas de **Descuentos** y **Costo de envío** aparecen solo si el pedido las
tiene; en delivery, la primera línea es la dirección de entrega con 🛵.

---

## El panel es el backend de la web

No son dos cosas separadas. **La carta que ve el cliente sale de la misma tabla de
productos que edita el empleado** (`src/lib/menu.js`). Si en el panel se agrega una
hamburguesa, aparece en la web; si se le cambia el precio, la receta, la foto o la
categoría, cambia en la web. Si se destilda «Visible en la web», desaparece de la
carta pero se sigue pudiendo cargar desde el mostrador.

### El editor de productos

Al hacer clic en cualquier producto se abre la pantalla completa, con la misma
información que Fudo:

**Izquierda** — nombre, categoría, sub-categoría (Simple / Doble / Triple, que es lo
que arma las secciones de la carta), precio, código, área de impresión y costo.
Debajo: activo, visible en la web, destacado en la home, promo; la descripción y la
foto que ve el cliente; y el control de stock.

**Derecha** — la **receta**: cada ingrediente con cantidad neta, merma %, cantidad
bruta y costo, y el total abajo. Más los grupos modificadores y una **vista previa de
cómo va a quedar la card en la web**.

Tres cosas salen solas de la receta:

1. **El costo del producto.** El campo Costo se calcula con el precio actual de cada
   ingrediente y su merma. Se puede pasar a mano con el botón «A mano».
2. **La descripción para el cliente.** Si la descripción está vacía, la web muestra
   los ingredientes de la receta: *"Pan de papa + Medallón 120 g x2 + Cheddar en fetas
   x4 + Cebolla crispy + Bacon + Barbacoa + Papas fritas."* Los envases y el aceite no
   se muestran (se filtran por categoría de ingrediente), y cada línea tiene un tilde
   «Web» por si se quiere ocultar alguno más.
3. **El descuento de stock.** Al aceptar un pedido, cada ingrediente de la receta se
   descuenta del stock, aplicando la merma. De ahí salen los «días restantes» de la
   pantalla de Stock.

Las recetas ya vienen cargadas con la carta real que pasó el local: medallón,
cheddar, toppings, pan, papas y envases, con la merma de la carne (5%) y el
bacon (8%). El cheddar en fetas va **x2 en la simple, x4 en la doble y x6 en la
triple**, y La Pampera lleva provolone x2 / x4 / x6 más una feta de cheddar.

Las descripciones que ve el cliente son las de la carta, escritas a mano en
`src/data/negocio.js`. Coinciden con la receta, así que el botón «Generar desde
la receta» del editor da lo mismo con otro formato.

> **Ojo con los costos.** Los precios de los ingredientes que vienen cargados son
> estimados, puestos para que el sistema tuviera de dónde calcular. Las recetas
> ahora son las de verdad, así que el CMV y el margen recién van a ser reales
> cuando se carguen los costos de compra en **Productos → Ingredientes**.

---

## La IA del sistema

Es un módulo propio en la barra de arriba (el ícono de la chispa), con dos
solapas.

### Preguntar

El dueño escribe **«¿cómo venimos esta semana?»**, **«¿qué burga deja más
plata?»**, **«¿qué ingrediente se me está por acabar?»** y le contesta con los
números reales del local, en dos o tres frases.

Antes de preguntar, el sistema arma un resumen con lo que ya calcula solo
(`src/lib/contexto.js`): ventas de 7 y 30 días, CMV, márgenes, ranking de
productos, a qué hora y qué día se vende, medios de pago, stock crítico y la
carta con costos. Son unos 1.900 tokens de contexto.

**Qué NO se manda.** Ni un nombre, ni un teléfono, ni un mail, ni una dirección
de cliente. De los clientes van solo agregados: cuántos son, cuántos repiten y
cuánto gastan en promedio. Los datos personales de la gente del barrio no tienen
por qué llegar a un servidor de Google.

En este modo la IA **solo lee**: no hay ninguna operación de escritura en el
camino.

### Cambiar precios

El encargado escribe **"subí todas las hamburguesas un 10%"** o **"las gaseosas
2000 pesos menos"** y el sistema le muestra la tabla de antes/después de cada
producto. Recién cuando confirma, se escribe. Todo cambio queda en el historial
con un botón **Deshacer**.

Funciona en dos niveles:

1. **Sin IA (por defecto, gratis, sin internet).** Un parser propio
   (`src/lib/asistente.js`) resuelve las frases habituales: porcentajes, montos
   fijos, precios exactos, y los alcances "hamburguesas / gaseosas / cervezas /
   papas / simples / dobles / triples / toda la carta / un producto por su
   nombre".
2. **Con IA.** Si la frase es más rebuscada, se le pregunta a Gemini Flash-Lite.
   El modelo **no toca la base**: devuelve un plan con forma fija (`operacion`,
   `alcance`, `valor`, `redondeo`) que el sistema valida contra una lista blanca
   de cinco operaciones y después simula. Si el modelo devolviera cualquier otra
   cosa, el plan se descarta.

### Por qué no puede romper nada

- En el esquema **no existe** ninguna operación de borrar producto, tocar stock
  o cambiar recetas. "Borrá todos los productos" no tiene forma de expresarse.
- Ningún cambio se aplica sin que alguien apriete **Aplicar**, viendo la lista
  completa.
- Un ajuste de más del 100% se rechaza antes de mostrarse.
- Todo queda registrado y se puede deshacer.
- Los prompts marcan explícitamente el texto de la persona como dato y no como
  instrucción, así que un "ignorá las reglas anteriores" escrito en el campo no
  cambia el comportamiento.
- **El navegador nunca le dicta el prompt al servidor.** La función serverless
  manda un `modo` (`precios` o `preguntar`) y ella elige las instrucciones. Si
  fuera al revés, cualquiera que encuentre la dirección podría usar la key del
  local para lo que quisiera.

### Encenderla

Depende de cómo corra el sistema:

**Como archivo suelto en la PC del local.** No hay servidor, así que la clave se
carga desde el panel: **Configuración → Asistente IA**. Queda guardada en ese
navegador, no adentro del archivo del sistema. Ahí mismo está el paso a paso
para sacarla gratis en [aistudio.google.com](https://aistudio.google.com/apikey)
y un botón para probar que funcione.

**Publicado en internet.** La clave va en el servidor y el navegador nunca la
ve. En Vercel, el archivo ya está en `/api/asistente.js`: solo hay que cargar la
variable de entorno `GEMINI_API_KEY`. En Netlify, moverlo a
`netlify/functions/asistente.js`. En este caso el campo del panel se deja vacío.

### Cuánto cuesta

| | Contexto que manda | Costo por consulta |
|---|---|---|
| Preguntar | ~1.900 tokens | ~US$0,0007 |
| Cambiar precios | ~1.700 tokens | ~US$0,0007 |

Con Gemini Flash-Lite (US$0,25 por millón de tokens de entrada y US$1,50 de
salida), **una consulta sale menos de un décimo de centavo de dólar**. Cien
consultas por mes son 7 centavos — y el free tier de Google probablemente las
cubra enteras.

Además, las frases del día a día de los precios las resuelve el parser local:
ahí el costo es cero y funciona sin internet.

---

## La impresora: que salga sola, sin el cuadro de imprimir

Ningún navegador deja que una página imprima sin avisar — es una protección de
seguridad, no un detalle que se pueda programar distinto. La forma de saltearla, que
es la que usan todos los puntos de venta web, es abrir Chrome con la opción
`--kiosk-printing`: ahí la comanda sale directo por la impresora predeterminada de
Windows, **sin ninguna ventana**.

En la carpeta `impresion/` está el `.bat` que hace eso y un LEEME con los pasos.
Resumido:

1. Dejar la térmica como impresora **predeterminada** de Windows.
2. Editar `impresion/Nasty - impresion directa.bat` y poner la dirección del sistema.
3. Mandar ese `.bat` al escritorio como acceso directo y abrir el sistema **siempre**
   desde ahí.

A partir de ahí: el empleado toca **Aceptar pedido**, elige la demora, y la comanda
sale sola. Sin tocar nada.

Se puede probar desde **Configuración → Opciones de impresión**.

Hay tres formatos: comanda de cocina (sin precios, letra grande), ticket del pedido
(con precios, dirección y total) y cierre de arqueo.

---

## Lo que NO se puede resolver solo con código

Está dicho en la pantalla correspondiente, para que nadie se confunda:

- **Pedidos Ya.** La integración es por convenio: su API es de partners y la habilitan
  ellos desde la cuenta del local. La pantalla (Configuración → Delivery Apps) queda
  armada con el código de restaurante, la comisión y las opciones; los pedidos se
  pueden traer mientras tanto con la exportación CSV del portal.
- **Facturación electrónica AFIP/ARCA.** Necesita el certificado fiscal del negocio.
- **Mandar WhatsApp solo, sin que nadie toque enviar.** Requiere la API de WhatsApp
  Business, que es paga y exige aprobación de plantillas. Hoy se abre el chat con el
  mensaje escrito y el empleado le da enviar.

---

## Conectar Supabase — la base de datos de verdad

En modo demo cada navegador tiene su propia copia de los datos: la PC del local,
el celular y la notebook no se ven entre sí, y si se borran los datos del
navegador se pierde todo. Supabase es un PostgreSQL en la nube, gratis en el
plan Free, y es lo que convierte esto en **una sola base compartida**: el
pedido que entra por la web aparece en el panel del local, y los reportes miran
el histórico completo.

### Los pasos

1. **Crear el proyecto** en [supabase.com](https://supabase.com) → New project.
   Región **South America (São Paulo)**, que es la más cerca. Guardar la
   contraseña de la base en algún lado.

2. **SQL Editor → New query**: correr los tres archivos de `supabase/`, en orden
   y de a uno:

   | Archivo | Qué hace |
   |---|---|
   | `1-esquema.sql` | Crea las tablas y las reglas de seguridad |
   | `2-columnas.sql` | Le agrega a cada tabla sus campos |
   | `3-datos.sql` | Carga la carta, los ingredientes y la configuración |

   Los tres se pueden volver a correr sin romper nada. Ojo con el tercero: vacía
   cada tabla antes de cargarla, así que una vez que el local esté operando no
   hay que correrlo entero.

3. **Authentication → Users → Add user**: crear **una cuenta por local**, con
   mail y contraseña. Tildar *Auto Confirm User*.

   | Local | Mail |
   |---|---|
   | Benavídez | `benavidez@nastyburgers.com` |
   | Escobar | `escobar@nastyburgers.com` |

   El mail define qué comandas ve cada uno: la cuenta de Benavídez **no puede
   leer ni tocar** las de Escobar, y no es solo la pantalla — está escrito en las
   reglas de la base (`local_del_usuario()` en `1-esquema.sql`). Un mail que no
   sea de ningún local, como el del dueño, ve los dos.

   Si querés que además quede registrado qué empleado en particular aceptó cada
   pedido, dales una cuenta propia a cada uno con el mismo prefijo
   (`benavidez.juan@…`) — pero entonces hay que ampliar la función del SQL.

4. **Project Settings → API**: copiar `Project URL` y la `anon public` key.

5. Crear un `.env` en la raíz (ver `.env.example`):

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

6. `npm run dev`, o `npm run build:panel` para regenerar el archivo del local.
   El cartel naranja de «Modo demo» desaparece y aparece la pantalla de login.

### Sobre la clave anon

Va adentro del archivo que abre cualquiera, y **está bien que así sea**: es una
clave pública. Lo que protege los datos no es esconderla sino las reglas de
seguridad (RLS) del punto 2. La que **nunca** hay que poner en el código ni
mandar por chat es la `service_role`.

### Quién puede ver qué

La base guarda **teléfono, mail y dirección** de los clientes, así que las
reglas son explícitas:

| | Sin login (la web pública) | Con login (el empleado) |
|---|---|---|
| Carta, categorías, ingredientes, horarios, zonas de envío | Leer | Leer y escribir |
| Pedidos | **Solo crear** uno nuevo | Leer y modificar todos |
| Caja, arqueos, gastos, stock, usuarios, reportes | Nada | Leer y escribir |

Es decir: el cliente puede hacer un pedido pero no puede leer los de nadie, ni
ver la caja del día.

### Cuánto aguanta el plan gratis

500 MB de base y 50.000 usuarios activos por mes. Un pedido ocupa alrededor de
1 KB, así que **500 MB son más de 400.000 pedidos** — a 50 por día, unos 20
años. Lo que sí conviene mirar: el plan Free pausa los proyectos que pasan una
semana entera sin recibir una sola consulta. Un local que abre todos los días no
llega nunca a eso.

### Después de conectar

Los datos ya no salen más de `src/data/semillas.js`: eso es solo la carga
inicial. De ahí en adelante todo se edita **desde el panel**, y si hay que
cambiar la carta desde el código hay que correr `npm run sql` y volver a
ejecutar el bloque de `productos` de `3-datos.sql`.

---


## Qué se edita, y dónde

| Qué | Dónde |
|---|---|
| Menú de la web pública (precios, descripciones, fotos) | `src/data/negocio.js` |
| Las fotos que viajan dentro del archivo | `src/img/` |
| Mensajes que se le mandan al cliente | `src/data/negocio.js` → `MENSAJES` |
| Datos iniciales del sistema (productos, ingredientes, proveedores…) | `src/data/semillas.js` |
| Módulos y solapas del panel | `src/panel/navegacion.js` |
| Columnas y campos de cada ABM | `src/panel/entidades.js` |
| Formato de los tickets | `src/lib/imprimir.js` |
| Paleta y tipografías | `src/index.css` |

Después de la primera carga, los datos del sistema se editan **desde el panel**, no
desde el código: las semillas solo se usan una vez.

---

## Las fotos

### Las que ya están cargadas

Están en `src/img/` y **viajan adentro del archivo**: por eso se ven igual
abriendo el HTML suelto desde la PC, sin tener que llevar ninguna carpeta al
lado. Son las 24 de estudio, una por cada hamburguesa y cada tamaño:

```
critical-s.jpg  critical-d.jpg  critical-t.jpg
nasty-s.jpg     nasty-d.jpg     nasty-t.jpg
dirty-s.jpg     dirty-d.jpg     dirty-t.jpg
sick-s.jpg      sick-d.jpg      sick-t.jpg
gross-s.jpg     gross-d.jpg     gross-t.jpg
muddy-s.jpg     muddy-d.jpg     muddy-t.jpg
stinky-s.jpg    stinky-d.jpg    stinky-t.jpg
melt-s.jpg      melt-d.jpg      melt-t.jpg
```

`-s` = simple, `-d` = doble, `-t` = triple. Cada producto apunta a la suya, así
que la Nasty Doble muestra la foto de la Nasty Doble y no la de la simple. Las
de Melt son las de la **Melt 2.0**, y las comparte la promo de los miércoles.

Todavía sin foto propia: **NBC**, **La Pampera**, las papas y las bebidas.
Esas muestran el placeholder amarillo de la marca.

### La foto de la portada

`hero.webp` es la **Critical Doble recortada**, con fondo transparente. Por eso
el Hero la muestra con `object-contain` en vez de `object-cover`, sin marco
redondeado, y con una sombra propia: una elipse debajo (que se apaga cuando el
fondo se pone negro al scrollear) más un `drop-shadow` que sigue el contorno.

El recorte lo hizo Marcos en Photopea (Select → Magic Cut). El proyecto lo
procesa en `hero.py`: erosiona el alfa unos píxeles para sacar el hilo naranja
que queda del fondo original, lo centra en un lienzo cuadrado y lo guarda en
WebP (113 KB contra ~1,5 MB que pesaría en PNG).

Para cambiar la foto de portada por otra recortada, reemplazá `src/img/hero.webp`
manteniendo el nombre.

### Agregar una foto nueva

Si el sistema está publicado en internet, alcanza con dejar el archivo en
`public/img/` y escribir su nombre en el panel: producto → **Qué ven tus
clientes** → campo **Foto**. No hay que recompilar nada.

Si además querés que viaje dentro del HTML suelto, copiala también a `src/img/`
y volvé a generar los archivos (`npm run build:single` y `npm run build:panel`).

En los dos casos: cuadrada, alrededor de 900×900, menos de 300 KB.

---

## Estructura

```
src/
  data/
    negocio.js       menú, locales, mensajes al cliente
    semillas.js      datos iniciales del sistema
  components/        la web pública
  panel/
    Shell.jsx        login, barra de módulos, ruteo
    navegacion.js    el mapa de módulos y secciones
    entidades.js     definición de cada ABM
    usePedidos.js    suscripción, sonido e impresión automática
    Comanda.jsx      una comanda con sus acciones
    ModalAceptar.jsx elegir la demora
    comp/            Tabla, gráficos, UI compartida
    pantallas/       Ventas, Reportes, Inventario, Caja, Clientes, Ajustes, Crud
  lib/
    almacen.js       colecciones genéricas (demo o Supabase)
    pedidos.js       API de pedidos
    estadisticas.js  todos los cálculos de los reportes
    imprimir.js      tickets de 80 mm
    supabase.js      cliente; sin claves = modo demo
    ruta.js          ruteo por hash + navegación por estado
    scroll.js        animaciones de la web
    utils.js         pesos, teléfonos, fechas, CSV
supabase/
  schema.sql         pedidos + tablas del sistema + permisos
  columnas.sql       las columnas de cada tabla
```

### Sobre los gráficos

Están hechos a mano (sin librería) en `src/panel/comp/graficos.jsx`. La paleta
—`#BC8600` para ventas e ingresos, `#3E93C4` para egresos— está validada sobre el
fondo oscuro del panel: banda de luminosidad, croma, separación para daltonismo,
piso de visión normal y contraste. Cada gráfico tiene tooltip al pasar el mouse y
los principales tienen vista de tabla, para que el dato nunca dependa solo del color.
