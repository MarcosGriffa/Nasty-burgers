// Cruzar la linea de un pedido con el producto de la carta.
//
// Esto se hacia por NOMBRE en tres lugares: el descuento de stock, el costo
// para el margen y el consumo de ingredientes. Renombrar un producto desde el
// panel alcanzaba para que el stock dejara de descontarse en silencio.
import test from 'node:test'
import assert from 'node:assert/strict'
import { identidadDeProducto, lineasHuerfanas, productoDeLinea } from '../src/lib/catalogo.js'

const carta = [
  { id: 'id-1', codigo: 'nasty-simple', nombre: 'Nasty Simple', costo: 4000 },
  { id: 'id-2', codigo: 'critical-doble', nombre: 'Critical Doble', costo: 6000 },
  { id: 'id-3', codigo: '', nombre: 'Promo suelta', costo: 1000 },
]

test('renombrar un producto NO corta el cruce', () => {
  // El caso que rompia todo: el pedido guarda el nombre viejo, el panel ya
  // tiene el nuevo. El codigo es lo unico que no cambio.
  const renombrada = carta.map((p) =>
    p.codigo === 'nasty-simple' ? { ...p, nombre: 'Nasty Clásica' } : p,
  )
  const linea = { id: 'id-1', codigo: 'nasty-simple', nombre: 'Nasty Simple', cantidad: 1 }
  assert.equal(productoDeLinea(linea, renombrada)?.nombre, 'Nasty Clásica')
})

test('el codigo manda sobre el id y sobre el nombre', () => {
  // Si los tres apuntan a lugares distintos, gana el codigo.
  const linea = { codigo: 'critical-doble', id: 'id-1', nombre: 'Promo suelta' }
  assert.equal(productoDeLinea(linea, carta)?.codigo, 'critical-doble')
})

test('sin codigo se cae al id', () => {
  assert.equal(productoDeLinea({ id: 'id-2' }, carta)?.nombre, 'Critical Doble')
})

test('los pedidos viejos, sin codigo ni id, todavia cruzan por nombre', () => {
  // Pedidos guardados antes de que la linea llevara el codigo. Es la red de
  // abajo: tiene que seguir funcionando o los reportes historicos se vacian.
  assert.equal(productoDeLinea({ nombre: 'Critical Doble' }, carta)?.id, 'id-2')
})

test('un codigo vacio no engancha con el producto sin codigo', () => {
  // 'Promo suelta' tiene codigo ''. Una linea con codigo '' no se tiene que
  // pegar a ella por casualidad: se cae al id o al nombre.
  assert.equal(productoDeLinea({ codigo: '', nombre: 'Nasty Simple' }, carta)?.id, 'id-1')
})

test('los espacios de mas no rompen el cruce', () => {
  assert.equal(productoDeLinea({ codigo: ' nasty-simple ' }, carta)?.id, 'id-1')
  assert.equal(productoDeLinea({ nombre: 'Critical Doble  ' }, carta)?.id, 'id-2')
})

test('lo que no existe devuelve null y no revienta', () => {
  assert.equal(productoDeLinea({ codigo: 'inventado' }, carta), null)
  assert.equal(productoDeLinea(null, carta), null)
  assert.equal(productoDeLinea({ codigo: 'nasty-simple' }, []), null)
  assert.equal(productoDeLinea({}, carta), null)
})

test('las lineas que no cruzan se pueden listar para avisar', () => {
  const items = [
    { codigo: 'nasty-simple', nombre: 'Nasty Simple' },
    { codigo: 'borrado', nombre: 'Algo que ya no esta' },
    { nombre: 'Tampoco esta' },
  ]
  assert.deepEqual(lineasHuerfanas(items, carta), ['Algo que ya no esta', 'Tampoco esta'])
  assert.deepEqual(lineasHuerfanas([], carta), [])
})

test('la identidad que se guarda en la linea lleva las tres formas de cruzar', () => {
  const i = identidadDeProducto(carta[0])
  assert.equal(i.codigo, 'nasty-simple')
  assert.equal(i.id, 'id-1')
  assert.equal(i.nombre, 'Nasty Simple')
  assert.deepEqual(identidadDeProducto(undefined), { id: null, codigo: null, nombre: '' })
})
