// Las promos del dia.
//
// Al armar esto se rompio dos veces seguidas por el mismo tipo de error: creer
// que "hamburguesa" se reconoce buscando una palabra. Primero quedaron afuera
// las Gross (llevan "Bolita 120 g Smash", no "Medallon"), y despues quedaron
// afuera TODAS, porque la categoria se llama "Hamburguesas c/ Papas Fritas" y
// el filtro que excluia "papas fritas" se las comia a todas.
import test from 'node:test'
import assert from 'node:assert/strict'
import { esCombo, precioConPromo, promoDelDia } from '../src/lib/promos.js'
import { PRODUCTOS } from '../src/data/semillas.js'

const MIERCOLES = new Date('2026-10-14T20:00:00')
const JUEVES = new Date('2026-10-15T20:00:00')
const MARTES = new Date('2026-10-13T20:00:00')

const porNombre = (n) => PRODUCTOS.find((p) => p.nombre === n)

test('el miercoles es el dia de la promo de combos', () => {
  assert.equal(promoDelDia(MIERCOLES)?.tipo, 'descuento_combo')
  assert.equal(promoDelDia(MIERCOLES)?.monto, 2000)
  assert.equal(promoDelDia(MARTES), null)
})

test('toda hamburguesa con papas entra en la promo', () => {
  for (const n of ['Nasty Simple', 'Critical Doble', 'Melt 2.0 Triple', 'Pampera Simple']) {
    assert.equal(esCombo(porNombre(n)), true, n)
  }
})

test('la Gross tambien entra, aunque no diga "medallon"', () => {
  // Lleva "Bolita 120 g Smash". Buscar la palabra medallon la dejaba afuera.
  const gross = porNombre('Gross Simple')
  assert.ok(gross.receta.some((r) => /bolita/i.test(r.ingrediente)), 'la receta cambio')
  assert.equal(esCombo(gross), true)
})

test('las papas solas, los extras y las bebidas NO son combo', () => {
  for (const n of ['Porción de papas fritas', 'Extra bacon', 'Coca-Cola 500 ml', 'Imperial IPA']) {
    assert.equal(esCombo(porNombre(n)), false, n)
  }
})

test('la CheeseBurger es un extra y queda afuera', () => {
  assert.equal(esCombo(porNombre('CheeseBurger c/ papas')), false)
})

test('el miercoles el combo sale $2.000 menos, el martes no', () => {
  const nasty = porNombre('Nasty Simple')
  assert.equal(nasty.precio, 14850)
  assert.equal(precioConPromo(nasty, nasty.precio, MIERCOLES), 12850)
  assert.equal(precioConPromo(nasty, nasty.precio, MARTES), 14850)
})

test('el jueves todavia no toca el precio', () => {
  // La promo del jueves es una gaseosa de regalo, no un descuento. Mientras no
  // este hecha, el precio no se tiene que mover.
  const nasty = porNombre('Nasty Simple')
  assert.equal(promoDelDia(JUEVES)?.tipo, 'gaseosa_gratis')
  assert.equal(precioConPromo(nasty, nasty.precio, JUEVES), 14850)
})

test('una bebida no se descuenta ni el miercoles', () => {
  const coca = porNombre('Coca-Cola 500 ml')
  assert.equal(precioConPromo(coca, coca.precio, MIERCOLES), 3500)
})

test('la promo nunca regala el producto', () => {
  // Si alguien carga una hamburguesa barata, $2.000 menos no puede dejarla en
  // cero ni en negativo.
  const barata = { categoria: 'Hamburguesas c/ Papas Fritas', receta: [{ ingrediente: 'Papas fritas' }] }
  assert.equal(precioConPromo(barata, 2500, MIERCOLES), 750, 'piso del 30 %')
  assert.ok(precioConPromo(barata, 100, MIERCOLES) > 0)
})

test('un producto sin receta ni categoria no rompe nada', () => {
  assert.equal(esCombo(undefined), false)
  assert.equal(esCombo({}), false)
  assert.equal(precioConPromo({}, 10000, MIERCOLES), 10000)
})

test('los 28 combos de la carta son los que estan en promo', () => {
  const enPromo = PRODUCTOS.filter(esCombo)
  assert.equal(enPromo.length, 28)
  // y ninguno de ellos es bebida, extra o papas sueltas
  for (const p of enPromo) {
    assert.ok(!/bebidas|cerveza|extras|^papas fritas$/i.test(p.categoria), p.nombre)
  }
})
