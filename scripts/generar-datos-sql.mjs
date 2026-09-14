// ---------------------------------------------------------------------------
// Genera supabase/3-datos.sql a partir de las mismas semillas que usa la app.
// Así la base arranca con la carta idéntica a la que se ve en modo demo.
//
//   npm run sql
// ---------------------------------------------------------------------------
import { writeFileSync } from 'node:fs'
import * as S from '../src/data/semillas.js'

const comilla = (v) => `'${String(v).replace(/'/g, "''")}'`

const valor = (v) => {
  if (v === null || v === undefined || v === '') return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'object') return `${comilla(JSON.stringify(v))}::jsonb`
  return comilla(v)
}

/** Un insert por tabla, con todas las filas juntas. */
function tabla(nombre, filas, comentario) {
  if (!filas?.length) return ''
  const columnas = [...new Set(filas.flatMap(Object.keys))]
  const cuerpo = filas
    .map((f) => `  (${columnas.map((c) => valor(f[c])).join(', ')})`)
    .join(',\n')
  return [
    `-- ${comentario} ${'-'.repeat(Math.max(0, 74 - comentario.length))}`,
    `delete from public.${nombre};`,
    `insert into public.${nombre} (${columnas.join(', ')}) values`,
    `${cuerpo};`,
    '',
  ].join('\n')
}

const TABLAS = [
  ['cat_productos', S.CAT_PRODUCTOS, 'Categorías de la carta'],
  ['cat_ingredientes', S.CAT_INGREDIENTES, 'Categorías de ingredientes'],
  ['ingredientes', S.INGREDIENTES, 'Ingredientes, con su costo y su stock'],
  ['productos', S.PRODUCTOS, 'La carta: precio, descripción, foto y receta'],
  ['grupos_modificadores', S.GRUPOS_MODIFICADORES, 'Grupos modificadores'],
  ['proveedores', S.PROVEEDORES, 'Proveedores'],
  ['cat_gastos', S.CAT_GASTOS, 'Categorías de gastos'],
  ['descuentos', S.DESCUENTOS, 'Descuentos'],
  ['medios_pago', S.MEDIOS_PAGO, 'Medios de pago'],
  ['cajas', S.CAJAS, 'Cajas'],
  ['cuentas_bancarias', S.CUENTAS_BANCARIAS, 'Cuentas'],
  ['usuarios', S.USUARIOS, 'Usuarios del panel'],
  ['roles', S.ROLES, 'Roles'],
  ['turnos', S.TURNOS, 'Turnos'],
  ['areas_impresion', S.AREAS_IMPRESION, 'Áreas de impresión'],
  ['impresoras', S.IMPRESORAS, 'Impresoras'],
  ['listas_precios', S.LISTAS_PRECIOS, 'Listas de precios'],
  ['menus', S.MENUS, 'Menús'],
  ['zonas_envio', S.ZONAS_ENVIO, 'Zonas de envío'],
  ['ajustes', S.AJUSTES_INICIALES, 'Ajustes del local'],
]

const cabecera = `-- ---------------------------------------------------------------------------
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

`

const sql = cabecera + TABLAS.map(([n, f, c]) => tabla(n, f, c)).join('\n')
writeFileSync(new URL('../supabase/3-datos.sql', import.meta.url), sql)
console.log(`3-datos.sql: ${TABLAS.filter(([, f]) => f?.length).length} tablas, ${TABLAS.reduce((a, [, f]) => a + (f?.length ?? 0), 0)} filas`)
