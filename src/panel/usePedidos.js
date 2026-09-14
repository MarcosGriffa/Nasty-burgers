import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  actualizarPedido,
  localDeSesion,
  siguienteEstado,
  suscribirPedidos,
  usuarioActual,
} from '../lib/pedidos'
import { imprimirComandaCocina } from '../lib/imprimir'
import { MENSAJES } from '../data/negocio'
import { linkWhatsapp, telefonoWhatsapp } from '../lib/utils'
import { actualizar as actualizarFila, suscribir } from '../lib/almacen'
import { cantidadBruta } from '../lib/menu'
import { INGREDIENTES, PRODUCTOS } from '../data/semillas'

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
    setTimeout(() => ctx.close(), 800)
  } catch {
    /* el navegador todavía no permite audio: no pasa nada */
  }
}

const leerPref = (k, def) => {
  try {
    const v = localStorage.getItem(k)
    return v === null ? def : JSON.parse(v)
  } catch {
    return def
  }
}

/**
 * Fuente única de pedidos para todo el panel: la suscripción, el aviso sonoro
 * de comanda nueva y la impresión automática de la comanda al aceptar.
 */
/**
 * Al aceptar un pedido se descuenta el stock de cada ingrediente según la
 * receta del producto. Solo para los productos que tienen tildado
 * "Descontar stock al venderlo".
 */
async function descontarStock(pedido, productos, ingredientes) {
  const gasto = new Map()
  ;(pedido.items || []).forEach((linea) => {
    const prod = productos.find((p) => p.nombre === linea.nombre)
    if (!prod?.controlar_stock || !prod.receta?.length) return
    prod.receta.forEach((r) => {
      gasto.set(r.ingrediente, (gasto.get(r.ingrediente) || 0) + cantidadBruta(r) * linea.cantidad)
    })
  })

  for (const [nombre, cantidad] of gasto) {
    const ing = ingredientes.find((i) => i.nombre === nombre)
    if (!ing) continue
    await actualizarFila('ingredientes', ing.id, {
      stock: Math.round(((Number(ing.stock) || 0) - cantidad) * 1000) / 1000,
    })
  }
}

export function usePedidos() {
  const [todos, setTodos] = useState([])
  const productos = useRef([])
  const ingredientes = useRef([])
  const [sonido, setSonido] = useState(() => leerPref('nasty.sonido', true))
  const conocidos = useRef(null)

  useEffect(() => suscribirPedidos(setTodos), [])

  // Cada local ve solo lo suyo. Sale del mail con el que se entró, así que el
  // empleado de Benavídez no puede ver ni tocar las comandas de Escobar.
  const local = localDeSesion()
  const pedidos = useMemo(
    () => (local ? todos.filter((p) => p.local === local) : todos),
    [todos, local],
  )

  // El stock se descuenta con la receta del producto: hay que tener a mano
  // productos e ingredientes.
  useEffect(() => suscribir('productos', (f) => (productos.current = f), PRODUCTOS), [])
  useEffect(() => suscribir('ingredientes', (f) => (ingredientes.current = f), INGREDIENTES), [])

  useEffect(() => {
    try {
      localStorage.setItem('nasty.sonido', JSON.stringify(sonido))
    } catch {
      /* sin storage */
    }
  }, [sonido])

  useEffect(() => {
    const ids = new Set(pedidos.filter((p) => p.estado === 'pendiente').map((p) => p.id))
    if (conocidos.current === null) {
      conocidos.current = ids
      return
    }
    const hayNuevas = [...ids].some((id) => !conocidos.current.has(id))
    conocidos.current = ids
    if (hayNuevas && sonido) beep()
  }, [pedidos, sonido])

  const aceptar = useCallback((pedido, minutos, avisarAhora) => {
    // La ventana de WhatsApp se abre dentro del mismo click, si no el
    // navegador la bloquea como popup.
    if (avisarAhora) {
      const texto = MENSAJES.aceptado({
        nombre: pedido.cliente_nombre,
        numero: pedido.numero,
        minutos,
        modalidad: pedido.modalidad,
        local: pedido.local,
        direccion: pedido.direccion,
        subtotal: pedido.subtotal,
        descuento: pedido.descuento,
        envio: pedido.envio,
        total: pedido.total,
      })
      window.open(
        linkWhatsapp(telefonoWhatsapp(pedido.cliente_telefono), texto),
        '_blank',
        'noopener',
      )
    }
    if (leerPref('nasty.autoimprimir', true)) {
      imprimirComandaCocina({ ...pedido, estado: 'preparando', demora_min: minutos })
    }
    if (!pedido.stock_descontado) {
      descontarStock(pedido, productos.current, ingredientes.current)
    }
    return actualizarPedido(pedido.id, {
      estado: 'preparando',
      demora_min: minutos,
      avisado: !!avisarAhora,
      stock_descontado: true,
      aceptado_por: usuarioActual(),
    })
  }, [])

  const rechazar = useCallback(
    (pedido) => actualizarPedido(pedido.id, { estado: 'rechazado', avisado: true }),
    [],
  )

  const avanzar = useCallback((pedido) => {
    const estado = siguienteEstado(pedido)
    if (estado) return actualizarPedido(pedido.id, { estado })
  }, [])

  const cobrar = useCallback(
    (pedido, valor) => actualizarPedido(pedido.id, { efectivo_cobrado: valor }),
    [],
  )

  return { pedidos, local, sonido, setSonido, aceptar, rechazar, avanzar, cobrar }
}
