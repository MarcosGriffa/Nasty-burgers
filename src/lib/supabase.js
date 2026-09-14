import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Si no hay credenciales, la app entra en MODO DEMO: los pedidos se guardan
 * en el navegador y se sincronizan entre pestañas del mismo equipo.
 * Sirve para mostrar el flujo; no sirve para operar el local.
 */
export const supabase = url && anon ? createClient(url, anon) : null
export const modoDemo = !supabase
