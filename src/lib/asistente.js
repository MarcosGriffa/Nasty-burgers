import { CATEGORIAS, NEGOCIO } from '../data/negocio'
import { normalizar, pesos } from './utils'
import { preguntarAGemini } from './ia'

/**
 * Asistente de precios.
 *
 * REGLA DE ORO: la IA nunca toca la base. Lo único que hace es traducir una
 * frase ("subí las hamburguesas un 10%") a un PLAN con forma fija. Después el
 * sistema valida ese plan, simula los cambios, se los muestra al empleado y
 * recién cuando él confirma se escribe. Si la IA devolviera cualquier otra
 * cosa, el plan se descarta.
 *
 * Por eso el asistente sólo puede tocar precios y promos: no existe ninguna
 * operación de "borrar producto" o "cambiar el stock" en el esquema.
 */

// ---------------------------------------------------------------- operaciones
export const OPERACIONES = {
  ajustar_porcentaje: 'Subir o bajar un porcentaje',
  ajustar_monto: 'Sumar o restar un monto fijo',
  fijar_precio: 'Poner un precio exacto',
  activar_promo: 'Activar un descuento',
  desactivar_promo: 'Desactivar un descuento',
}

export const REDONDEOS = [
  { id: 'ninguno', label: 'Sin redondear' },
  { id: '50', label: 'A los $50' },
  { id: '100', label: 'A los $100' },
  { id: '500', label: 'A los $500' },
]

const redondear = (n, modo) => {
  const paso = Number(modo)
  if (!paso) return Math.round(n)
  return Math.round(n / paso) * paso
}

// ------------------------------------------------------------------- alcance
/** Devuelve los productos que caen dentro del alcance del plan. */
export function alcanzados(plan, productos) {
  const { tipo, valores = [] } = plan.alcance ?? {}
  const nv = valores.map((v) => normalizar(String(v)))

  if (tipo === 'todos') return productos
  if (tipo === 'categoria') {
    // Primero se busca coincidencia EXACTA de categoría. Si se buscara por
    // "contiene", pedir "las papas" agarraría también "Hamburguesas c/ Papas
    // Fritas", que es justo lo que no queremos.
    const exactos = productos.filter((p) => nv.includes(normalizar(p.categoria || '')))
    if (exactos.length) return exactos
    return productos.filter((p) => nv.some((v) => normalizar(p.categoria || '').includes(v)))
  }
  if (tipo === 'subcategoria') return productos.filter((p) => nv.some((v) => normalizar(p.subcategoria || '') === v))
  if (tipo === 'productos') return productos.filter((p) => nv.some((v) => normalizar(p.nombre || '') === v))
  if (tipo === 'busqueda') return productos.filter((p) => nv.some((v) => normalizar(p.nombre || '').includes(v)))
  return []
}

/** Convierte un plan en la lista concreta de cambios, sin escribir nada. */
export function simular(plan, productos) {
  const objetivo = alcanzados(plan, productos)
  const modo = plan.redondeo ?? 'ninguno'

  return objetivo
    .map((p) => {
      const antes = Number(p.precio) || 0
      let despues = antes
      if (plan.operacion === 'ajustar_porcentaje') despues = antes * (1 + Number(plan.valor) / 100)
      else if (plan.operacion === 'ajustar_monto') despues = antes + Number(plan.valor)
      else if (plan.operacion === 'fijar_precio') despues = Number(plan.valor)
      despues = Math.max(0, redondear(despues, modo))
      return { id: p.id, nombre: p.nombre, categoria: p.categoria, antes, despues }
    })
    .filter((c) => c.antes !== c.despues)
}

// --------------------------------------------------------------- validación
const OPS_VALIDAS = Object.keys(OPERACIONES)
const TIPOS_VALIDOS = ['todos', 'categoria', 'subcategoria', 'productos', 'busqueda']

export function validar(plan) {
  if (!plan || typeof plan !== 'object') return 'No entendí el pedido.'
  if (!OPS_VALIDAS.includes(plan.operacion)) return 'Esa operación no está permitida.'

  if (plan.operacion.startsWith('ajustar') || plan.operacion === 'fijar_precio') {
    if (!plan.alcance || !TIPOS_VALIDOS.includes(plan.alcance.tipo)) return 'No entendí a qué productos aplicarlo.'
    if (!Number.isFinite(Number(plan.valor))) return 'No entendí el valor del cambio.'
    if (plan.operacion === 'ajustar_porcentaje' && Math.abs(plan.valor) > 100)
      return 'Un ajuste de más del 100% no se puede aplicar de una. Hacelo en dos pasos si es a propósito.'
    if (plan.operacion === 'fijar_precio' && Number(plan.valor) < 0) return 'El precio no puede ser negativo.'
  }
  return null
}

// ----------------------------------------------------------- parser local
// Cubre las frases habituales sin gastar un peso ni depender de internet.
// Si no entiende, recién ahí se le pregunta a la IA.

const SINONIMOS = [
  { claves: ['gaseosa', 'gaseosas', 'bebida', 'bebidas', 'coca', 'sprite'], tipo: 'categoria', valores: ['Bebidas'] },
  { claves: ['cerveza', 'cervezas', 'birra', 'birras'], tipo: 'categoria', valores: ['Cerveza'] },
  { claves: ['papa', 'papas', 'fritas'], tipo: 'categoria', valores: ['Papas Fritas'] },
  { claves: ['extra', 'extras'], tipo: 'categoria', valores: ['Extras'] },
  {
    claves: ['hamburguesa', 'hamburguesas', 'burger', 'burgers', 'burga', 'burgas'],
    tipo: 'categoria',
    valores: ['Hamburguesas c/ Papas Fritas'],
  },
  { claves: ['simple', 'simples'], tipo: 'subcategoria', valores: ['Simple'] },
  { claves: ['doble', 'dobles'], tipo: 'subcategoria', valores: ['Doble'] },
  { claves: ['triple', 'triples'], tipo: 'subcategoria', valores: ['Triple'] },
]

const detectarAlcance = (t, productos) => {
  // 1) Un producto nombrado con todas las letras gana sobre cualquier sinónimo:
  //    "poné la Nasty Doble en 20000" es UN producto, no todas las dobles.
  //    Se prueba del nombre más largo al más corto para no cazar de menos.
  const porNombre = [...productos]
    .sort((a, b) => (b.nombre || '').length - (a.nombre || '').length)
    .find((p) => p.nombre && t.includes(normalizar(p.nombre)))
  if (porNombre) return { tipo: 'productos', valores: [porNombre.nombre] }

  // 2) Categorías y subcategorías por sinónimo.
  for (const s of SINONIMOS) {
    if (s.claves.some((c) => new RegExp(`\\b${c}\\b`).test(t))) return { tipo: s.tipo, valores: s.valores }
  }

  // 3) "todo", "toda la carta", "los precios".
  if (/\b(todo|toda|todos|todas|la carta|el menu|el menú|los precios|precios)\b/.test(t))
    return { tipo: 'todos', valores: [] }

  return null
}

const numeroDe = (s) => Number(String(s).replace(/[.\s]/g, '').replace(',', '.'))

export function interpretarLocal(texto, productos) {
  const t = normalizar(texto)
  const baja = /\b(baj|reduc|descont|rest|saca|quit)/.test(t)
  const alcance = detectarAlcance(t, productos)

  // "poné las gaseosas en 5000" / "dejá la nasty doble a $18.000"
  const fijo = t.match(/\b(?:pone|poner|deja|dejar|fija|fijar|queda|quedan)\b[^0-9]*\$?\s*([\d.,]+)/)
  if (fijo && alcance && !/%/.test(t)) {
    return { operacion: 'fijar_precio', alcance, valor: numeroDe(fijo[1]), redondeo: 'ninguno', fuente: 'local' }
  }

  // porcentaje: "un 10%", "10 por ciento"
  const pct = t.match(/([\d.,]+)\s*(?:%|por\s*ciento)/)
  if (pct && alcance) {
    const v = numeroDe(pct[1])
    return {
      operacion: 'ajustar_porcentaje',
      alcance,
      valor: baja ? -v : v,
      redondeo: '50',
      fuente: 'local',
    }
  }

  // monto: "2000 pesos menos", "$2000", "menos 2000"
  const monto = t.match(/\$?\s*([\d.]{3,})\s*(?:pesos)?/)
  if (monto && alcance) {
    const v = numeroDe(monto[1])
    if (Number.isFinite(v) && v > 0) {
      return {
        operacion: 'ajustar_monto',
        alcance,
        valor: baja || /\bmenos\b/.test(t) ? -v : v,
        redondeo: 'ninguno',
        fuente: 'local',
      }
    }
  }

  return null
}

// ------------------------------------------------------------------ la IA
/**
 * Contexto que se le manda al modelo. Es corto a propósito: cuanto menos
 * texto, más barato y más difícil que se distraiga.
 */
export function contextoDelNegocio(productos, descuentos = []) {
  const porCategoria = new Map()
  productos.forEach((p) => {
    const k = p.categoria || 'Sin categoría'
    if (!porCategoria.has(k)) porCategoria.set(k, [])
    porCategoria.get(k).push(`${p.nombre}${p.subcategoria ? ` [${p.subcategoria}]` : ''} ${p.precio}`)
  })

  return [
    `Negocio: ${NEGOCIO.nombre}, hamburguesería en Benavídez y Escobar (Argentina). Precios en pesos argentinos.`,
    `Categorías del menú: ${CATEGORIAS.map((c) => c.nombre).join(', ')}.`,
    `Subcategorías de hamburguesas: Simple, Doble, Triple.`,
    descuentos.length ? `Descuentos existentes: ${descuentos.map((d) => d.nombre).join(', ')}.` : '',
    '',
    'CATÁLOGO (nombre [subcategoría] precio):',
    ...[...porCategoria.entries()].map(([cat, items]) => `${cat}: ${items.join(' | ')}`),
  ]
    .filter(Boolean)
    .join('\n')
}

const INSTRUCCIONES = `Sos el asistente de precios de una hamburguesería. Traducís lo que pide el encargado a un plan estructurado.

Sólo podés hacer cinco cosas: subir o bajar un porcentaje, sumar o restar un monto fijo, poner un precio exacto, activar un descuento o desactivar un descuento. No podés borrar productos, tocar el stock, cambiar recetas ni ninguna otra cosa: si te piden algo así, devolvé operacion "ninguna" y explicá en "aclaracion" que sólo manejás precios y promos.

Reglas:
- "gaseosas" = categoría Bebidas. "birras" = Cerveza. "burgas"/"hamburguesas" = las categorías de hamburguesas.
- "dobles", "triples", "simples" son subcategorías, no categorías.
- Si dicen "todo" o "toda la carta", el alcance es todos.
- Los montos vienen en pesos argentinos; "2000 pesos menos" es ajustar_monto con valor -2000.
- Si la suba es por inflación, redondeá a 50 salvo que pidan otra cosa.
- Si algo es ambiguo (no queda claro a qué productos aplica o cuánto), devolvé operacion "ninguna" y preguntá en "aclaracion".
- Escribí "resumen" en una sola línea, en castellano rioplatense, describiendo lo que vas a hacer.`

const ESQUEMA = {
  type: 'object',
  properties: {
    operacion: {
      type: 'string',
      enum: [...OPS_VALIDAS, 'ninguna'],
    },
    alcance: {
      type: 'object',
      properties: {
        tipo: { type: 'string', enum: TIPOS_VALIDOS },
        valores: { type: 'array', items: { type: 'string' } },
      },
      required: ['tipo', 'valores'],
    },
    valor: { type: 'number' },
    redondeo: { type: 'string', enum: ['ninguno', '50', '100', '500'] },
    nombre_promo: { type: 'string' },
    resumen: { type: 'string' },
    aclaracion: { type: 'string' },
  },
  required: ['operacion', 'resumen'],
}

/**
 * Llama al modelo. Por defecto pega contra /api/asistente, una función
 * serverless que guarda la API key del lado del servidor (ver api/asistente.js).
 * Si no hay endpoint y sí hay VITE_GEMINI_API_KEY, pega directo — sirve para
 * probar en tu máquina, NO para producción: una key en el navegador la puede
 * leer cualquiera.
 */
export async function interpretarIA(texto, contexto) {
  const crudo = await preguntarAGemini({
    modo: 'precios',
    instrucciones: INSTRUCCIONES,
    contexto,
    texto: `Pedido del encargado: "${texto}"`,
    esquema: ESQUEMA,
  })
  const plan = typeof crudo === 'string' ? JSON.parse(crudo) : crudo
  return { ...plan, fuente: 'ia' }
}

// --------------------------------------------------------------- descripción
export function describir(plan, cambios) {
  if (!plan) return ''
  const cuantos = `${cambios.length} ${cambios.length === 1 ? 'producto' : 'productos'}`
  if (plan.operacion === 'ajustar_porcentaje')
    return `${plan.valor >= 0 ? 'Subir' : 'Bajar'} ${Math.abs(plan.valor)}% en ${cuantos}`
  if (plan.operacion === 'ajustar_monto')
    return `${plan.valor >= 0 ? 'Sumar' : 'Restar'} ${pesos(Math.abs(plan.valor))} en ${cuantos}`
  if (plan.operacion === 'fijar_precio') return `Dejar ${cuantos} en ${pesos(plan.valor)}`
  if (plan.operacion === 'activar_promo') return `Activar el descuento «${plan.nombre_promo}»`
  if (plan.operacion === 'desactivar_promo') return `Desactivar el descuento «${plan.nombre_promo}»`
  return ''
}
