/**
 * CRUZAR LA LÍNEA DE UN PEDIDO CON EL PRODUCTO DE LA CARTA
 *
 * Por qué existe este archivo: el cruce se hacía por NOMBRE, en tres lugares
 * distintos —el descuento de stock, el consumo de ingredientes y el ranking de
 * rentabilidad—. Renombrar «Nasty Simple» a «Nasty Clásica» desde el panel
 * alcanzaba para que:
 *
 *   · el stock dejara de descontarse (el inventario queda alto, se compra de
 *     menos y un sábado falta carne),
 *   · el costo del producto se leyera como el 25 % del precio, inventado,
 *   · y el producto desapareciera del consumo de ingredientes.
 *
 * Nada de eso rompe una pantalla. Simplemente los números dejan de ser
 * verdad, y nadie se entera hasta fin de mes.
 *
 * El orden de búsqueda no es caprichoso:
 *
 *   1. `codigo` — la clave del negocio. Es lo único que el local NO cambia al
 *      editar la carta, y por eso manda.
 *   2. `id` — la fila de la base. Sirve para productos sin código cargado.
 *   3. `nombre` — solo para los pedidos viejos, guardados antes de que la
 *      línea llevara el código. Es la red de abajo, no la primera opción.
 */

const texto = (v) => String(v ?? '').trim()

/** El producto de la carta al que corresponde esta línea del pedido, o null. */
export function productoDeLinea(linea, productos = []) {
  if (!linea) return null

  const codigo = texto(linea.codigo)
  if (codigo) {
    const porCodigo = productos.find((p) => texto(p.codigo) === codigo)
    if (porCodigo) return porCodigo
  }

  if (linea.id) {
    const porId = productos.find((p) => p.id === linea.id)
    if (porId) return porId
  }

  const nombre = texto(linea.nombre)
  if (nombre) {
    const porNombre = productos.find((p) => texto(p.nombre) === nombre)
    if (porNombre) return porNombre
  }

  return null
}

/**
 * Las líneas del pedido que no se pudieron cruzar con ningún producto.
 *
 * Se devuelven para que la pantalla LO DIGA. Antes el descuento de stock
 * simplemente no pasaba, en silencio: el encargado aceptaba la comanda, veía
 * todo normal y el inventario quedaba mal sin que nada se lo avisara.
 */
export function lineasHuerfanas(items = [], productos = []) {
  return items.filter((l) => !productoDeLinea(l, productos)).map((l) => texto(l.nombre))
}

/** Lo que hay que guardar en la línea del pedido para poder cruzarla después. */
export const identidadDeProducto = (item) => ({
  id: item?.id ?? null,
  codigo: item?.codigo ?? null,
  nombre: item?.nombre ?? '',
})
