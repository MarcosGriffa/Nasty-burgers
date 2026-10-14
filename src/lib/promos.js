/**
 * LAS PROMOS DE LA SEMANA
 *
 * Antes la promo del miércoles estaba hecha a mano: tres productos «Melt 2.0»
 * duplicados, en una categoría aparte, con el 10 % ya descontado en el precio.
 * Eso trae tres problemas: la promo se veía los siete días, el mismo producto
 * aparecía dos veces en la carta, y cambiar la promo era cambiar productos.
 *
 * Ahora la promo depende del día y se calcula sobre la carta de verdad. Un solo
 * lugar decide qué promo corre hoy, y de acá lo leen la web, el mostrador del
 * panel y los textos que ve el cliente.
 *
 * Decisiones de Marcos (14/10):
 * - Miércoles: toda hamburguesa con papas, $2.000 menos.
 * - Jueves: con cada combo, una gaseosa a elección de regalo.
 * - El resto de los días, precio normal.
 * - Las promos valen siempre, también en delivery (a diferencia del 10 % por
 *   pagar en efectivo, que es solo para el que retira).
 */

// Categorías que nunca son combo, por más que la receta diga «papas fritas»:
// la porción de papas sola, los extras y todo lo que se toma.
//
// Se comparan enteras y no por pedacito: la categoría de las hamburguesas se
// llama «Hamburguesas c/ Papas Fritas», así que buscar «papas fritas» adentro
// del nombre dejaba a TODAS las hamburguesas afuera de su propia promo.
const NUNCA_COMBO = ['papas fritas', 'extras', 'bebidas', 'cerveza']

const esCategoriaExcluida = (categoria) =>
  NUNCA_COMBO.includes(String(categoria || '').trim().toLowerCase())

/**
 * Qué es un combo: hamburguesa con papas.
 *
 * Se mira la receta, que es el dato de verdad. Dos aclaraciones que costaron
 * encontrar:
 *
 * - No alcanza con buscar «medallón»: la Gross lleva «Bolita 120 g Smash». Por
 *   eso la regla es «tiene papas fritas en la receta», y lo que se excluye es
 *   la categoría, no el ingrediente de la carne.
 * - La CheeseBurger y la CheeseBurger c/ papas **no tienen receta cargada**
 *   (vienen así desde Fudo), así que ninguna regla basada en la receta las
 *   puede reconocer. Para esas se mira el nombre. Es un parche, no la solución:
 *   lo que corresponde es cargarles la receta, y mientras no la tengan tampoco
 *   descuentan stock ni calculan costo. Está anotado en el plan.
 */
export function esCombo(producto) {
  if (esCategoriaExcluida(producto?.categoria)) return false
  const receta = producto?.receta
  if (Array.isArray(receta) && receta.length) {
    return receta.some((l) => /papas fritas/i.test(String(l?.ingrediente || '')))
  }
  return /c\/ ?papas|con papas/i.test(String(producto?.nombre || ''))
}

export const PROMOS = {
  // getDay(): 0 domingo … 3 miércoles, 4 jueves.
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

/** La promo que corre hoy, o null. */
export const promoDelDia = (fecha = new Date()) => PROMOS[fecha.getDay()] ?? null

/**
 * El precio que paga el cliente hoy por este producto.
 *
 * Nunca por debajo de cero, y nunca más barato que el 30 % del precio de lista:
 * si alguien carga una hamburguesa de $2.500 un miércoles, no se regala. Es un
 * freno, no una regla del negocio; si hiciera falta otra cosa, se habla.
 */
export function precioConPromo(producto, precioLista, fecha = new Date()) {
  const promo = promoDelDia(fecha)
  const base = Number(precioLista) || 0
  if (!promo || promo.tipo !== 'descuento_combo' || !esCombo(producto)) return base
  return Math.max(Math.round(base * 0.3), base - promo.monto)
}
