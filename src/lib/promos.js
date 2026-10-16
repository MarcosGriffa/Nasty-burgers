/**
 * Las promos de la semana.
 *
 * El precio con promo se aplica UNA sola vez, al armar la carta (ver menu.js),
 * no en cada pantalla. Así el número que ve el cliente, el que se cobra, el que
 * se guarda en el pedido y el que sale en la comanda son siempre el mismo.
 *
 * Dos cosas que costaron encontrar y conviene no volver a romper:
 *
 * 1. No alcanza con buscar «medallón» en la receta: la Gross lleva «Bolita
 *    120 g Smash». La regla es «tiene papas fritas en la receta».
 * 2. La categoría de las hamburguesas se llama «Hamburguesas c/ Papas Fritas»,
 *    así que excluir por pedacito de texto dejaba a todas las hamburguesas
 *    afuera de su propia promo. Se comparan categorías enteras.
 */

/** Categorías que nunca entran en una promo de combo. */
const CATEGORIAS_SUELTAS = ['papas fritas', 'extras', 'bebidas', 'cerveza']

const esCategoriaSuelta = (categoria) =>
  CATEGORIAS_SUELTAS.includes(String(categoria || '').trim().toLowerCase())

/**
 * ¿Es un combo? Lleva papas fritas en la receta y no es una categoría suelta.
 * Si todavía no tiene receta cargada, se cae al nombre.
 */
export function esCombo(producto) {
  if (esCategoriaSuelta(producto?.categoria)) return false
  const receta = producto?.receta
  if (Array.isArray(receta) && receta.length) {
    return receta.some((r) => /papas fritas/i.test(String(r?.ingrediente || '')))
  }
  return /c\/ ?papas|con papas/i.test(String(producto?.nombre || ''))
}

/**
 * Las promos, indexadas por día de la semana de JS (0 = domingo).
 * Hoy viven acá; moverlas al panel es T3.6.
 */
export const PROMOS_POR_DIA = {
  3: {
    dia: 'miércoles',
    tipo: 'descuento_combo',
    monto: 2000,
    etiqueta: 'MIÉRCOLES',
    titulo: 'Miércoles de combos',
    bajada: 'Todas las hamburguesas con papas, $2.000 menos.',
    corta: '$2.000 menos en combos',
  },
  4: {
    dia: 'jueves',
    tipo: 'gaseosa_gratis',
    etiqueta: 'JUEVES',
    titulo: 'Jueves con gaseosa',
    bajada: 'Con cada hamburguesa con papas, una gaseosa de regalo.',
    corta: 'gaseosa de regalo por combo',
  },
}

/** La promo de hoy, o null si hoy no hay. */
export const promoDelDia = (fecha = new Date()) => PROMOS_POR_DIA[fecha.getDay()] ?? null

/**
 * El precio que se cobra hoy. El piso del 30 % es una red: una promo mal
 * cargada no puede dejar un producto casi regalado.
 */
export function precioConPromo(producto, precio, fecha = new Date()) {
  const promo = promoDelDia(fecha)
  const base = Number(precio) || 0
  if (!promo || promo.tipo !== 'descuento_combo' || !esCombo(producto)) return base
  return Math.max(Math.round(base * 0.3), base - promo.monto)
}
