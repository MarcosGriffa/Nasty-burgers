import { CATEGORIAS, NEGOCIO } from '../data/negocio'
import { costoReceta } from './menu'
import { normalizar, pesos } from './utils'
import { preguntarAGemini } from './ia'

/**
 * Asistente del negocio.
 *
 * REGLA DE ORO: la IA nunca toca la base. Lo único que hace es traducir una
 * frase ("subí las hamburguesas un 10%", "agregale bacon a la Critical Doble")
 * a un PLAN con forma fija. Después el sistema valida ese plan, simula los
 * cambios, se los muestra al empleado y recién cuando él confirma se escribe.
 * Si la IA devolviera cualquier otra cosa, el plan se descarta.
 *
 * Hoy el asistente puede tocar precios, promos, recetas y qué opciones ofrece
 * cada producto. No puede borrar productos, mover stock ni cambiar pedidos: esas
 * operaciones directamente no existen en el esquema, así que no hay forma de
 * que las pida.
 */

// ---------------------------------------------------------------- operaciones
export const OPERACIONES = {
  ajustar_porcentaje: 'Subir o bajar un porcentaje',
  ajustar_monto: 'Sumar o restar un monto fijo',
  fijar_precio: 'Poner un precio exacto',
  activar_promo: 'Activar un descuento',
  desactivar_promo: 'Desactivar un descuento',
  agregar_ingrediente: 'Agregar un ingrediente a la receta',
  quitar_ingrediente: 'Sacar un ingrediente de la receta',
  cambiar_cantidad: 'Cambiar cuánto lleva un ingrediente',
  agregar_modificador: 'Ofrecer un grupo de opciones',
  quitar_modificador: 'Dejar de ofrecer un grupo de opciones',
}

/** Las que tocan el precio: la pantalla les muestra la tabla de antes/después. */
export const OPS_PRECIO = ['ajustar_porcentaje', 'ajustar_monto', 'fijar_precio']
const OPS_RECETA = ['agregar_ingrediente', 'quitar_ingrediente', 'cambiar_cantidad']
const OPS_MODIF = ['agregar_modificador', 'quitar_modificador']

export const esDePrecio = (op) => OPS_PRECIO.includes(op)
export const esDeReceta = (op) => OPS_RECETA.includes(op)
export const esDeModificador = (op) => OPS_MODIF.includes(op)

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

const mismoNombre = (a, b) => normalizar(String(a ?? '')) === normalizar(String(b ?? ''))

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

// --------------------------------------------------------------- simulación
/**
 * Cuánto poner de un ingrediente cuando el encargado no lo dice. Se copia de
 * lo que ya lleva ese mismo ingrediente en otras recetas: si el bacon va de a
 * 30 g en toda la carta, el bacon nuevo también va de a 30 g.
 */
export function cantidadSugerida(nombre, productos) {
  const vistas = productos
    .flatMap((p) => p.receta ?? [])
    .filter((r) => mismoNombre(r.ingrediente, nombre))
    .map((r) => Number(r.neta) || 0)
    .filter((n) => n > 0)
    .sort((a, b) => a - b)
  if (!vistas.length) return 1
  return vistas[Math.floor(vistas.length / 2)]
}

const simularPrecios = (plan, objetivo) => {
  const modo = plan.redondeo ?? 'ninguno'
  return objetivo
    .map((p) => {
      const antes = Number(p.precio) || 0
      let despues = antes
      if (plan.operacion === 'ajustar_porcentaje') despues = antes * (1 + Number(plan.valor) / 100)
      else if (plan.operacion === 'ajustar_monto') despues = antes + Number(plan.valor)
      else if (plan.operacion === 'fijar_precio') despues = Number(plan.valor)
      despues = Math.max(0, redondear(despues, modo))
      return { id: p.id, nombre: p.nombre, categoria: p.categoria, campo: 'precio', antes, despues }
    })
    .filter((c) => c.antes !== c.despues)
}

const simularReceta = (plan, objetivo, ingredientes, todos) => {
  const ing = ingredientes.find((i) => mismoNombre(i.nombre, plan.ingrediente))
  if (!ing) return []
  const cantidad = Number(plan.cantidad) > 0 ? Number(plan.cantidad) : null

  return objetivo
    .map((p) => {
      const receta = p.receta ?? []
      const idx = receta.findIndex((r) => mismoNombre(r.ingrediente, ing.nombre))
      let nueva = receta
      let detalle = ''

      if (plan.operacion === 'agregar_ingrediente') {
        const neta = cantidad ?? cantidadSugerida(ing.nombre, todos)
        if (idx >= 0) {
          // Ya lo tiene: en vez de duplicarlo, se le ajusta la cantidad.
          if ((Number(receta[idx].neta) || 0) === neta) return null
          nueva = receta.map((r, i) => (i === idx ? { ...r, neta } : r))
          detalle = `${ing.nombre}: ${receta[idx].neta} → ${neta} ${ing.unidad}`
        } else {
          nueva = [...receta, { ingrediente: ing.nombre, neta, merma: 0, mostrar_web: true }]
          detalle = `+ ${ing.nombre} ${neta} ${ing.unidad}`
        }
      } else if (plan.operacion === 'quitar_ingrediente') {
        if (idx < 0) return null
        nueva = receta.filter((_, i) => i !== idx)
        detalle = `− ${ing.nombre}`
      } else {
        // cambiar_cantidad
        if (idx < 0 || cantidad === null) return null
        if ((Number(receta[idx].neta) || 0) === cantidad) return null
        nueva = receta.map((r, i) => (i === idx ? { ...r, neta: cantidad } : r))
        detalle = `${ing.nombre}: ${receta[idx].neta} → ${cantidad} ${ing.unidad}`
      }

      return {
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria,
        campo: 'receta',
        antes: receta,
        despues: nueva,
        detalle,
        // El costo se recalcula solo salvo que el producto lo tenga a mano.
        costoAntes: p.costo_manual ? Number(p.costo) || 0 : costoReceta(receta, ingredientes),
        costoDespues: p.costo_manual ? Number(p.costo) || 0 : costoReceta(nueva, ingredientes),
        costo_manual: !!p.costo_manual,
        precio: Number(p.precio) || 0,
      }
    })
    .filter(Boolean)
}

const simularModificadores = (plan, objetivo, grupos) => {
  const g = grupos.find((x) => mismoNombre(x.nombre, plan.grupo))
  if (!g) return []

  return objetivo
    .map((p) => {
      const actuales = p.modificadores ?? []
      const tiene = actuales.some((n) => mismoNombre(n, g.nombre))
      if (plan.operacion === 'agregar_modificador' && tiene) return null
      if (plan.operacion === 'quitar_modificador' && !tiene) return null
      const nueva =
        plan.operacion === 'agregar_modificador'
          ? [...actuales, g.nombre]
          : actuales.filter((n) => !mismoNombre(n, g.nombre))
      return {
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria,
        campo: 'modificadores',
        antes: actuales,
        despues: nueva,
        detalle: `${plan.operacion === 'agregar_modificador' ? '+' : '−'} ${g.nombre}`,
      }
    })
    .filter(Boolean)
}

/**
 * Convierte un plan en la lista concreta de cambios, sin escribir nada.
 * `catalogo` trae los ingredientes y los grupos porque las recetas los miran.
 */
export function simular(plan, productos, catalogo = {}) {
  const { ingredientes = [], grupos = [] } = catalogo
  const objetivo = alcanzados(plan, productos)

  if (esDePrecio(plan.operacion)) return simularPrecios(plan, objetivo)
  if (esDeReceta(plan.operacion)) return simularReceta(plan, objetivo, ingredientes, productos)
  if (esDeModificador(plan.operacion)) return simularModificadores(plan, objetivo, grupos)
  return []
}

/**
 * Lo que se escribe en el producto por cada cambio. Para las recetas también
 * se guarda el costo nuevo, así el margen del panel no queda viejo.
 */
export function camposDelCambio(cambio, ingredientes = []) {
  if (cambio.campo === 'receta') {
    const base = { receta: cambio.despues }
    if (cambio.costo_manual) return base
    return { ...base, costo: costoReceta(cambio.despues, ingredientes) }
  }
  return { [cambio.campo]: cambio.despues }
}

/** Lo mismo pero al revés, para el botón de deshacer. */
export function camposParaDeshacer(cambio, ingredientes = []) {
  if (cambio.campo === 'receta') {
    const base = { receta: cambio.antes }
    if (cambio.costo_manual) return base
    return { ...base, costo: costoReceta(cambio.antes, ingredientes) }
  }
  return { [cambio.campo]: cambio.antes }
}

// --------------------------------------------------------------- validación
const OPS_VALIDAS = Object.keys(OPERACIONES)
const TIPOS_VALIDOS = ['todos', 'categoria', 'subcategoria', 'productos', 'busqueda']

export function validar(plan, catalogo = {}) {
  const { ingredientes = [], grupos = [] } = catalogo
  if (!plan || typeof plan !== 'object') return 'No entendí el pedido.'
  if (!OPS_VALIDAS.includes(plan.operacion)) return 'Esa operación no está permitida.'

  const necesitaAlcance =
    esDePrecio(plan.operacion) || esDeReceta(plan.operacion) || esDeModificador(plan.operacion)
  if (necesitaAlcance && (!plan.alcance || !TIPOS_VALIDOS.includes(plan.alcance.tipo)))
    return 'No entendí a qué productos aplicarlo.'

  if (esDePrecio(plan.operacion)) {
    if (!Number.isFinite(Number(plan.valor))) return 'No entendí el valor del cambio.'
    if (plan.operacion === 'ajustar_porcentaje' && Math.abs(plan.valor) > 100)
      return 'Un ajuste de más del 100% no se puede aplicar de una. Hacelo en dos pasos si es a propósito.'
    if (plan.operacion === 'fijar_precio' && Number(plan.valor) < 0) return 'El precio no puede ser negativo.'
  }

  if (esDeReceta(plan.operacion)) {
    if (!plan.ingrediente) return 'No entendí qué ingrediente querés tocar.'
    // El ingrediente TIENE que existir en la lista: así la IA no puede inventar
    // uno nuevo ni escribirlo mal y dejar la receta rota.
    const ing = ingredientes.find((i) => mismoNombre(i.nombre, plan.ingrediente))
    if (!ing)
      return `«${plan.ingrediente}» no está cargado como ingrediente. Cargalo primero en Ingredientes y volvé a pedirlo.`
    if (plan.cantidad != null && !(Number(plan.cantidad) >= 0))
      return 'La cantidad del ingrediente no puede ser negativa.'
    if (plan.operacion === 'cambiar_cantidad' && !(Number(plan.cantidad) > 0))
      return 'Decime a cuánto lo querés dejar.'
  }

  if (esDeModificador(plan.operacion)) {
    if (!plan.grupo) return 'No entendí qué grupo de opciones querés tocar.'
    const g = grupos.find((x) => mismoNombre(x.nombre, plan.grupo))
    if (!g)
      return `No existe un grupo de opciones llamado «${plan.grupo}». Los que hay son: ${grupos.map((x) => x.nombre).join(', ')}.`
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
    claves: ['hamburguesa', 'hamburguesas', 'burger', 'burgers', 'burga', 'burgas', 'combo', 'combos'],
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

/**
 * Busca en la frase un ingrediente de la lista. Se prueba del nombre más largo
 * al más corto para que "bacon bits" gane sobre "bacon".
 */
const detectarIngrediente = (t, ingredientes) =>
  [...ingredientes]
    .sort((a, b) => (b.nombre || '').length - (a.nombre || '').length)
    .find((i) => i.nombre && t.includes(normalizar(i.nombre)))

export function interpretarLocal(texto, productos, catalogo = {}) {
  const { ingredientes = [] } = catalogo
  const t = normalizar(texto)
  const baja = /\b(baj|reduc|descont|rest|saca|quit)/.test(t)
  const alcance = detectarAlcance(t, productos)

  // ---- recetas: "agregale bacon a la critical doble", "sacale pickles a las dobles"
  //
  // Sólo se toma este camino si la frase NO habla de plata: un porcentaje o la
  // palabra "precio" la mandan al parser de precios de más abajo. Si no, pedir
  // "subí las hamburguesas con papas un 10%" se leería como tocar la receta.
  const hablaDePlata = /%|\bpor\s*ciento\b|\bprecio|\bpesos\b|\$/.test(t)
  const sumarIng = /\b(agrega|agregale|agregales|agregarle|agregar|ponele|poneles|sumale|sumales|sumar)\b/.test(t)
  const restarIng = /\b(saca|sacale|sacales|sacarle|sacar|quita|quitale|quitar)\b/.test(t)
  if (alcance && !hablaDePlata && (sumarIng || restarIng)) {
    const ing = detectarIngrediente(t, ingredientes)
    if (ing) {
      // La cantidad sólo cuenta si viene pegada a la unidad del ingrediente:
      // "30 g de bacon". Un número suelto puede ser cualquier cosa.
      const unidad = ing.unidad === 'un.' ? 'un' : ing.unidad
      const cant = t.match(new RegExp(`([\\d.,]+)\\s*${unidad}\\b`))
      return {
        operacion: sumarIng ? 'agregar_ingrediente' : 'quitar_ingrediente',
        alcance,
        ingrediente: ing.nombre,
        cantidad: cant ? numeroDe(cant[1]) : null,
        fuente: 'local',
      }
    }
  }

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
export function contextoDelNegocio(productos, descuentos = [], ingredientes = [], grupos = []) {
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
    'Cada hamburguesa es un combo: ya viene con papas fritas incluidas en el precio.',
    descuentos.length ? `Descuentos existentes: ${descuentos.map((d) => d.nombre).join(', ')}.` : '',
    '',
    'CATÁLOGO (nombre [subcategoría] precio):',
    ...[...porCategoria.entries()].map(([cat, items]) => `${cat}: ${items.join(' | ')}`),
    '',
    ingredientes.length
      ? `INGREDIENTES CARGADOS (nombre exacto y unidad — usá estos nombres tal cual):\n${ingredientes
          .map((i) => `${i.nombre} (${i.unidad})`)
          .join(' | ')}`
      : '',
    grupos.length
      ? `GRUPOS DE OPCIONES (nombre exacto — opciones):\n${grupos
          .map((g) => `${g.nombre}: ${(g.opciones ?? []).map((o) => o.nombre).join(', ')}`)
          .join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

const INSTRUCCIONES = `Sos el asistente de una hamburguesería. Traducís lo que pide el encargado a un plan estructurado. No escribís nada vos: el sistema le muestra el plan al encargado y él confirma.

Podés hacer diez cosas y ninguna más:
PRECIOS: subir o bajar un porcentaje (ajustar_porcentaje), sumar o restar un monto fijo (ajustar_monto), poner un precio exacto (fijar_precio), activar un descuento (activar_promo), desactivar un descuento (desactivar_promo).
RECETAS: agregar un ingrediente (agregar_ingrediente), sacar un ingrediente (quitar_ingrediente), cambiar cuánto lleva un ingrediente (cambiar_cantidad).
OPCIONES: hacer que un producto ofrezca un grupo de opciones (agregar_modificador) o que deje de ofrecerlo (quitar_modificador).

Si te piden cualquier otra cosa — borrar productos, mover stock, cambiar pedidos, tocar la caja — devolvé operacion "ninguna" y explicá en "aclaracion" qué sí podés hacer.

Reglas:
- "gaseosas" = categoría Bebidas. "birras" = Cerveza. "burgas"/"hamburguesas"/"combos" = las categorías de hamburguesas.
- "dobles", "triples", "simples" son subcategorías, no categorías.
- Si dicen "todo" o "toda la carta", el alcance es todos.
- Los montos vienen en pesos argentinos; "2000 pesos menos" es ajustar_monto con valor -2000.
- Si la suba es por inflación, redondeá a 50 salvo que pidan otra cosa.
- En las recetas, "ingrediente" tiene que ser EXACTAMENTE uno de los nombres de la lista INGREDIENTES CARGADOS. Si lo que piden no está en esa lista, devolvé operacion "ninguna" y avisá que primero hay que cargarlo en Ingredientes.
- "cantidad" va en la unidad del ingrediente (g, ml, un.). Si no dicen cuánto, dejá cantidad vacío y el sistema copia la cantidad que ese ingrediente ya lleva en otras recetas.
- Agregar un ingrediente NO cambia el precio de venta: sólo sube el costo. Si el encargado quiere cobrarlo, es otro pedido aparte.
- En las opciones, "grupo" tiene que ser EXACTAMENTE uno de los nombres de la lista GRUPOS DE OPCIONES.
- Ojo con la diferencia: "que la Critical lleve cebolla crispy" es cambiar la receta (viene siempre); "que el cliente pueda elegir cebolla crispy" es agregar el grupo de opciones.
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
    ingrediente: { type: 'string' },
    cantidad: { type: 'number' },
    grupo: { type: 'string' },
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
  if (plan.operacion === 'agregar_ingrediente')
    return `Agregar ${plan.ingrediente} a la receta de ${cuantos}`
  if (plan.operacion === 'quitar_ingrediente')
    return `Sacar ${plan.ingrediente} de la receta de ${cuantos}`
  if (plan.operacion === 'cambiar_cantidad')
    return `Dejar ${plan.ingrediente} en ${plan.cantidad} en ${cuantos}`
  if (plan.operacion === 'agregar_modificador')
    return `Ofrecer «${plan.grupo}» en ${cuantos}`
  if (plan.operacion === 'quitar_modificador')
    return `Dejar de ofrecer «${plan.grupo}» en ${cuantos}`
  return ''
}
