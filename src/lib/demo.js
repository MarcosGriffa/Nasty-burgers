import { TODOS_LOS_ITEMS } from '../data/negocio'
import { nombreCompleto } from './utils'

// Comandas de ejemplo para ver el panel funcionando sin tener que cargar
// pedidos a mano. Solo se usan en MODO DEMO.

const haceMinutos = (m) => new Date(Date.now() - m * 60000).toISOString()

export const COMANDAS_EJEMPLO = [
  {
    numero: 1,
    creado_en: haceMinutos(2),
    modalidad: 'delivery',
    local: 'benavidez',
    cliente_nombre: 'Julián Ramos',
    cliente_telefono: '11 5512 8890',
    cliente_email: 'julian.ramos@gmail.com',
    direccion: 'Los Aromos 1245, entre Belgrano y Rivadavia',
    nota: 'Timbre no anda, llamar al llegar.',
    items: [
      { id: 'critical-d', nombre: 'Critical Doble', cantidad: 1, precio: 17700 },
      { id: 'nasty-s', nombre: 'Nasty Simple', cantidad: 1, precio: 14850 },
      { id: 'coca', nombre: 'Coca-Cola 500 ml', cantidad: 2, precio: 3500 },
    ],
    subtotal: 39550,
    descuento: 3955,
    total: 35595,
    pago: 'efectivo',
    estado: 'pendiente',
    demora_min: null,
    efectivo_cobrado: false,
    avisado: false,
  },
  {
    numero: 2,
    creado_en: haceMinutos(9),
    modalidad: 'retiro',
    local: 'benavidez',
    cliente_nombre: 'Sofía Benítez',
    cliente_telefono: '1144239971',
    cliente_email: 'sofiben@gmail.com',
    direccion: null,
    nota: null,
    items: [
      { id: 'melt-promo-doble', nombre: 'Melt 2.0 Doble', cantidad: 1, precio: 15660 },
    ],
    subtotal: 15660,
    descuento: 0,
    total: 15660,
    pago: 'tarjeta',
    estado: 'pendiente',
    demora_min: null,
    efectivo_cobrado: false,
    avisado: false,
  },
  {
    numero: 3,
    creado_en: haceMinutos(18),
    modalidad: 'delivery',
    local: 'escobar',
    cliente_nombre: 'Martín Ferreyra',
    cliente_telefono: '011 15 6688 4410',
    cliente_email: null,
    direccion: 'Colectora Este 2210, depto 3B',
    nota: 'Sin pickles en las dos.',
    items: [
      { id: 'dirty-d', nombre: 'Dirty Doble', cantidad: 2, precio: 17100 },
      { id: 'papas', nombre: 'Porción de papas fritas', cantidad: 1, precio: 4200 },
    ],
    subtotal: 38400,
    descuento: 0,
    total: 38400,
    pago: 'transferencia',
    estado: 'preparando',
    demora_min: 40,
    efectivo_cobrado: false,
    avisado: true,
  },
  {
    numero: 4,
    creado_en: haceMinutos(31),
    modalidad: 'retiro',
    local: 'benavidez',
    cliente_nombre: 'Camila Ortiz',
    cliente_telefono: '1133447788',
    cliente_email: 'cami.ortiz@gmail.com',
    direccion: null,
    nota: null,
    items: [
      { id: 'pampera-simple', nombre: 'Pampera Simple', cantidad: 1, precio: 15500 },
      { id: 'imp-ipa', nombre: 'Imperial IPA', cantidad: 1, precio: 3000 },
    ],
    subtotal: 18500,
    descuento: 1850,
    total: 16650,
    pago: 'efectivo',
    estado: 'listo',
    demora_min: 25,
    efectivo_cobrado: false,
    avisado: true,
  },
]

// ---------------------------------------------------------------------------
// Historial de ventas de ejemplo
// Los reportes (ventas por día, ranking de productos, balance) necesitan meses
// de datos para decir algo. Esto genera ~2 meses de pedidos coherentes:
// solo días de apertura, solo entre 19:30 y 23:00, con la mezcla de productos
// que muestra el reporte real de Fudo (las Dobles son casi el 40%).
// ---------------------------------------------------------------------------

// PRNG con semilla: el mismo historial en cada equipo, sin sorpresas.
function aleatorio(semilla) {
  let a = semilla
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PESO_CATEGORIA = { dobles: 40, triples: 22, simples: 16, pampera: 5, promo: 5, papas: 4, bebidas: 5, cerveza: 2, extras: 1 }

const NOMBRES = ['Julián', 'Sofía', 'Martín', 'Camila', 'Nicolás', 'Valentina', 'Lucas', 'Agustina', 'Tomás', 'Micaela', 'Franco', 'Rocío', 'Ezequiel', 'Brenda', 'Iván', 'Daniela', 'Matías', 'Carla', 'Gonzalo', 'Belén']
const APELLIDOS = ['Ramos', 'Benítez', 'Ferreyra', 'Ortiz', 'Sosa', 'Giménez', 'Molina', 'Peralta', 'Aguirre', 'Cabrera', 'Vera', 'Ledesma', 'Ríos', 'Acosta', 'Núñez']
const CALLES = ['Los Aromos', 'Av. Alvear', 'Belgrano', 'Rivadavia', 'Los Ceibos', 'San Martín', 'Colectora Este', 'Las Camelias', 'Mitre', 'Sarmiento']
const PAGOS = ['efectivo', 'efectivo', 'efectivo', 'mercadopago', 'mercadopago', 'transferencia', 'tarjeta']

function elegirItem(r) {
  const bolsa = []
  TODOS_LOS_ITEMS.forEach((i) => {
    const peso = PESO_CATEGORIA[i.categoriaId] ?? 1
    for (let k = 0; k < peso; k++) bolsa.push(i)
  })
  return bolsa[Math.floor(r() * bolsa.length)]
}

/** Pedidos cerrados de los últimos `dias` días. */
export function historialDemo(dias = 60) {
  const r = aleatorio(20260904)
  const pedidos = []
  let numero = 0

  for (let d = dias; d >= 1; d--) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - d)
    const dow = fecha.getDay() // 0 dom … 6 sáb

    // Benavídez abre miércoles a domingo; Escobar todos los días.
    const locales = dow >= 3 || dow === 0 ? ['benavidez', 'escobar'] : ['escobar']

    // El viernes y el sábado son los días fuertes (se ve en el reporte de Fudo).
    const base = { 0: 26, 1: 12, 2: 12, 3: 16, 4: 18, 5: 38, 6: 34 }[dow]
    const cantidad = Math.round(base * (0.8 + r() * 0.45))

    for (let i = 0; i < cantidad; i++) {
      const minutos = Math.floor(r() * 210) // 19:30 -> 23:00
      const creado = new Date(fecha)
      creado.setHours(19, 30 + minutos, Math.floor(r() * 60), 0)

      const items = []
      const cuantos = 1 + Math.floor(r() * 2.6)
      for (let k = 0; k < cuantos; k++) {
        const it = elegirItem(r)
        const ya = items.find((x) => x.id === it.id)
        if (ya) ya.cantidad += 1
        else
          items.push({
            id: it.id,
            nombre: nombreCompleto(it),
            cantidad: 1,
            precio: it.precio,
            categoriaId: it.categoriaId,
          })
      }

      const subtotal = items.reduce((a, x) => a + x.precio * x.cantidad, 0)
      const pago = PAGOS[Math.floor(r() * PAGOS.length)]
      const descuento = pago === 'efectivo' ? Math.round(subtotal * 0.1) : 0
      const modalidad = r() < 0.62 ? 'delivery' : 'retiro'
      const nombre = `${NOMBRES[Math.floor(r() * NOMBRES.length)]} ${APELLIDOS[Math.floor(r() * APELLIDOS.length)]}`

      numero += 1
      pedidos.push({
        id: `h-${d}-${i}`,
        numero,
        creado_en: creado.toISOString(),
        modalidad,
        local: locales[Math.floor(r() * locales.length)],
        cliente_nombre: nombre,
        cliente_telefono: `11 ${3000 + Math.floor(r() * 6999)} ${1000 + Math.floor(r() * 8999)}`,
        cliente_email: r() < 0.55 ? `${nombre.split(' ')[0].toLowerCase()}@gmail.com` : null,
        direccion:
          modalidad === 'delivery'
            ? `${CALLES[Math.floor(r() * CALLES.length)]} ${100 + Math.floor(r() * 3900)}`
            : null,
        nota: null,
        items,
        subtotal,
        descuento,
        total: subtotal - descuento,
        pago,
        estado: 'entregado',
        demora_min: [20, 25, 30, 40, 45][Math.floor(r() * 5)],
        efectivo_cobrado: pago === 'efectivo',
        avisado: true,
        origen: r() < 0.22 ? 'Pedidos Ya' : 'Tienda Online',
      })
    }
  }
  return pedidos
}
