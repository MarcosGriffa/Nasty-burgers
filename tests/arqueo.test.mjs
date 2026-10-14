// El primer test del proyecto, y no es casualidad que sea este: el arqueo
// decide plata, y hasta ahora la unica forma de comprobarlo era abrir el panel
// y cargar pedidos a mano. Correr: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularArqueo, diferenciaDe, totalDeclarado } from '../src/lib/arqueo.js'
import { MEDIOS_PAGO } from '../src/data/semillas.js'

const haceMedia = () => new Date(Date.now() - 1800e3).toISOString()
const arqueo = { apertura: new Date(Date.now() - 3600e3).toISOString(), cierre: null, monto_inicial: 21000 }
const ped = (total, pago, origen, estado = 'entregado') => ({
  total, pago, origen, estado, creado_en: haceMedia(),
})

const pedidos = [
  ped(10000, 'efectivo', 'Mostrador'),
  ped(5000, 'qr', 'Mostrador'),
  ped(7000, 'mercadopago', 'Tienda Online'),
  // El pedido dice "efectivo", pero la plata la cobro PedidosYa: tiene que
  // caer en su propia fila y NO en la del efectivo del cajon.
  ped(8000, 'efectivo', 'Pedidos Ya'),
  ped(99999, 'efectivo', 'Mostrador', 'rechazado'),
]
const movimientos = [
  { fecha: new Date().toISOString(), tipo: 'Ingreso', monto: 1000 },
  { fecha: new Date().toISOString(), tipo: 'Egreso', monto: 3000 },
]

test('cada venta cae en la forma de cobro que corresponde', () => {
  const s = calcularArqueo(arqueo, pedidos, movimientos, MEDIOS_PAGO)
  assert.equal(s.porMedio['Efectivo'], 10000)
  assert.equal(s.porMedio['Mercado Pago QR'], 5000)
  assert.equal(s.porMedio['Mercado Pago'], 7000)
  assert.equal(s.porMedio['Online Pedidos Ya'], 8000)
  assert.equal(s.porMedio['Tarj. Débito'], 0)
  assert.equal(s.porMedio['Transferencia'], 0)
})

test('el origen manda sobre la forma de pago', () => {
  const s = calcularArqueo(arqueo, [ped(8000, 'efectivo', 'Pedidos Ya')], [], MEDIOS_PAGO)
  assert.equal(s.porMedio['Online Pedidos Ya'], 8000)
  assert.equal(s.porMedio['Efectivo'], 0, 'esa plata no pasa por el cajon')
})

test('un pedido rechazado no es una venta', () => {
  const s = calcularArqueo(arqueo, pedidos, movimientos, MEDIOS_PAGO)
  assert.equal(s.ventas, 30000)
})

test('el total es inicial + ingresos - egresos', () => {
  const s = calcularArqueo(arqueo, pedidos, movimientos, MEDIOS_PAGO)
  assert.equal(s.ingresos, 31000, 'ventas + ingresos manuales')
  assert.equal(s.egresos, 3000)
  assert.equal(s.total, 49000)
})

test('avisa cuanta plata entro por fuera del cajon', () => {
  const s = calcularArqueo(arqueo, pedidos, movimientos, MEDIOS_PAGO)
  assert.equal(s.fueraDeCaja, 8000)
})

test('la diferencia es lo declarado menos lo que dice el sistema', () => {
  const s = calcularArqueo(arqueo, pedidos, movimientos, MEDIOS_PAGO)
  const declarado = {
    Efectivo: 28000,
    'Mercado Pago QR': 5000,
    'Mercado Pago': 7000,
    'Online Pedidos Ya': 8000,
  }
  assert.equal(totalDeclarado(declarado), 48000)
  assert.equal(diferenciaDe({ declarado }, s.total), -1000, 'faltan mil pesos')
})

test('lo que se carga mal no rompe la cuenta', () => {
  assert.equal(totalDeclarado({ a: '', b: null, c: 'cualquier cosa', d: -500, e: '2000' }), 2000)
})

test('un pedido de antes de abrir la caja no entra', () => {
  const viejo = { ...ped(5000, 'efectivo', 'Mostrador'), creado_en: new Date(Date.now() - 7200e3).toISOString() }
  const s = calcularArqueo(arqueo, [viejo], [], MEDIOS_PAGO)
  assert.equal(s.ventas, 0)
})
