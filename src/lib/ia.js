/**
 * La conexión con Gemini, en un solo lugar.
 *
 * El sistema puede correr de dos maneras y las dos tienen que andar:
 *
 *  1. Publicado en internet (Vercel / Netlify). La key vive en el servidor,
 *     en la variable GEMINI_API_KEY, y el navegador le pega a /api/asistente.
 *     Es la forma correcta: la key no sale del servidor.
 *
 *  2. Como archivo suelto en la PC del local. No hay servidor, así que la key
 *     se carga desde el panel (Configuración → Asistente IA) y queda guardada
 *     en ESE navegador. No viaja dentro del archivo, así que se puede pasar el
 *     HTML a otra máquina sin regalar la key — pero cualquiera que use esa PC
 *     puede leerla desde el inspector. Para un local está bien; para publicar,
 *     usar la opción 1.
 */

const MODELO = 'gemini-flash-lite-latest'
const CLAVE = 'nasty.gemini'

// ---------------------------------------------------------------------------
// La key
// ---------------------------------------------------------------------------

export function claveGuardada() {
  try {
    return localStorage.getItem(CLAVE) || ''
  } catch {
    return ''
  }
}

export function guardarClave(valor) {
  try {
    const limpia = (valor || '').trim()
    if (limpia) localStorage.setItem(CLAVE, limpia)
    else localStorage.removeItem(CLAVE)
  } catch {
    /* sin storage: la IA queda apagada en este navegador */
  }
}

/** Sirve para mostrarla sin exponerla entera. */
export const claveOculta = (k) =>
  k && k.length > 10 ? `${k.slice(0, 6)}${'•'.repeat(12)}${k.slice(-4)}` : ''

/**
 * ¿Hay IA disponible? Si está publicado siempre decimos que sí (la función
 * serverless puede estar del otro lado); si es el archivo suelto, depende de
 * que alguien haya cargado la key.
 */
export const hayIA = () =>
  !!claveGuardada() || !!import.meta.env.VITE_GEMINI_API_KEY || !esArchivoLocal()

const esArchivoLocal = () =>
  typeof window !== 'undefined' && window.location.protocol === 'file:'

// ---------------------------------------------------------------------------
// La llamada
// ---------------------------------------------------------------------------

/**
 * Le manda una consulta a Gemini y devuelve el texto de la respuesta.
 *
 * @param {string} modo           'precios' o 'preguntar'. Es lo único que ve el
 *                                servidor: el prompt lo pone él, no el navegador.
 * @param {string} instrucciones  el system prompt, para cuando se va directo a Google
 * @param {string} texto          lo que se le pregunta
 * @param {string} [contexto]     los datos del negocio
 * @param {object} [esquema]      si se pasa, obliga a responder ese JSON exacto
 */
export async function preguntarAGemini({ modo = 'preguntar', instrucciones, texto, contexto, esquema }) {
  const cuerpo = {
    contents: [{ role: 'user', parts: [{ text: contexto ? `${contexto}\n\n${texto}` : texto }] }],
    systemInstruction: { parts: [{ text: instrucciones }] },
    generationConfig: {
      temperature: 0,
      ...(esquema ? { responseMimeType: 'application/json', responseSchema: esquema } : {}),
    },
  }

  const respuesta = await llamar(cuerpo, { modo, texto, contexto })
  const datos = await respuesta.json()

  // La función serverless devuelve { plan } ya listo; Google devuelve candidates.
  if (datos.plan !== undefined) return datos.plan
  const salida = datos?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!salida) throw new Error('La IA no devolvió nada. Probá de nuevo.')
  return salida
}

async function llamar(cuerpo, paraServidor) {
  const endpoint = import.meta.env.VITE_ASISTENTE_URL || '/api/asistente'
  const key = claveGuardada() || import.meta.env.VITE_GEMINI_API_KEY

  // Con el archivo suelto no hay servidor: se va derecho a Google.
  if (!esArchivoLocal()) {
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paraServidor),
      })
      // En desarrollo el server devuelve el index.html para cualquier ruta: si
      // no vino JSON, la función serverless no está desplegada.
      const tipo = r.headers.get('content-type') || ''
      if (r.ok && tipo.includes('application/json')) return r
    } catch {
      /* seguimos con la key local, si hay */
    }
  }

  if (!key) throw new Error('sin-ia')

  let r
  try {
    r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) },
    )
  } catch {
    // fetch tira acá cuando no hay internet o el navegador bloqueó la llamada
    throw new Error('No se pudo llegar a Google. Fijate si hay internet.')
  }
  if (r.status === 400 || r.status === 403) throw new Error('clave-mala')
  if (r.status === 429) throw new Error('Se llegó al límite de consultas por minuto. Esperá un momento.')
  if (!r.ok) throw new Error('La IA no respondió. Fijate si hay internet.')
  return r
}

/**
 * Prueba la conexión con una consulta mínima. Alcanza con que conteste algo:
 * si la clave estuviera mal, llamar() ya habría tirado 'clave-mala'.
 */
export async function probarClave() {
  const salida = await preguntarAGemini({
    modo: 'preguntar',
    instrucciones: 'Respondé únicamente la palabra OK.',
    texto: 'Decí OK.',
  })
  return !!String(salida ?? '').trim()
}
