import { useEffect, useState } from 'react'
import { modoDemo, supabase } from './supabase'
import { normalizar } from './utils'

/**
 * Almacén genérico de colecciones.
 *
 * Modo demo   -> localStorage + BroadcastChannel (se sincroniza entre pestañas).
 * Con Supabase -> una tabla por colección, con realtime.
 *
 * Cada pantalla del panel usa useColeccion('productos') y se olvida del resto.
 */

const canal =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('nasty-datos') : null

const oyentes = new Map() // nombre -> Set<fn>

const clave = (nombre) => `nasty.${nombre}`

function leer(nombre) {
  try {
    return JSON.parse(localStorage.getItem(clave(nombre)) || '[]')
  } catch {
    return []
  }
}

function escribir(nombre, lista) {
  try {
    localStorage.setItem(clave(nombre), JSON.stringify(lista))
  } catch {
    /* sin storage: los datos viven solo en memoria de esta pestaña */
  }
  canal?.postMessage(nombre)
  oyentes.get(nombre)?.forEach((fn) => fn())
}

canal?.addEventListener('message', (e) => {
  oyentes.get(e.data)?.forEach((fn) => fn())
})

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key?.startsWith('nasty.')) return
    const nombre = e.key.slice('nasty.'.length)
    oyentes.get(nombre)?.forEach((fn) => fn())
  })
}

const nuevoId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`

// ---------------------------------------------------------------------------
// Semillas: la primera vez que se abre una colección vacía se cargan los datos
// iniciales (los que ya existen en Fudo), para que el panel no arranque en cero.
// ---------------------------------------------------------------------------

const SEMBRADO = 'nasty.sembrado.'

function sembrarSiHaceFalta(nombre, semilla) {
  if (!semilla || !semilla.length) return
  try {
    if (localStorage.getItem(SEMBRADO + nombre)) return
    localStorage.setItem(SEMBRADO + nombre, '1')
  } catch {
    return
  }
  if (leer(nombre).length > 0) return
  escribir(
    nombre,
    semilla.map((f) => ({ id: nuevoId(), creado_en: new Date().toISOString(), ...f })),
  )
}

/**
 * Puesta al día de la carta.
 *
 * Los datos ya estaban sembrados en las computadoras donde se venía probando
 * el sistema, así que la semilla no se vuelve a cargar y los cambios de la
 * carta no llegarían nunca. Esto los aplica una sola vez.
 *
 * Se sincroniza lo que DEFINE la carta —la descripción, la receta, el costo
 * que sale de esa receta, la foto y el tilde de destacado— y se dan de baja
 * los productos que ya no existen. NO se toca el precio ni el stock: eso es
 * del local y se maneja desde el panel.
 *
 * Al cambiar de versión (v4, v5...) el parche vuelve a correr una vez.
 */
const PARCHE = 'nasty.parche.carta.v5'

// Productos que ya no existen y hay que sacar de las computadoras
// donde quedaron sembrados.
const DADOS_DE_BAJA = ['dlx', 'dlx2', 'dlx3']

// Ingredientes que cambiaron de nombre.
const RENOMBRADOS = { 'Cebolla grillada': 'Cebolla smashed' }

const yaCorrio = (nombre) => {
  try {
    return !!localStorage.getItem(`${PARCHE}.${nombre}`)
  } catch {
    return true
  }
}

const marcarCorrido = (nombre) => {
  try {
    localStorage.setItem(`${PARCHE}.${nombre}`, '1')
  } catch {
    /* sin storage */
  }
}

function ponerAlDiaIngredientes(semilla = []) {
  const actuales = leer('ingredientes')
  if (!actuales.length) return
  let cambio = false
  const nuevos = actuales.map((i) => {
    const nuevoNombre = RENOMBRADOS[i.nombre]
    if (!nuevoNombre) return i
    cambio = true
    return { ...i, nombre: nuevoNombre }
  })

  // Ingredientes que la carta empezó a usar y el local todavía no tiene
  // cargados (el Sazonado Nasty de las papas, por ejemplo). Entran con stock 0:
  // cuánto hay en la heladera lo sabe el local, no la semilla.
  const tengo = new Set(nuevos.map((i) => i.nombre))
  semilla.forEach((s) => {
    if (tengo.has(s.nombre)) return
    cambio = true
    nuevos.push({
      id: nuevoId(),
      creado_en: new Date().toISOString(),
      ...s,
      stock: 0,
    })
  })

  if (cambio) escribir('ingredientes', nuevos)
}

function ponerAlDiaProductos(semilla) {
  const actuales = leer('productos')
  if (!actuales.length) return
  const porCodigo = new Map(semilla.map((p) => [p.codigo, p]))
  let cambio = false

  const vivos = actuales.filter((p) => {
    if (DADOS_DE_BAJA.includes(p.codigo)) {
      cambio = true
      return false
    }
    return true
  })

  const nuevos = vivos.map((p) => {
    const base = porCodigo.get(p.codigo)
    if (!base) return p
    const cambios = {}

    // la foto: se completa si no tiene, o si quedó con el nombre genérico
    const generica = p.img && !/-[sdt]\.(jpe?g|png|webp)$/i.test(p.img)
    if (base.img && (!p.img || generica) && p.img !== base.img) cambios.img = base.img

    // el destacado sale de la carta: es la lista de «Las que más salen»
    if (!!p.destacado !== !!base.destacado) cambios.destacado = !!base.destacado

    // qué lleva la hamburguesa: descripción y receta van juntas, para que el
    // cliente y la cocina lean lo mismo
    if (base.descripcion && p.descripcion !== base.descripcion) {
      cambios.descripcion = base.descripcion
    }
    if (base.receta?.length && JSON.stringify(p.receta) !== JSON.stringify(base.receta)) {
      cambios.receta = base.receta
      // el costo se recalcula con la receta nueva, salvo que esté puesto a mano
      if (!p.costo_manual) cambios.costo = base.costo
    }

    // qué puede elegir el cliente. Se completa una sola vez, cuando el producto
    // todavía no tiene ninguno: si el local ya le sacó o le agregó un grupo a
    // mano desde el panel, eso manda.
    if (base.modificadores?.length && !(p.modificadores ?? []).length) {
      cambios.modificadores = base.modificadores
    }

    if (!Object.keys(cambios).length) return p
    cambio = true
    return { ...p, ...cambios }
  })

  if (cambio) escribir('productos', nuevos)
}

/**
 * Los grupos de opciones viejos eran una maqueta: tenían nombre y poco más,
 * sin las opciones que ve el cliente. Como no hay nada del local que valga la
 * pena conservar ahí, se reemplazan enteros por los de la carta.
 */
function ponerAlDiaGrupos(semilla) {
  const actuales = leer('grupos_modificadores')
  if (!actuales.length) return
  const alguno = actuales.some((g) => (g.opciones ?? []).length)
  if (alguno) return // ya están los nuevos, o el local los editó
  escribir(
    'grupos_modificadores',
    semilla.map((g) => ({ id: nuevoId(), creado_en: new Date().toISOString(), ...g })),
  )
}

/**
 * Los medios de pago ya sembrados no tienen el campo `clave`, que es lo que
 * engancha el arancel con la forma de pago del pedido. Sin él la comisión
 * quedaría en cero para todos y el panel diría "sin asignar" en una instalación
 * que en realidad ya estaba bien configurada.
 *
 * Se completa una sola vez, cruzando por nombre. Es lo único razonable acá: la
 * fila vieja no tiene otra cosa con qué identificarse. De ahí en más manda la
 * clave, y renombrar el medio en el panel ya no rompe nada.
 */
const CLAVE_POR_NOMBRE = {
  efectivo: 'efectivo',
  mercadopago: 'mercadopago',
  transferencia: 'transferencia',
}

// "Mercado Pago", "mercado pago" y "MercadoPago" son el mismo medio
const aClave = (s) => normalizar(String(s || '')).replace(/[^a-z0-9]/g, '')

function ponerAlDiaMediosPago() {
  const actuales = leer('medios_pago')
  if (!actuales.length) return
  let cambio = false
  const nuevos = actuales.map((medio) => {
    if (medio.clave !== undefined) return medio
    const clave = CLAVE_POR_NOMBRE[aClave(medio.nombre)] ?? ''
    cambio = true
    return { ...medio, clave }
  })
  if (cambio) escribir('medios_pago', nuevos)
}

const AL_DIA = ['productos', 'ingredientes', 'grupos_modificadores', 'medios_pago']

function ponerAlDia(nombre, semilla) {
  if (!AL_DIA.includes(nombre)) return
  if (yaCorrio(nombre)) return
  // los ingredientes se renombran primero: las recetas nuevas ya los nombran así
  if (nombre === 'ingredientes') ponerAlDiaIngredientes(semilla)
  else if (nombre === 'grupos_modificadores') ponerAlDiaGrupos(semilla)
  else if (nombre === 'medios_pago') ponerAlDiaMediosPago()
  else ponerAlDiaProductos(semilla)
  marcarCorrido(nombre)
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function crear(nombre, datos) {
  if (modoDemo) {
    const fila = { id: nuevoId(), creado_en: new Date().toISOString(), ...datos }
    escribir(nombre, [fila, ...leer(nombre)])
    return fila
  }
  const { data, error } = await supabase.from(nombre).insert(datos).select().single()
  if (error) throw error
  return data
}

export async function actualizar(nombre, id, cambios) {
  if (modoDemo) {
    escribir(
      nombre,
      leer(nombre).map((f) => (f.id === id ? { ...f, ...cambios } : f)),
    )
    return
  }
  const { error } = await supabase.from(nombre).update(cambios).eq('id', id)
  if (error) throw error
}

export async function eliminar(nombre, id) {
  if (modoDemo) {
    escribir(
      nombre,
      leer(nombre).filter((f) => f.id !== id),
    )
    return
  }
  const { error } = await supabase.from(nombre).delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Un canal por tabla, compartido
//
// Acá había un bug que apagaba la aplicación entera con la base conectada:
// cada pantalla pedía su propio canal con el MISMO nombre («col-productos»), y
// Supabase, cuando le pedís un canal con un nombre que ya existe, te devuelve
// el que ya tenía. Dos pantallas mirando la misma tabla terminaban con el mismo
// canal, y la primera en cerrarse se lo llevaba puesto a la otra: pantalla en
// negro.
//
// Ahora hay UN estado por tabla, con sus oyentes, su canal y su lectura en
// curso. El canal se crea con la primera pantalla y se da de baja recién
// cuando se va la última. Y los errores de la base ya no se tragan en
// silencio: viajan hasta el hook, que los muestra.
// ---------------------------------------------------------------------------

const vivas = new Map()
let nCanal = 0

const estadoDe = (nombre) => {
  let e = vivas.get(nombre)
  if (!e) {
    e = { oyentes: new Set(), estado: null, canal: null, trayendo: null }
    vivas.set(nombre, e)
  }
  return e
}

/** Relee la tabla. Si ya hay una lectura en curso, se cuelga de esa. */
function traerTabla(nombre) {
  const v = estadoDe(nombre)
  v.trayendo ||= (async () => {
    const { data, error } = await supabase.from(nombre).select('*')
    v.trayendo = null
    if (!vivas.has(nombre)) return // se dio de baja mientras leíamos
    if (error) {
      console.error(`No pude leer «${nombre}» de la base:`, error)
      v.estado = { filas: [], error }
    } else {
      v.estado = { filas: data ?? [], error: null }
    }
    v.oyentes.forEach((fn) => fn(v.estado.filas, v.estado.error))
  })()
  return v.trayendo
}

export function suscribir(nombre, alCambiar, semilla) {
  // colección vacía: se usa cuando una pantalla no necesita datos relacionados
  if (!nombre || nombre === 'noop') {
    alCambiar([])
    return () => {}
  }

  if (modoDemo) {
    sembrarSiHaceFalta(nombre, semilla)
    ponerAlDia(nombre, semilla)
    const emitir = () => alCambiar(leer(nombre))
    emitir()
    if (!oyentes.has(nombre)) oyentes.set(nombre, new Set())
    oyentes.get(nombre).add(emitir)
    return () => oyentes.get(nombre)?.delete(emitir)
  }

  const v = estadoDe(nombre)
  v.oyentes.add(alCambiar)
  // si otra pantalla ya leyó esta tabla, esta arranca con los datos puestos
  if (v.estado) alCambiar(v.estado.filas, v.estado.error)

  v.canal ||= supabase
    .channel(`col-${nombre}-${++nCanal}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: nombre }, () =>
      traerTabla(nombre),
    )
    .subscribe()

  traerTabla(nombre)

  return () => {
    v.oyentes.delete(alCambiar)
    if (v.oyentes.size === 0) {
      if (v.canal) supabase.removeChannel(v.canal)
      vivas.delete(nombre)
    }
  }
}

/** Reemplaza toda una colección (se usa para importar CSV). */
export function reemplazarDemo(nombre, filas) {
  if (!modoDemo) return
  escribir(
    nombre,
    filas.map((f) => ({ id: nuevoId(), creado_en: new Date().toISOString(), ...f })),
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useColeccion(nombre, semilla) {
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  // si la base contesta mal, la pantalla tiene que poder decirlo en vez de
  // quedarse cargando para siempre
  const [error, setError] = useState(null)

  useEffect(() => {
    setCargando(true)
    setError(null)
    const baja = suscribir(
      nombre,
      (f, err) => {
        setFilas(f)
        setError(err ?? null)
        setCargando(false)
      },
      semilla,
    )
    return baja
    // la semilla es un módulo constante: no entra en las dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre])

  return {
    filas,
    cargando,
    error,
    crear: (d) => crear(nombre, d),
    actualizar: (id, c) => actualizar(nombre, id, c),
    eliminar: (id) => eliminar(nombre, id),
  }
}
