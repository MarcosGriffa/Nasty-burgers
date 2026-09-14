import { modoDemo, supabase } from './supabase'
import { LOCALES } from '../data/negocio'
import { COMANDAS_EJEMPLO, historialDemo } from './demo'

export const ESTADOS = {
  pendiente: { label: 'Pendiente', color: 'flame' },
  preparando: { label: 'Preparando', color: 'amber' },
  en_envio: { label: 'En envío', color: 'amber' },
  listo: { label: 'Listo para retirar', color: 'amber' },
  entregado: { label: 'Entregado', color: 'ash' },
  rechazado: { label: 'Rechazado', color: 'ash' },
}

/** Siguiente estado segun la modalidad del pedido. */
export function siguienteEstado(pedido) {
  if (pedido.estado === 'preparando')
    return pedido.modalidad === 'delivery' ? 'en_envio' : 'listo'
  if (pedido.estado === 'en_envio' || pedido.estado === 'listo') return 'entregado'
  return null
}

export const etiquetaSiguiente = (pedido) => {
  const s = siguienteEstado(pedido)
  if (s === 'en_envio') return 'Salió el envío'
  if (s === 'listo') return 'Listo para retirar'
  if (s === 'entregado')
    return pedido.modalidad === 'delivery' ? 'Entregado' : 'Retirado'
  return null
}

// ---------------------------------------------------------------------------
// MODO DEMO — localStorage + BroadcastChannel, para probar el flujo sin backend
// ---------------------------------------------------------------------------

const CLAVE = 'nasty.pedidos'
const canal =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('nasty') : null

// El historial de ejemplo se arma en memoria (no ocupa el localStorage) y se
// suma a los pedidos reales para que los reportes tengan de dónde agarrarse.
let historial = null
const leerHistorial = () => {
  if (historial === null) historial = historialDemo()
  return historial
}

const leerGuardados = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || '[]')
  } catch {
    return []
  }
}

const leerDemo = () => [...leerGuardados(), ...leerHistorial()]

// Ni el evento `storage` ni BroadcastChannel avisan a la pestaña que escribio,
// asi que mantenemos ademas una lista de oyentes locales.
const oyentes = new Set()

const escribirDemo = (lista) => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista))
  } catch {
    /* modo privado sin storage: el pedido vive solo en memoria */
  }
  canal?.postMessage('cambio')
  oyentes.forEach((fn) => fn())
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function crearPedido(datos) {
  if (modoDemo) {
    const lista = leerGuardados()
    const hoy = new Date().toDateString()
    const deHoy = lista.filter((p) => new Date(p.creado_en).toDateString() === hoy)
    const pedido = {
      ...datos,
      id: crypto.randomUUID(),
      creado_en: new Date().toISOString(),
      numero: deHoy.reduce((m, p) => Math.max(m, p.numero || 0), 0) + 1,
      estado: 'pendiente',
      demora_min: null,
      efectivo_cobrado: false,
      avisado: false,
    }
    escribirDemo([pedido, ...lista])
    return pedido
  }

  const { data, error } = await supabase
    .from('pedidos')
    .insert(datos)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarPedido(id, cambios) {
  if (modoDemo) {
    const lista = leerGuardados().map((p) => (p.id === id ? { ...p, ...cambios } : p))
    escribirDemo(lista)
    return lista.find((p) => p.id === id)
  }

  const { data, error } = await supabase
    .from('pedidos')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Escucha los pedidos del dia. Devuelve una funcion para desuscribirse. */
/**
 * Cuántos días de historial se traen del servidor para los reportes.
 * El Balance grafica 9 meses, así que la ventana tiene que cubrirlos: con
 * menos, los meses más viejos del gráfico dan siempre cero.
 */
export const VENTANA_DIAS = 300

export function suscribirPedidos(alCambiar) {
  if (modoDemo) {
    const emitir = () => alCambiar(leerDemo())
    emitir()
    const onStorage = (e) => {
      if (e.key === CLAVE) emitir()
    }
    window.addEventListener('storage', onStorage)
    canal?.addEventListener('message', emitir)
    oyentes.add(emitir)
    return () => {
      window.removeEventListener('storage', onStorage)
      canal?.removeEventListener('message', emitir)
      oyentes.delete(emitir)
    }
  }

  let vivo = true
  // Los reportes miran hasta 3 meses para atrás, así que el panel se trae esa
  // ventana y cada pantalla filtra lo suyo. El tablero de comandas se queda
  // solo con los de hoy.
  const desde = new Date()
  desde.setHours(0, 0, 0, 0)
  desde.setDate(desde.getDate() - VENTANA_DIAS)

  const traer = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .gte('creado_en', desde.toISOString())
      .order('creado_en', { ascending: false })
      .limit(20000)
    if (!error && vivo) alCambiar(data ?? [])
  }

  traer()
  const canalRt = supabase
    .channel('pedidos-panel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, traer)
    .subscribe()

  return () => {
    vivo = false
    supabase.removeChannel(canalRt)
  }
}

// ---------------------------------------------------------------------------
// Sesion del empleado
// ---------------------------------------------------------------------------

const CLAVE_SESION_DEMO = 'nasty.sesion'
const oyentesSesion = new Set()

export async function ingresar(email, password) {
  const mail = (email || '').trim().toLowerCase()

  // En demo no hay servidor que valide, pero sí queremos probar el circuito
  // completo: entrar con la cuenta de un local y ver solo sus comandas.
  if (modoDemo) {
    if (!LOCALES.some((l) => l.cuenta.toLowerCase() === mail)) {
      throw new Error('cuenta desconocida')
    }
    const sesion = { user: { email: mail }, demo: true }
    try {
      localStorage.setItem(CLAVE_SESION_DEMO, JSON.stringify(sesion))
    } catch {
      /* sin storage: la sesión vive en memoria */
    }
    recordarUsuario(sesion)
    oyentesSesion.forEach((fn) => fn(sesion))
    return sesion
  }

  const { error } = await supabase.auth.signInWithPassword({ email: mail, password })
  if (error) throw error
}

/**
 * Quién está usando el panel ahora mismo. Se guarda en cada pedido aceptado y
 * en cada arqueo, para que el «quién hizo qué» del turno sea real.
 */
let usuario = null
let localSesion = null

export const usuarioActual = () => usuario

/**
 * De qué local es la persona que está usando el panel. Sale de con qué mail
 * entró: benavidez@… ve solo Benavídez, escobar@… solo Escobar.
 * Si el mail no es de ningún local (por ejemplo el del dueño), devuelve null
 * y el panel muestra los dos.
 */
export const localDeSesion = () => localSesion

export function recordarUsuario(sesion) {
  usuario = sesion?.user?.email ?? null
  const mail = (usuario || '').trim().toLowerCase()
  localSesion = LOCALES.find((l) => l.cuenta.toLowerCase() === mail)?.id ?? null
}

export async function salir() {
  if (modoDemo) {
    try {
      localStorage.removeItem(CLAVE_SESION_DEMO)
    } catch {
      /* sin storage */
    }
    recordarUsuario(null)
    oyentesSesion.forEach((fn) => fn(null))
    return
  }
  await supabase.auth.signOut()
}

export function suscribirSesion(alCambiar) {
  if (modoDemo) {
    let sesion = null
    try {
      sesion = JSON.parse(localStorage.getItem(CLAVE_SESION_DEMO) || 'null')
    } catch {
      sesion = null
    }
    recordarUsuario(sesion)
    alCambiar(sesion)
    oyentesSesion.add(alCambiar)
    return () => oyentesSesion.delete(alCambiar)
  }
  supabase.auth.getSession().then(({ data }) => {
    recordarUsuario(data.session)
    alCambiar(data.session)
  })
  const { data } = supabase.auth.onAuthStateChange((_e, sesion) => {
    recordarUsuario(sesion)
    alCambiar(sesion)
  })
  return () => data.subscription.unsubscribe()
}

// ---------------------------------------------------------------------------
// Comandas de ejemplo (solo modo demo)
// ---------------------------------------------------------------------------

export function sembrarEjemplos({ soloSiVacio = false } = {}) {
  if (!modoDemo) return
  const lista = leerGuardados()
  if (soloSiVacio && lista.length > 0) return
  const desde = lista.reduce((m, p) => Math.max(m, p.numero || 0), 0)
  const nuevos = COMANDAS_EJEMPLO.map((c, i) => ({
    ...c,
    id: crypto.randomUUID(),
    numero: desde + i + 1,
  }))
  escribirDemo([...nuevos.reverse(), ...lista])
}

export function vaciarDemo() {
  if (!modoDemo) return
  escribirDemo([])
}
