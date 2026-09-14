import { useCallback, useMemo, useState } from 'react'
import { NEGOCIO } from '../data/negocio'

/**
 * Dos Critical Dobles no son lo mismo si una va con papas sazonadas y la otra
 * con normales: son dos líneas distintas del pedido y dos cosas distintas para
 * la cocina. Por eso la línea se identifica por el producto MÁS las opciones
 * elegidas, no solo por el producto.
 */
export const claveDeLinea = (id, opciones = []) =>
  [id, ...opciones.map((o) => `${o.grupo}:${o.opcion}`).sort()].join('|')

/** Lo que suman los extras al precio del producto. */
export const precioConOpciones = (item, opciones = []) =>
  (Number(item.precio) || 0) + opciones.reduce((a, o) => a + (Number(o.precio) || 0), 0)

export function useCarrito() {
  // [{ clave, item, opciones, cantidad }]
  const [lineas, setLineas] = useState([])

  const agregar = useCallback((item, opciones = []) => {
    const clave = claveDeLinea(item.id, opciones)
    setLineas((prev) => {
      const i = prev.findIndex((l) => l.clave === clave)
      if (i === -1) return [...prev, { clave, item, opciones, cantidad: 1 }]
      const copia = [...prev]
      copia[i] = { ...copia[i], cantidad: copia[i].cantidad + 1 }
      return copia
    })
  }, [])

  const quitar = useCallback((clave) => {
    setLineas((prev) =>
      prev
        .map((l) => (l.clave === clave ? { ...l, cantidad: l.cantidad - 1 } : l))
        .filter((l) => l.cantidad > 0),
    )
  }, [])

  const eliminar = useCallback((clave) => {
    setLineas((prev) => prev.filter((l) => l.clave !== clave))
  }, [])

  const vaciar = useCallback(() => setLineas([]), [])

  /**
   * Sacar una unidad desde la tarjeta del menú, donde no se sabe con qué
   * opciones se agregó: se le saca a la última línea de ese producto.
   */
  const quitarPorProducto = useCallback((id) => {
    setLineas((prev) => {
      let i = -1
      prev.forEach((l, j) => {
        if (l.item.id === id) i = j
      })
      if (i === -1) return prev
      const copia = [...prev]
      copia[i] = { ...copia[i], cantidad: copia[i].cantidad - 1 }
      return copia.filter((l) => l.cantidad > 0)
    })
  }, [])

  /** Cuántas unidades del producto hay en el carrito, con cualquier opción. */
  const cantidadDe = useCallback(
    (id) => lineas.filter((l) => l.item.id === id).reduce((a, l) => a + l.cantidad, 0),
    [lineas],
  )

  const unidades = useMemo(() => lineas.reduce((a, l) => a + l.cantidad, 0), [lineas])

  const subtotal = useMemo(
    () => lineas.reduce((a, l) => a + precioConOpciones(l.item, l.opciones) * l.cantidad, 0),
    [lineas],
  )

  const descuentoEfectivo = useCallback(
    (pago) => (pago === 'efectivo' ? Math.round(subtotal * NEGOCIO.promoEfectivo) : 0),
    [subtotal],
  )

  return {
    lineas,
    agregar,
    quitar,
    quitarPorProducto,
    eliminar,
    vaciar,
    cantidadDe,
    unidades,
    subtotal,
    descuentoEfectivo,
  }
}
