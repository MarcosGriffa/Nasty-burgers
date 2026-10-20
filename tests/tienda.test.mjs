// Horarios, pausa de la tienda y costo de envio.
//
// Antes de T2.1 se podia confirmar un pedido a las 4 de la manana con el local
// cerrado: los horarios se cargaban en el panel y la web los ignoraba.
import test from 'node:test'
import assert from 'node:assert/strict'
import { costoDeEnvio, estadoDeTienda } from '../src/lib/tienda.js'
import { AJUSTES_INICIALES } from '../src/data/semillas.js'

const ajustes = AJUSTES_INICIALES[0]
// El miercoles 14/10/2026 abre de 19:30 a 23:00, delivery y retiro.
const alas = (hhmm) => new Date(`2026-10-14T${hhmm}:00`)

test('abierto adentro del horario, cerrado afuera', () => {
  assert.equal(estadoDeTienda(ajustes, 'delivery', alas('20:30')).abierto, true)
  assert.equal(estadoDeTienda(ajustes, 'delivery', alas('10:31')).abierto, false)
  assert.equal(estadoDeTienda(ajustes, 'delivery', alas('23:30')).abierto, false)
})

test('justo al abrir ya se puede; justo al cerrar, no', () => {
  assert.equal(estadoDeTienda(ajustes, 'delivery', alas('19:30')).abierto, true)
  assert.equal(estadoDeTienda(ajustes, 'delivery', alas('23:00')).abierto, false)
})

test('«Pausar tienda» cierra las dos modalidades', () => {
  const pausada = { ...ajustes, tienda_activa: false }
  for (const m of ['delivery', 'retiro']) {
    const e = estadoDeTienda(pausada, m, alas('20:30'))
    assert.equal(e.abierto, false, m)
    assert.match(e.motivo, /no estamos tomando pedidos/i)
  }
})

test('se puede tener el delivery cerrado y el retiro abierto', () => {
  const soloRetiro = {
    ...ajustes,
    horarios: ajustes.horarios.map((h) => ({ ...h, delivery: false })),
  }
  assert.equal(estadoDeTienda(soloRetiro, 'delivery', alas('20:30')).abierto, false)
  assert.equal(estadoDeTienda(soloRetiro, 'retiro', alas('20:30')).abierto, true)
})

test('sin modalidad elegida alcanza con que sirva alguna', () => {
  // En la web el cliente todavia no dijo si lo retira. No se le puede decir
  // "el delivery esta cerrado" por algo que no pidio.
  const soloRetiro = {
    ...ajustes,
    horarios: ajustes.horarios.map((h) => ({ ...h, delivery: false })),
  }
  assert.equal(estadoDeTienda(soloRetiro, null, alas('20:30')).abierto, true)
  const cerrado = estadoDeTienda(ajustes, null, alas('10:00'))
  assert.equal(cerrado.abierto, false)
  assert.match(cerrado.motivo, /ahora estamos cerrados/i)
})

test('un turno que cruza la medianoche sigue abierto a la madrugada', () => {
  const nocturno = {
    ...ajustes,
    horarios: ajustes.horarios.map((h) => ({ ...h, desde: '20:00', hasta: '01:00' })),
  }
  // Jueves 15 a las 00:30: el local abrio el miercoles y todavia no cerro.
  assert.equal(estadoDeTienda(nocturno, 'delivery', new Date('2026-10-15T00:30:00')).abierto, true)
  assert.equal(estadoDeTienda(nocturno, 'delivery', new Date('2026-10-15T02:00:00')).abierto, false)
})

test('el motivo dice de que modalidad habla', () => {
  assert.match(estadoDeTienda(ajustes, 'retiro', alas('10:00')).motivo, /local está cerrado/i)
  assert.match(estadoDeTienda(ajustes, 'delivery', alas('10:00')).motivo, /delivery está cerrado/i)
})

test('el costo de envio sale de los ajustes, y aguanta basura', () => {
  assert.equal(costoDeEnvio({ costo_envio: 4500 }), 4500)
  assert.equal(costoDeEnvio({ costo_envio: 0 }), 0, 'envio gratis es un valor valido')
  assert.equal(costoDeEnvio({ costo_envio: 'gratis' }), 3000, 'cae al valor por defecto')
  assert.equal(costoDeEnvio({ costo_envio: -100 }), 3000)
  assert.equal(costoDeEnvio(undefined), 3000)
})
