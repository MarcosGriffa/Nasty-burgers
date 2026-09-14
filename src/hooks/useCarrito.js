import { useCallback, useMemo, useState } from 'react'
import { NEGOCIO } from '../data/negocio'

export function useCarrito() {
  const [lineas, setLineas] = useState([]) // [{ item, cantidad }]

  const agregar = useCallback((item) => {
    setLineas((prev) => {
      const i = prev.findIndex((l) => l.item.id === item.id)
      if (i === -1) return [...prev, { item, cantidad: 1 }]
      const copia = [...prev]
      copia[i] = { ...copia[i], cantidad: copia[i].cantidad + 1 }
      return copia
    })
  }, [])

  const quitar = useCallback((id) => {
    setLineas((prev) =>
      prev
        .map((l) => (l.item.id === id ? { ...l, cantidad: l.cantidad - 1 } : l))
        .filter((l) => l.cantidad > 0),
    )
  }, [])

  const eliminar = useCallback((id) => {
    setLineas((prev) => prev.filter((l) => l.item.id !== id))
  }, [])

  const vaciar = useCallback(() => setLineas([]), [])

  const cantidadDe = useCallback(
    (id) => lineas.find((l) => l.item.id === id)?.cantidad ?? 0,
    [lineas],
  )

  const unidades = useMemo(
    () => lineas.reduce((a, l) => a + l.cantidad, 0),
    [lineas],
  )

  const subtotal = useMemo(
    () => lineas.reduce((a, l) => a + l.item.precio * l.cantidad, 0),
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
    eliminar,
    vaciar,
    cantidadDe,
    unidades,
    subtotal,
    descuentoEfectivo,
  }
}
