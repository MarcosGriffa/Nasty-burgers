import { createClient } from '@supabase/supabase-js'

// `import.meta.env` lo inyecta Vite al buildear. Corriendo los tests con node
// pelado no existe, y leerle una propiedad a undefined tiraba todo abajo: no se
// podia probar NADA que importara, aunque sea de rebote, este archivo. Con el
// `?.` el modulo se puede importar en cualquier lado y queda en modo demo.
const entorno = import.meta.env ?? {}
const url = entorno.VITE_SUPABASE_URL
const anon = entorno.VITE_SUPABASE_ANON_KEY

/**
 * Si no hay credenciales, la app entra en MODO DEMO: los pedidos se guardan
 * en el navegador y se sincronizan entre pestañas del mismo equipo.
 * Sirve para mostrar el flujo; no sirve para operar el local.
 */
export const supabase = url && anon ? createClient(url, anon) : null
export const modoDemo = !supabase
