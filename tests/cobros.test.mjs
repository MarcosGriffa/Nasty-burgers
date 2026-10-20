// El 10 % por efectivo y las comisiones de los medios de pago.
//
// Estos dos numeros ya se rompieron una vez cada uno: el descuento se aplicaba
// tambien en delivery (T1.7) y la comision de Mercado Pago estaba escrita a
// mano (T1.4). Los dos errores calculaban mal plata sin avisar.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  aplicaDescuentoEfectivo,
  comisionDePedido,
  comisiones,
  descuentoPorEfectivo,
  medioDe,
  porcentajeDe,
} from '../src/lib/cobros.js'
import { MEDIOS_PAGO } from '../src/data/semillas.js'

const DIEZ = 0.1

test('el 10 % es solo para el que retira', () => {
  assert.equal(descuentoPorEfectivo(15500, 'efectivo', 'retiro', DIEZ), 1550)
  assert.equal(descuentoPorEfectivo(15500, 'efectivo', 'delivery', DIEZ), 0)
})

test('sin modalidad elegida todavia no hay descuento', () => {
  // En la web el cliente arranca sin elegir. Mostrarle un descuento que despues
  // le desaparece al elegir delivery es peor que no mostrarselo.
  assert.equal(descuentoPorEfectivo(15500, 'efectivo', null, DIEZ), 0)
  assert.equal(aplicaDescuentoEfectivo('efectivo', undefined), false)
})

test('las otras formas de pago no llevan descuento', () => {
  for (const pago of ['tarjeta', 'mercadopago', 'transferencia', 'qr']) {
    assert.equal(descuentoPorEfectivo(15500, pago, 'retiro', DIEZ), 0, pago)
  }
})

test('lo que venga mal no rompe la cuenta', () => {
  assert.equal(descuentoPorEfectivo('nada', 'efectivo', 'retiro', DIEZ), 0)
  assert.equal(descuentoPorEfectivo(15500, 'efectivo', 'retiro', 0), 0)
  assert.equal(descuentoPorEfectivo(15500, 'efectivo', 'retiro', -1), 0)
  assert.equal(descuentoPorEfectivo(15500, 'efectivo', 'retiro', undefined), 0)
})

test('el enganche con el medio de pago va por clave, no por nombre', () => {
  // Si el encargado renombra "Mercado Pago" a "MP", la comision tiene que
  // seguir descontandose igual.
  const renombrado = MEDIOS_PAGO.map((m) =>
    m.clave === 'mercadopago' ? { ...m, nombre: 'MP' } : m,
  )
  assert.equal(medioDe(renombrado, 'mercadopago')?.nombre, 'MP')
  assert.equal(comisionDePedido({ pago: 'mercadopago', total: 10000 }, renombrado), 350)
})

test('un medio dado de baja no engancha', () => {
  const bajas = MEDIOS_PAGO.map((m) => ({ ...m, activo: false }))
  assert.equal(medioDe(bajas, 'efectivo'), null)
})

test('una comision sin cargar no se lee como cero', () => {
  // null es "no lo se". El panel lo tiene que poder distinguir de un 0 % real,
  // que es lo que se arreglo con la tarjeta (T1.8).
  const qr = MEDIOS_PAGO.find((m) => m.clave === 'qr')
  assert.equal(qr.comision, null, 'el arancel del QR todavia no lo sabemos')
  assert.equal(porcentajeDe(qr), 0, 'pero no se inventa un numero para cobrar')
})

test('el desglose avisa cuando una venta no tiene medio asignado', () => {
  const pedidos = [
    { pago: 'efectivo', total: 10000 },
    { pago: 'mercadopago', total: 10000 },
    { pago: 'criptomonedas', total: 5000 },
  ]
  const d = comisiones(pedidos, MEDIOS_PAGO)
  const sinAsignar = d.filas.filter((f) => f.sinAsignar)
  assert.equal(sinAsignar.length, 1)
  assert.equal(d.brutoSinAsignar, 5000)
  assert.equal(d.total, 350, 'solo Mercado Pago cobra arancel')
})

test('la tarjeta cobra 0 % y NO figura como sin asignar', () => {
  const d = comisiones([{ pago: 'tarjeta', total: 46000 }], MEDIOS_PAGO)
  const fila = d.filas[0]
  assert.equal(fila.sinAsignar, false)
  assert.equal(fila.comision, 0)
  assert.equal(fila.neto, 46000)
})

test('debito y credito se cuentan por separado', () => {
  // Marcos los cierra por separado en la caja, asi que son dos medios.
  const pedidos = [
    { pago: 'tarjeta', total: 10000 },
    { pago: 'credito', total: 7000 },
  ]
  const d = comisiones(pedidos, MEDIOS_PAGO)
  const debito = d.filas.find((f) => f.clave === 'tarjeta')
  const credito = d.filas.find((f) => f.clave === 'credito')
  assert.equal(debito.medio, 'Tarj. Débito')
  assert.equal(credito.medio, 'Tarj. Crédito')
  assert.equal(d.brutoSinAsignar, 0, 'ninguna de las dos queda sin asignar')
})

test('los pedidos viejos que dicen "tarjeta" siguen enganchando con el debito', () => {
  // Cambiar la clave a 'debito' habria dejado todas esas ventas huerfanas.
  assert.equal(medioDe(MEDIOS_PAGO, 'tarjeta')?.nombre, 'Tarj. Débito')
})
