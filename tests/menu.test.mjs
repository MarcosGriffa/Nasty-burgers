// La carta que ve el cliente.
//
// Lo que importa acá es el precio: se calcula UNA vez, al armar la carta, para
// que el número que ve el cliente, el que se cobra en el carrito, el que se
// guarda en el pedido y el que sale en la comanda sean el mismo. Si esto se
// desacomoda, el local cobra distinto de lo que publicó.
import test from 'node:test'
import assert from 'node:assert/strict'
import { armarMenu, descripcionAuto, nombreCorto } from '../src/lib/menu.js'
import { CAT_PRODUCTOS, INGREDIENTES, PRODUCTOS } from '../src/data/semillas.js'

const MIERCOLES = new Date('2026-10-14T20:00:00')
const MARTES = new Date('2026-10-13T20:00:00')

const carta = (hoy) => armarMenu(PRODUCTOS, CAT_PRODUCTOS, INGREDIENTES, hoy)
const buscar = (secciones, nombre) =>
  secciones.flatMap((s) => s.items).find((i) => i.nombre === nombre)

test('el miercoles la carta publica el precio con promo y el de lista', () => {
  const nasty = buscar(carta(MIERCOLES), 'Nasty Simple')
  assert.equal(nasty.precio, 12850, 'lo que paga')
  assert.equal(nasty.precioLista, 14850, 'lo tachado al lado')
  assert.equal(nasty.enPromo, true)
})

test('el martes la carta publica un solo precio', () => {
  const nasty = buscar(carta(MARTES), 'Nasty Simple')
  assert.equal(nasty.precio, 14850)
  assert.equal(nasty.precioLista, 14850)
  assert.equal(nasty.enPromo, false)
})

test('las bebidas no cambian de precio ningun dia', () => {
  for (const dia of [MIERCOLES, MARTES]) {
    const coca = buscar(carta(dia), 'Coca-Cola 500 ml')
    assert.equal(coca.precio, 3500)
    assert.equal(coca.enPromo, false)
  }
})

test('no quedo ninguna categoria de promo duplicando productos', () => {
  // La promo del miercoles estaba hecha con tres "Melt 2.0" clonados en una
  // categoria aparte: el mismo producto aparecia dos veces en la carta.
  const secciones = carta(MIERCOLES)
  assert.equal(
    secciones.some((s) => /promo/i.test(s.nombre)),
    false,
  )
  const melts = secciones.flatMap((s) => s.items).filter((i) => i.nombre === 'Melt 2.0 Simple')
  assert.equal(melts.length, 1, 'una sola Melt 2.0 Simple en toda la carta')
})

test('solo entran los productos activos y visibles en la web', () => {
  const ocultos = PRODUCTOS.map((p, i) =>
    i === 0 ? { ...p, visible_web: false } : i === 1 ? { ...p, activo: false } : p,
  )
  const items = armarMenu(ocultos, CAT_PRODUCTOS, INGREDIENTES, MARTES).flatMap((s) => s.items)
  assert.equal(items.some((i) => i.nombre === PRODUCTOS[0].nombre), false)
  assert.equal(items.some((i) => i.nombre === PRODUCTOS[1].nombre), false)
})

test('la descripcion se arma sola con la receta, sin envases ni aceite', () => {
  const nasty = PRODUCTOS.find((p) => p.nombre === 'Nasty Simple')
  const d = descripcionAuto(nasty.receta, INGREDIENTES)
  assert.match(d, /Pan de papa/)
  assert.doesNotMatch(d, /caja|bolsa|aceite/i, 'el cliente no come el envase')
})

test('dentro de la seccion "Dobles" la Nasty Doble se llama Nasty', () => {
  assert.equal(nombreCorto('Nasty Doble', 'Doble'), 'Nasty')
  assert.equal(nombreCorto('Pampera Simple', ''), 'Pampera Simple')
})

test('una carta vacia no rompe nada', () => {
  assert.deepEqual(armarMenu([], [], [], MARTES), [])
})
