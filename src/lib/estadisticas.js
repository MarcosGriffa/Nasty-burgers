// Todo lo que muestran Estadísticas y Reportes sale de acá: se calcula sobre
// los pedidos reales, no hay números escritos a mano en las pantallas.

import { CATEGORIAS } from '../data/negocio'
import { comisiones, etiquetaPago } from './cobros'

const NOMBRE_CAT = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c.nombre]))

export const PERIODOS = [
  { id: '7', label: 'Últimos 7 días', dias: 7 },
  { id: '30', label: 'Últimos 30 días', dias: 30 },
  { id: '90', label: 'Últimos 3 meses', dias: 90 },
  { id: '365', label: 'Últimos 12 meses', dias: 365 },
]

const inicioDia = (d) => {
  const f = new Date(d)
  f.setHours(0, 0, 0, 0)
  return f
}

/** Pedidos que cuentan como venta (todo lo aceptado). */
export const esVenta = (p) => p.estado !== 'rechazado'

export function filtrar(pedidos, { dias = 30, local = 'todos', desde, hasta } = {}) {
  const d0 = desde ? inicioDia(desde) : inicioDia(new Date(Date.now() - (dias - 1) * 86400000))
  const d1 = hasta ? new Date(hasta) : new Date()
  return pedidos.filter((p) => {
    if (!esVenta(p)) return false
    const f = new Date(p.creado_en)
    if (f < d0 || f > d1) return false
    if (local !== 'todos' && p.local !== local) return false
    return true
  })
}

export function resumen(pedidos) {
  const brutas = pedidos.reduce((a, p) => a + (p.subtotal ?? p.total ?? 0), 0)
  const descuentos = pedidos.reduce((a, p) => a + (p.descuento || 0), 0)
  const netas = brutas - descuentos
  const cantidad = pedidos.length
  return {
    brutas,
    descuentos,
    netas,
    cantidad,
    promedio: cantidad ? Math.round(netas / cantidad) : 0,
  }
}

/** Compara con el período inmediatamente anterior, del mismo largo. */
export function comparar(todos, dias, local = 'todos') {
  const actual = resumen(filtrar(todos, { dias, local }))
  const hasta = new Date(Date.now() - dias * 86400000)
  const desde = new Date(Date.now() - dias * 2 * 86400000)
  const previo = resumen(filtrar(todos, { desde, hasta, local }))
  const variacion = (a, b) => (b ? Math.round(((a - b) / b) * 1000) / 10 : null)
  return {
    ...actual,
    vs: {
      brutas: variacion(actual.brutas, previo.brutas),
      netas: variacion(actual.netas, previo.netas),
      cantidad: variacion(actual.cantidad, previo.cantidad),
      promedio: variacion(actual.promedio, previo.promedio),
      descuentos: variacion(actual.descuentos, previo.descuentos),
    },
  }
}

export function serieDiaria(pedidos, dias) {
  const mapa = new Map()
  for (let i = dias - 1; i >= 0; i--) {
    const f = inicioDia(new Date(Date.now() - i * 86400000))
    mapa.set(f.toDateString(), {
      label: f.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      a: 0,
      cantidad: 0,
    })
  }
  pedidos.forEach((p) => {
    const k = inicioDia(new Date(p.creado_en)).toDateString()
    const e = mapa.get(k)
    if (e) {
      e.a += p.total || 0
      e.cantidad += 1
    }
  })
  return [...mapa.values()]
}

export function serieMensual(pedidos, gastos = [], meses = 9) {
  const mapa = new Map()
  for (let i = meses - 1; i >= 0; i--) {
    const f = new Date()
    f.setDate(1)
    f.setMonth(f.getMonth() - i)
    mapa.set(`${f.getFullYear()}-${f.getMonth()}`, {
      label: f.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
      a: 0,
      b: 0,
    })
  }
  const sumar = (fechaIso, campo, monto) => {
    const f = new Date(fechaIso)
    const e = mapa.get(`${f.getFullYear()}-${f.getMonth()}`)
    if (e) e[campo] += monto
  }
  pedidos.forEach((p) => sumar(p.creado_en, 'a', p.total || 0))
  gastos.forEach((g) => sumar(g.fecha, 'b', Number(g.importe) || 0))
  return [...mapa.values()]
}

export function porHora(pedidos) {
  const horas = Array.from({ length: 24 }, (_, h) => ({ label: `${String(h).padStart(2, '0')}`, a: 0 }))
  pedidos.forEach((p) => {
    horas[new Date(p.creado_en).getHours()].a += p.total || 0
  })
  // El local abre de noche: mostramos solo la franja con movimiento.
  const conVentas = horas.filter((h) => h.a > 0)
  if (!conVentas.length) return horas.slice(18, 24)
  const primera = horas.findIndex((h) => h.a > 0)
  const ultima = horas.length - 1 - [...horas].reverse().findIndex((h) => h.a > 0)
  return horas.slice(Math.max(0, primera - 1), Math.min(24, ultima + 2))
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function porDiaSemana(pedidos) {
  const acum = DIAS.map((d) => ({ label: d, a: 0 }))
  pedidos.forEach((p) => {
    acum[new Date(p.creado_en).getDay()].a += p.total || 0
  })
  // Semana de lunes a domingo, como la muestra Fudo.
  return [...acum.slice(1), acum[0]]
}

/** Ranking de productos con costo, CMV y markup. */
export function rankingProductos(pedidos, productos = []) {
  const costoDe = new Map(productos.map((p) => [p.nombre, Number(p.costo) || 0]))
  const mapa = new Map()
  pedidos.forEach((p) =>
    (p.items || []).forEach((i) => {
      const e = mapa.get(i.nombre) ?? {
        nombre: i.nombre,
        categoria: NOMBRE_CAT[i.categoriaId] ?? '—',
        cantidad: 0,
        venta: 0,
        costo: 0,
      }
      e.cantidad += i.cantidad
      e.venta += i.precio * i.cantidad
      e.costo += (costoDe.get(i.nombre) ?? Math.round(i.precio * 0.25)) * i.cantidad
      mapa.set(i.nombre, e)
    }),
  )
  return [...mapa.values()]
    .map((e) => ({
      ...e,
      cmv: e.venta ? Math.round((e.costo / e.venta) * 1000) / 10 : 0,
      markup: e.costo ? Math.round(((e.venta - e.costo) / e.costo) * 100) : null,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
}

export function porCategoria(pedidos) {
  const mapa = new Map()
  pedidos.forEach((p) =>
    (p.items || []).forEach((i) => {
      const cat = NOMBRE_CAT[i.categoriaId] ?? 'Otros'
      mapa.set(cat, (mapa.get(cat) || 0) + i.precio * i.cantidad)
    }),
  )
  return [...mapa.entries()]
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor)
}

export function porMedioDePago(pedidos) {
  const mapa = new Map()
  pedidos.forEach((p) => {
    const k = etiquetaPago(p.pago)
    mapa.set(k, (mapa.get(k) || 0) + (p.total || 0))
  })
  return [...mapa.entries()].map(([label, valor]) => ({ label, valor })).sort((a, b) => b.valor - a.valor)
}

export function porModalidad(pedidos) {
  const d = pedidos.filter((p) => p.modalidad === 'delivery')
  const r = pedidos.filter((p) => p.modalidad !== 'delivery')
  return [
    { label: 'Delivery', valor: d.reduce((a, p) => a + (p.total || 0), 0), cantidad: d.length },
    { label: 'Take away', valor: r.reduce((a, p) => a + (p.total || 0), 0), cantidad: r.length },
  ]
}

export function porOrigen(pedidos) {
  const mapa = new Map()
  pedidos.forEach((p) => {
    const k = p.origen || 'Tienda Online'
    mapa.set(k, (mapa.get(k) || 0) + (p.total || 0))
  })
  return [...mapa.entries()].map(([label, valor]) => ({ label, valor })).sort((a, b) => b.valor - a.valor)
}

/** Estado de resultados: ventas, CMV, gastos y ganancia. */
/**
 * `medios` son los medios de pago configurados. Sin ellos la comisión da cero y
 * la ganancia neta queda inflada: lo que se lleva Mercado Pago o la tarjeta
 * nunca entró a la caja, así que es un gasto de venta como cualquier otro.
 */
export function estadoResultados(pedidos, gastos, productos, medios = []) {
  const r = resumen(pedidos)
  const ranking = rankingProductos(pedidos, productos)
  const cmv = ranking.reduce((a, p) => a + p.costo, 0)
  const gastoTotal = gastos.reduce((a, g) => a + (Number(g.importe) || 0), 0)
  const cob = comisiones(pedidos, medios)
  const brutaGanancia = r.netas - cmv
  const neta = brutaGanancia - gastoTotal - cob.total
  return {
    ...r,
    cmv,
    gastos: gastoTotal,
    comisiones: cob.total,
    comisionesSinAsignar: cob.sinAsignar,
    gananciaBruta: brutaGanancia,
    gananciaNeta: neta,
    margenBruto: r.netas ? Math.round((brutaGanancia / r.netas) * 1000) / 10 : 0,
    margenNeto: r.netas ? Math.round((neta / r.netas) * 1000) / 10 : 0,
  }
}

/** Clientes deducidos de los pedidos: cuántas compras, cuánto gastaron. */
export function clientesDePedidos(pedidos) {
  const mapa = new Map()
  pedidos.forEach((p) => {
    const k = (p.cliente_telefono || p.cliente_nombre || '').replace(/\D/g, '') || p.cliente_nombre
    if (!k) return
    const e = mapa.get(k) ?? {
      id: k,
      nombre: p.cliente_nombre,
      telefono: p.cliente_telefono,
      email: p.cliente_email,
      origen: p.origen || 'Tienda Online',
      compras: 0,
      gastado: 0,
      ultima: p.creado_en,
    }
    e.compras += 1
    e.gastado += p.total || 0
    if (new Date(p.creado_en) > new Date(e.ultima)) {
      e.ultima = p.creado_en
      e.telefono = p.cliente_telefono || e.telefono
      e.email = p.cliente_email || e.email
    }
    mapa.set(k, e)
  })
  const hoy = Date.now()
  return [...mapa.values()]
    .map((c) => {
      const dias = Math.floor((hoy - new Date(c.ultima).getTime()) / 86400000)
      return {
        ...c,
        ticket: c.compras ? Math.round(c.gastado / c.compras) : 0,
        grupo: dias > 45 ? 'Dormido' : c.compras >= 5 ? 'Fiel' : c.compras >= 2 ? 'Regular' : 'Nuevo',
      }
    })
    .sort((a, b) => b.gastado - a.gastado)
}

/** Consumo de ingredientes, según la receta cargada en cada producto. */
export function consumoIngredientes(pedidos, productos) {
  const porNombre = new Map(productos.map((p) => [p.nombre, p.receta || []]))
  const mapa = new Map()
  pedidos.forEach((p) =>
    (p.items || []).forEach((i) => {
      const receta = porNombre.get(i.nombre)
      if (!receta?.length) return
      receta.forEach((r) => {
        const bruta = (Number(r.neta) || 0) * (1 + (Number(r.merma) || 0) / 100)
        mapa.set(r.ingrediente, (mapa.get(r.ingrediente) || 0) + bruta * i.cantidad)
      })
    }),
  )
  return mapa
}
